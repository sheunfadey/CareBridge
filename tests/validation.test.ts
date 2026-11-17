import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  onboardingSchema,
  registerSchema,
  resetPasswordSchema,
  passwordSchema,
} from "@/lib/validation/auth";

describe("password policy", () => {
  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
  });

  it("requires a letter and a number", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("abcd1234").success).toBe(true);
  });
});

describe("registerSchema", () => {
  const base = {
    fullName: "Ada Obi",
    email: "ada@example.com",
    password: "abcd1234",
    confirmPassword: "abcd1234",
    acceptTerms: true,
  };

  it("accepts a valid registration and lowercases the email", () => {
    const result = registerSchema.safeParse({ ...base, email: "ADA@Example.COM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...base,
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
  });

  it("requires accepting the terms", () => {
    const result = registerSchema.safeParse({ ...base, acceptTerms: false });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("keeps an optional referral code and normalises its case", () => {
    const withCode = registerSchema.safeParse({
      ...base,
      referralCode: "  ab12cd  ",
    });
    expect(withCode.success).toBe(true);
    if (withCode.success) {
      expect(withCode.data.referralCode).toBe("AB12CD");
    }

    const withoutCode = registerSchema.safeParse({ ...base, referralCode: "" });
    expect(withoutCode.success).toBe(true);
    if (withoutCode.success) {
      expect(withoutCode.data.referralCode).toBeUndefined();
    }
  });

  it("rejects malformed referral codes", () => {
    expect(
      registerSchema.safeParse({ ...base, referralCode: "abc" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, referralCode: "not a code!" }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(
      true,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("enforces matching confirmation", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "abcd1234",
        confirmPassword: "abcd1234",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: "abcd1234",
        confirmPassword: "abcd9999",
      }).success,
    ).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("normalises the email", () => {
    const result = forgotPasswordSchema.safeParse({ email: " A@B.COM " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("a@b.com");
    }
  });
});

describe("onboardingSchema", () => {
  it("requires a supported account type", () => {
    const base = { fullName: "Ada Obi", accountType: "caregiver" as const };
    expect(onboardingSchema.safeParse(base).success).toBe(true);
    expect(
      onboardingSchema.safeParse({ ...base, accountType: "not_a_type" }).success,
    ).toBe(false);
  });

  it("allows optional location fields to be empty", () => {
    const result = onboardingSchema.safeParse({
      fullName: "Ada Obi",
      accountType: "caregiver",
      phone: "",
      state: "",
      city: "",
    });
    expect(result.success).toBe(true);
  });
});
