import { describe, expect, it } from "vitest";

import {
  applyToJobSchema,
  createInternshipListingSchema,
  createJobPostingSchema,
  linesToArray,
  slugify,
} from "@/lib/validation/employment";

const jobBase = {
  organisationId: "0b9d6b1e-6f6a-4b3f-9a6e-2b9c1f0a1d2e",
  title: "Senior Care Assistant",
  summary: "Provide person-centred support to residents during day shifts.",
  description:
    "You will support residents with daily living, medication prompts and safe mobility while working as part of a multidisciplinary team.",
  duties: "Support daily living\nMaintain accurate records",
  employmentType: "full_time" as const,
  workLocation: "On-site",
  state: "Lagos",
  city: "Ikeja",
  shiftRequirements: "",
  experienceRequirements: "",
  qualifications: "",
  skills: "",
  isSalaryDisclosed: true,
  safeguardingRequirements: "",
  applicationDeadline: "2026-12-31",
};

describe("employment validation", () => {
  it("slugifies titles safely", () => {
    expect(slugify("Senior Care Assistant (Night)")).toBe(
      "senior-care-assistant-night",
    );
  });

  it("splits multi-line lists and drops blanks", () => {
    expect(linesToArray("One\n\n Two \r\nThree")).toEqual([
      "One",
      "Two",
      "Three",
    ]);
  });

  it("accepts a valid job posting", () => {
    expect(createJobPostingSchema.safeParse(jobBase).success).toBe(true);
  });

  it("rejects reversed salary ranges", () => {
    const result = createJobPostingSchema.safeParse({
      ...jobBase,
      salaryMinMinorUnits: 500_000,
      salaryMaxMinorUnits: 300_000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid deadlines", () => {
    expect(
      createJobPostingSchema.safeParse({
        ...jobBase,
        applicationDeadline: "31/12/2026",
      }).success,
    ).toBe(false);
  });

  it("requires a cover note under the limit", () => {
    expect(
      applyToJobSchema.safeParse({
        jobId: jobBase.organisationId,
        coverLetter: "x".repeat(4001),
      }).success,
    ).toBe(false);
  });

  it("rejects placements that end before they start", () => {
    const result = createInternshipListingSchema.safeParse({
      organisationId: jobBase.organisationId,
      title: "Care placement",
      summary: "A supervised placement in a residential care setting.",
      description:
        "Work alongside experienced caregivers to build practical competence in daily care routines.",
      state: "Lagos",
      city: "Lekki",
      location: "",
      startDate: "2026-06-01",
      endDate: "2026-05-01",
      slots: 2,
      requirements: "",
      learningObjectives: "",
      applicationDeadline: "",
    });
    expect(result.success).toBe(false);
  });
});
