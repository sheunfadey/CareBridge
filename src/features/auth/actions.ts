"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { REFERRAL_COOKIE } from "@/lib/referrals";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  onboardingSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ResendVerificationInput,
  type OnboardingInput,
} from "@/lib/validation/auth";
import { ROLE_PERMISSIONS } from "@/lib/permissions/registry";
import type { RoleKey } from "@/types/database";

export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] = [...(result[key] ?? []), issue.message];
  }
  return result;
}

/**
 * Account type → default role granted after onboarding. Only non-privileged
 * roles are ever granted here; privileged roles require explicit platform
 * administration.
 */
const accountTypeDefaultRole: Record<string, RoleKey> = {
  caregiver: "caregiver",
  training_provider: "training_admin",
  care_provider: "care_home_owner",
  referral_partner: "referral_partner",
  charity: "charity_admin",
  employer: "employer",
};

export async function registerAction(
  input: RegisterInput,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const env = getPublicEnv();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate limit") || error.status === 429) {
      return {
        ok: false,
        message:
          "The email service is rate limited right now, so the verification email could not be sent. Wait a few minutes and try again.",
      };
    }
    if (message.includes("invalid")) {
      return {
        ok: false,
        message: "That email address was rejected. Use an address that can receive mail.",
        fieldErrors: { email: ["Use an email address that can receive mail."] },
      };
    }
    return {
      ok: false,
      message: message.includes("already")
        ? "An account with this email already exists."
        : "We could not create your account. Try again shortly.",
    };
  }

  // Supabase hides existing accounts by returning a user with no identities and
  // sends no verification mail. Tell the person plainly so they sign in or
  // reset their password instead of waiting for an email that will not arrive.
  if (
    data.user &&
    (data.user.identities?.length ?? 0) === 0 &&
    data.user.email_confirmed_at
  ) {
    return {
      ok: false,
      message:
        "An account with this email already exists and is verified. Sign in with your password, or reset it if you have forgotten it.",
      fieldErrors: {
        email: ["This email is already registered and verified."],
      },
    };
  }

  // Record terms consent when a session is available (email confirmation may
  // be required before the session exists).
  if (data.user && data.session) {
    await supabase.from("user_consents").insert({
      user_id: data.user.id,
      consent_type: "terms_and_privacy",
      version: "1.0",
      granted: true,
    });
  }

  // Keep the referral code until the customer's first purchase so the
  // attribution function can credit the referring partner.
  if (parsed.data.referralCode) {
    const cookieStore = await cookies();
    cookieStore.set(REFERRAL_COOKIE, parsed.data.referralCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  // Email confirmation can be disabled at the project level for testing, in
  // which case Supabase returns a session straight away.
  if (data.session) {
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Account created.",
      redirectTo: "/onboarding",
    };
  }

  return {
    ok: true,
    message:
      "Account created. Check your email to verify your address before signing in.",
    redirectTo: `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
  };
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      message: "Incorrect email or password.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: "/dashboard" };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email address.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const env = getPublicEnv();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password` },
  );

  // Always report success to avoid disclosing which emails are registered.
  if (error) {
    return {
      ok: true,
      message:
        "If an account exists for that email, a reset link is on its way.",
    };
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function resendVerificationAction(
  input: ResendVerificationInput,
): Promise<ActionResult> {
  const parsed = resendVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email address.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const env = getPublicEnv();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  // Rate limits are project-wide, so reporting them reveals nothing about the
  // address. Everything else reports success to stop account enumeration.
  if (
    error &&
    (error.status === 429 || error.message.toLowerCase().includes("rate limit"))
  ) {
    return {
      ok: false,
      message:
        "The email service is rate limited right now. Wait a few minutes, then try again.",
    };
  }

  // Always report success so the form cannot be used to enumerate accounts.
  return {
    ok: true,
    message:
      "If that address is waiting for verification, a new link is on its way. Check your spam folder too.",
  };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      message: "We could not update your password. Request a new reset link.",
    };
  }

  return { ok: true, message: "Password updated. You can now sign in." };
}

export async function completeOnboardingAction(
  input: OnboardingInput,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      state: parsed.data.state || null,
      city: parsed.data.city || null,
      account_type: parsed.data.accountType,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: "We could not save your details. Try again." };
  }

  const role = accountTypeDefaultRole[parsed.data.accountType];
  if (role && ROLE_PERMISSIONS[role]) {
    await supabase.from("user_role_assignments").insert({
      user_id: user.id,
      role_key: role,
      organisation_id: null,
      granted_by: null,
    });
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "onboarding.completed",
    entity_type: "profile",
    entity_id: user.id,
    metadata: { account_type: parsed.data.accountType },
  });

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: "/dashboard" };
}
