import { describe, expect, it } from "vitest";

import {
  createAssessmentQuestionSchema,
  createAssessmentSchema,
  createCourseCategorySchema,
  learningResourceSchema,
  parseCorrectOptionIds,
} from "@/lib/validation/academy";

const assessmentId = "11111111-1111-4111-8111-111111111111";

describe("assessment validation", () => {
  const base = {
    courseId: assessmentId,
    title: "Medication safety quiz",
    kind: "quiz" as const,
    instructions: "",
    passMarkPercent: 70,
    maxAttempts: 3,
    isRequired: true,
  };

  it("accepts a valid assessment", () => {
    expect(createAssessmentSchema.safeParse(base).success).toBe(true);
    expect(
      createAssessmentSchema.safeParse({
        ...base,
        timeLimitMinutes: 30,
        isRequired: false,
      }).success,
    ).toBe(true);
  });

  it("allows an empty time limit", () => {
    expect(
      createAssessmentSchema.safeParse({ ...base, timeLimitMinutes: "" })
        .success,
    ).toBe(true);
    expect(
      createAssessmentSchema.safeParse({ ...base, timeLimitMinutes: undefined })
        .success,
    ).toBe(true);
  });

  it("rejects out-of-range pass marks and attempts", () => {
    expect(
      createAssessmentSchema.safeParse({ ...base, passMarkPercent: 101 })
        .success,
    ).toBe(false);
    expect(
      createAssessmentSchema.safeParse({ ...base, passMarkPercent: -1 }).success,
    ).toBe(false);
    expect(
      createAssessmentSchema.safeParse({ ...base, maxAttempts: 0 }).success,
    ).toBe(false);
    expect(
      createAssessmentSchema.safeParse({ ...base, maxAttempts: 21 }).success,
    ).toBe(false);
  });
});

describe("assessment question validation", () => {
  const base = {
    assessmentId,
    prompt: "Which action should you take first?",
    questionType: "single_choice" as const,
    optionA: "Check the care plan",
    optionB: "Ask another resident",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    points: 1,
    explanation: "",
  };

  it("accepts a single-choice question", () => {
    expect(createAssessmentQuestionSchema.safeParse(base).success).toBe(true);
  });

  it("rejects multiple correct answers for single choice", () => {
    expect(
      createAssessmentQuestionSchema.safeParse({
        ...base,
        correctAnswer: "A,B",
      }).success,
    ).toBe(false);
  });

  it("accepts multiple-choice answers", () => {
    expect(
      createAssessmentQuestionSchema.safeParse({
        ...base,
        questionType: "multiple_choice",
        correctAnswer: "A,B",
      }).success,
    ).toBe(true);
  });

  it("rejects a correct answer that is not an option", () => {
    expect(
      createAssessmentQuestionSchema.safeParse({
        ...base,
        correctAnswer: "C",
      }).success,
    ).toBe(false);
  });

  it("requires two options", () => {
    expect(
      createAssessmentQuestionSchema.safeParse({
        ...base,
        optionB: "",
      }).success,
    ).toBe(false);
  });

  it("validates true/false answers", () => {
    expect(
      createAssessmentQuestionSchema.safeParse({
        ...base,
        questionType: "true_false",
        correctAnswer: "true",
      }).success,
    ).toBe(true);
    expect(
      createAssessmentQuestionSchema.safeParse({
        ...base,
        questionType: "true_false",
        correctAnswer: "maybe",
      }).success,
    ).toBe(false);
  });

  it("normalises correct option ids", () => {
    expect(parseCorrectOptionIds(" A, c ,a")).toEqual(["a", "c"]);
    expect(parseCorrectOptionIds("")).toEqual([]);
  });
});

describe("course category validation", () => {
  it("accepts an organisation category", () => {
    expect(
      createCourseCategorySchema.safeParse({
        organisationId: assessmentId,
        name: "Safeguarding",
        description: "Safeguarding courses",
        sortOrder: 20,
      }).success,
    ).toBe(true);
  });

  it("accepts a platform category", () => {
    expect(
      createCourseCategorySchema.safeParse({
        organisationId: "",
        name: "Care foundations",
        sortOrder: 10,
      }).success,
    ).toBe(true);
  });

  it("rejects short names", () => {
    expect(
      createCourseCategorySchema.safeParse({
        organisationId: "",
        name: "A",
      }).success,
    ).toBe(false);
  });
});

describe("learning resource validation", () => {
  const base = {
    courseId: assessmentId,
    lessonId: "",
    title: "Person-centred care handout",
    kind: "pdf" as const,
    externalUrl: "https://example.com/handout.pdf",
    mimeType: "application/pdf",
    isPrivate: true,
  };

  it("accepts the supported resource types", () => {
    for (const kind of [
      "document",
      "pdf",
      "presentation",
      "audio",
      "video",
      "image",
      "link",
      "other",
    ] as const) {
      expect(
        learningResourceSchema.safeParse({ ...base, kind }).success,
        kind,
      ).toBe(true);
    }
  });

  it("rejects an invalid URL scheme", () => {
    expect(
      learningResourceSchema.safeParse({
        ...base,
        externalUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("accepts site-relative links", () => {
    expect(
      learningResourceSchema.safeParse({
        ...base,
        externalUrl: "/resources/handout.pdf",
      }).success,
    ).toBe(true);
  });

  it("requires a title", () => {
    expect(
      learningResourceSchema.safeParse({ ...base, title: "" }).success,
    ).toBe(false);
  });
});
