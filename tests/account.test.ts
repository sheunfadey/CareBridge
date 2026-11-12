import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  changePasswordSchema,
  notificationPreferencesSchema,
  profileUpdateSchema,
  validateAvatarFile,
} from "@/lib/validation/account";

describe("profileUpdateSchema", () => {
  it("trims names and contact fields", () => {
    const result = profileUpdateSchema.safeParse({
      fullName: "  Ada Obi ",
      phone: " 080 1234 5678 ",
      state: " Lagos ",
      city: " Ikeja ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        fullName: "Ada Obi",
        phone: "080 1234 5678",
        state: "Lagos",
        city: "Ikeja",
      });
    }
  });

  it("allows empty optional contact fields", () => {
    expect(
      profileUpdateSchema.safeParse({
        fullName: "Ada Obi",
        phone: "",
        state: "",
        city: "",
      }).success,
    ).toBe(true);
  });

  it("rejects a one-character name", () => {
    expect(
      profileUpdateSchema.safeParse({
        fullName: "A",
        phone: "",
        state: "",
        city: "",
      }).success,
    ).toBe(false);
  });

  it("rejects a phone number with letters", () => {
    expect(
      profileUpdateSchema.safeParse({
        fullName: "Ada Obi",
        phone: "call me",
        state: "",
        city: "",
      }).success,
    ).toBe(false);
  });
});

describe("notificationPreferencesSchema", () => {
  it("accepts all three channel flags", () => {
    const result = notificationPreferencesSchema.safeParse({
      emailEnabled: true,
      inAppEnabled: false,
      smsEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-boolean value", () => {
    expect(
      notificationPreferencesSchema.safeParse({
        emailEnabled: "yes",
        inAppEnabled: true,
        smsEnabled: false,
      }).success,
    ).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid new password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "oldpass1",
        newPassword: "newpass1",
        confirmPassword: "newpass1",
      }).success,
    ).toBe(true);
  });

  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: "newpass1",
      confirmPassword: "newpass2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a password without a number", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "oldpass1",
        newPassword: "onlyletters",
        confirmPassword: "onlyletters",
      }).success,
    ).toBe(false);
  });
});

describe("validateAvatarFile", () => {
  it("accepts a JPEG under the limit", () => {
    expect(
      validateAvatarFile({ type: "image/jpeg", size: 512 * 1024 }).ok,
    ).toBe(true);
  });

  it("rejects a non-image type", () => {
    const result = validateAvatarFile({
      type: "application/pdf",
      size: 1024,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validateAvatarFile({ type: "image/png", size: 0 }).ok).toBe(false);
  });

  it("rejects a file over the size limit", () => {
    expect(
      validateAvatarFile({ type: "image/webp", size: AVATAR_MAX_BYTES + 1 }).ok,
    ).toBe(false);
  });
});
