"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  notificationPreferencesSchema,
  profileUpdateSchema,
  validateAvatarFile,
  type ChangePasswordInput,
  type NotificationPreferencesInput,
  type ProfileUpdateInput,
} from "@/lib/validation/account";
import { recordAudit } from "@/server/audit/record-audit";

const AVATAR_BUCKET = "avatars";

export type AccountActionResult =
  | { ok: true; message: string; avatarUrl?: string | null }
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

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfileAction(
  input: ProfileUpdateInput,
): Promise<AccountActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      state: parsed.data.state || null,
      city: parsed.data.city || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "We could not save your profile. Try again." };
  }

  await recordAudit({
    actorId: user.id,
    action: "account.profile_updated",
    entityType: "profile",
    entityId: user.id,
    metadata: { fields: ["full_name", "phone", "state", "city"] },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Profile updated." };
}

export async function uploadAvatarAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "Choose an image to upload." };
  }

  const validation = validateAvatarFile(file);
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  // A stable path means a new upload replaces the previous avatar without
  // leaving orphaned objects behind. Uploads are server-mediated: the service
  // role is used when available so the flow does not depend on the browser
  // holding a storage session; the bucket policies still guard direct access.
  const storage = createAdminClient() ?? supabase;
  const storagePath = `${user.id}/avatar`;
  const { error: uploadError } = await storage.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      // Avatars use a stable path, so avoid a stale CDN copy after replacement.
      cacheControl: "0",
      upsert: true,
    });

  if (uploadError) {
    console.warn("[account] avatar upload failed", {
      reason: uploadError.message,
    });
    return {
      ok: false,
      message:
        uploadError.message.toLowerCase().includes("bucket")
          ? "Avatar storage is not set up yet. Contact platform support."
          : "We could not upload that image. Try a smaller file.",
    };
  }

  const { data: publicUrlData } = storage.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(storagePath);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (profileError) {
    return {
      ok: false,
      message: "The image uploaded but your profile could not be updated.",
    };
  }

  await recordAudit({
    actorId: user.id,
    action: "account.avatar_updated",
    entityType: "profile",
    entityId: user.id,
    metadata: { mime_type: file.type, size_bytes: file.size },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Avatar updated.", avatarUrl };
}

export async function removeAvatarAction(): Promise<AccountActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }

  const storage = createAdminClient() ?? supabase;
  const { error: storageError } = await storage.storage
    .from(AVATAR_BUCKET)
    .remove([`${user.id}/avatar`]);

  if (storageError) {
    console.warn("[account] avatar removal failed", {
      reason: storageError.message,
    });
    return { ok: false, message: "We could not remove your avatar. Try again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: "We could not update your profile. Try again." };
  }

  await recordAudit({
    actorId: user.id,
    action: "account.avatar_removed",
    entityType: "profile",
    entityId: user.id,
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Avatar removed.", avatarUrl: null };
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<AccountActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user?.email) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }

  // Re-authenticate before changing the password so a borrowed session cannot
  // lock the real owner out.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (reauthError) {
    return {
      ok: false,
      message: "Your current password is incorrect.",
      fieldErrors: { currentPassword: ["Your current password is incorrect."] },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return {
      ok: false,
      message: "We could not change your password. Try again shortly.",
    };
  }

  await recordAudit({
    actorId: user.id,
    action: "account.password_changed",
    entityType: "profile",
    entityId: user.id,
  });

  return { ok: true, message: "Password changed." };
}

export async function updateNotificationPreferencesAction(
  input: NotificationPreferencesInput,
): Promise<AccountActionResult> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }

  const { error } = await supabase.from("user_notification_preferences").upsert(
    {
      user_id: user.id,
      email_enabled: parsed.data.emailEnabled,
      in_app_enabled: parsed.data.inAppEnabled,
      sms_enabled: parsed.data.smsEnabled,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return {
      ok: false,
      message: "We could not save your preferences. Try again.",
    };
  }

  await recordAudit({
    actorId: user.id,
    action: "account.notification_preferences_updated",
    entityType: "user_notification_preferences",
    entityId: user.id,
    metadata: {
      email_enabled: parsed.data.emailEnabled,
      in_app_enabled: parsed.data.inAppEnabled,
      sms_enabled: parsed.data.smsEnabled,
    },
  });

  revalidatePath("/dashboard/settings/notifications");
  return { ok: true, message: "Notification preferences saved." };
}
