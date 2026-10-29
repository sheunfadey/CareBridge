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
