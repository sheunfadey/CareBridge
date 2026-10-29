import { describe, expect, it } from "vitest";

import {
  createOrganisationSchema,
  inviteMemberSchema,
} from "@/lib/validation/organisation";

describe("createOrganisationSchema", () => {
  it("accepts a minimal valid organisation", () => {
    const result = createOrganisationSchema.safeParse({
      name: "Lagos Care Home",
      type: "care_home",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown organisation type", () => {
    expect(
      createOrganisationSchema.safeParse({ name: "X", type: "spaceship" }).success,
    ).toBe(false);
  });

  it("rejects a too-short name", () => {
    expect(
      createOrganisationSchema.safeParse({ name: "A", type: "charity" }).success,
    ).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  const organisationId = "8f14e45f-ceea-4a1a-9e3b-1c2d3e4f5a6b";

  it("accepts a valid invitation and normalises the email", () => {
    const result = inviteMemberSchema.safeParse({
      organisationId,
      email: "  NewUser@Example.COM ",
      roleKey: "care_staff",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("newuser@example.com");
    }
  });

  it("rejects a non-uuid organisation id", () => {
    expect(
      inviteMemberSchema.safeParse({
        organisationId: "not-a-uuid",
        email: "a@b.com",
        roleKey: "care_staff",
      }).success,
    ).toBe(false);
  });

  it("rejects a role that is not in the registry", () => {
    expect(
      inviteMemberSchema.safeParse({
        organisationId,
        email: "a@b.com",
        roleKey: "wizard",
      }).success,
    ).toBe(false);
  });
});
