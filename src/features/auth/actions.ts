"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
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
    return {
      ok: false,
      message:
        error.message.toLowerCase().includes("already")
          ? "An account with this email already exists."
          : "We could not create your account. Try again shortly.",
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

  return {
    ok: true,
    message:
      "Account created. Check your email to verify your address before signing in.",
    redirectTo: "/verify-email",
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
