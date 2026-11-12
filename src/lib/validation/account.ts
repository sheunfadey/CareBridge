import { z } from "zod";

import { passwordSchema } from "@/lib/validation/auth";

/**
 * Free-text phone numbers from the onboarding flow are intentionally loose:
 * Nigeria uses local and international formats, and users often include spaces
 * or dashes. Empty means "not provided".
 */
const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30, "Phone number is too long")
  .refine(
    (value) => value === "" || /^\+?[0-9()\s-]{7,30}$/.test(value),
    "Enter a valid phone number",
  );

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120, "Full name is too long"),
  phone: optionalPhoneSchema,
  state: z.string().trim().max(80, "State is too long"),
  city: z.string().trim().max(80, "City is too long"),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  smsEnabled: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarFileLike = {
  type: string;
  size: number;
};

/**
 * Validates an avatar before it reaches storage. The bucket enforces the same
 * limits; this check exists so the user gets a clear message first.
 */
export function validateAvatarFile(
  file: AvatarFileLike,
): { ok: true } | { ok: false; message: string } {
  if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) {
    return { ok: false, message: "Choose a JPEG, PNG or WebP image." };
  }

  if (file.size <= 0) {
    return { ok: false, message: "The selected image is empty." };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, message: "Images must be 2 MB or smaller." };
  }

  return { ok: true };
}
