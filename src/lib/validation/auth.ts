import { z } from "zod";

import type { AccountType } from "@/types/database";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((value) => value === true, "You must accept the terms to continue"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const ACCOUNT_TYPES: readonly AccountType[] = [
  "caregiver",
  "training_provider",
  "care_provider",
  "referral_partner",
  "charity",
  "employer",
];

export const accountTypeLabels: Record<AccountType, string> = {
  caregiver: "Caregiver or student",
  training_provider: "Training provider",
  care_provider: "Care home or home-care agency",
  referral_partner: "Referral partner",
  charity: "Charity or donor",
  employer: "Employer or recruiter",
};

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your full name").max(120),
  phone: z
    .string()
    .max(30, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  state: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  accountType: z.enum(
    ACCOUNT_TYPES as unknown as [AccountType, ...AccountType[]],
    { message: "Select an account type" },
  ),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
