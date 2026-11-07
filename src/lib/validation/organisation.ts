import { z } from "zod";

import { ROLE_PERMISSIONS } from "@/lib/permissions/registry";
import type { RoleKey } from "@/types/database";

export const ORGANISATION_TYPES = [
  "platform_academy",
  "training_provider",
  "care_home",
  "home_care_agency",
  "recruitment_partner",
  "charity",
  "corporate_customer",
] as const;

export const organisationTypeLabels: Record<
  (typeof ORGANISATION_TYPES)[number],
  string
> = {
  platform_academy: "Platform academy",
  training_provider: "Training provider",
  care_home: "Care home",
  home_care_agency: "Home-care agency",
  recruitment_partner: "Recruitment partner",
  charity: "Charity",
  corporate_customer: "Corporate customer",
};

const ALL_ROLE_KEYS = Object.keys(ROLE_PERMISSIONS) as [RoleKey, ...RoleKey[]];

export const createOrganisationSchema = z.object({
  name: z.string().min(2, "Enter an organisation name").max(120),
  type: z.enum(ORGANISATION_TYPES, {
    message: "Select an organisation type",
  }),
  contactEmail: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email"))
    .optional()
    .or(z.literal("")),
  state: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
});

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;

export const ORGANISATION_INTEGRATION_KINDS = [
  "paystack",
  "sms",
  "email",
  "custom_api",
] as const;

export const organisationIntegrationKindLabels: Record<
  (typeof ORGANISATION_INTEGRATION_KINDS)[number],
  string
> = {
  paystack: "Paystack payments",
  sms: "SMS",
  email: "Email",
  custom_api: "Custom API",
};

export const organisationIntegrationSchema = z
  .object({
    organisationId: z.string().uuid(),
    kind: z.enum(ORGANISATION_INTEGRATION_KINDS),
    provider: z.string().trim().min(2, "Enter a provider").max(60),
    mode: z.enum(["sandbox", "live"]).optional().or(z.literal("")),
    publicKey: z.string().trim().max(300).optional().or(z.literal("")),
    secretKey: z.string().trim().max(300).optional().or(z.literal("")),
    webhookSecret: z.string().trim().max(300).optional().or(z.literal("")),
    senderId: z.string().trim().max(200).optional().or(z.literal("")),
    senderName: z.string().trim().max(120).optional().or(z.literal("")),
    configText: z.string().trim().max(5000).optional().or(z.literal("")),
    isEnabled: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.kind === "paystack") {
      if (value.publicKey && !value.publicKey.startsWith("pk_")) {
        context.addIssue({
          code: "custom",
          path: ["publicKey"],
          message: "Paystack public keys start with pk_.",
        });
      }
      if (value.secretKey && !value.secretKey.startsWith("sk_")) {
        context.addIssue({
          code: "custom",
          path: ["secretKey"],
          message: "Paystack secret keys start with sk_.",
        });
      }
    }

    if (value.configText) {
      try {
        const parsed = JSON.parse(value.configText) as unknown;
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error("not an object");
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["configText"],
          message: "Use a valid JSON object.",
        });
      }
    }
  });

export type OrganisationIntegrationInput = z.infer<
  typeof organisationIntegrationSchema
>;

export const inviteMemberSchema = z.object({
  organisationId: z.string().uuid(),
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email")),
  roleKey: z.enum(ALL_ROLE_KEYS, { message: "Select a role" }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
