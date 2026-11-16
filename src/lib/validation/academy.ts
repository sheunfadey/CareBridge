import { z } from "zod";

export const COURSE_DIFFICULTIES = [
  "foundation",
  "intermediate",
  "advanced",
] as const;

export const courseDifficultyLabels: Record<
  (typeof COURSE_DIFFICULTIES)[number],
  string
> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const COURSE_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export const courseStatusLabels: Record<
  (typeof COURSE_STATUSES)[number],
  string
> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  archived: "Archived",
};

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function linesToArray(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export const createCourseSchema = z.object({
  programmeId: z.string().uuid("Select a programme"),
  organisationId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .trim()
    .min(3, "Enter a course title")
    .max(160, "Keep the title under 160 characters"),
  summary: z
    .string()
    .trim()
    .min(20, "Add a short summary of at least 20 characters")
    .max(300, "Keep the summary under 300 characters"),
  description: z
    .string()
    .trim()
    .min(40, "Add a description of at least 40 characters")
    .max(8000),
  category: optionalText(80),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  difficulty: z.enum(COURSE_DIFFICULTIES),
  estimatedMinutes: z.coerce
    .number()
    .int()
    .min(5, "Estimated duration must be at least 5 minutes")
    .max(10000),
  learningOutcomes: optionalText(2000),
  prerequisites: optionalText(2000),
  pricingType: z.enum(["free", "paid"]).default("free"),
  priceNaira: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price is too high")
    .default(0),
  scholarshipEligible: z.boolean().default(false),
  certificateEnabled: z.boolean().default(true),
}).refine(
  (data) => data.pricingType === "free" || data.priceNaira > 0,
  {
    path: ["priceNaira"],
    message: "Enter a price greater than zero for a paid course",
  },
);

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createCourseCategorySchema = z.object({
  organisationId: z.string().uuid().optional().or(z.literal("")),
  name: z
    .string()
    .trim()
    .min(2, "Enter a category name")
    .max(80, "Keep the category name under 80 characters"),
  description: optionalText(500),
  sortOrder: z.coerce.number().int().min(0).max(999).default(100),
});

export type CreateCourseCategoryInput = z.infer<
  typeof createCourseCategorySchema
>;

export const updateCourseCategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(2, "Enter a category name")
    .max(80, "Keep the category name under 80 characters"),
  description: optionalText(500),
  sortOrder: z.coerce.number().int().min(0).max(999).default(100),
});

export type UpdateCourseCategoryInput = z.infer<
  typeof updateCourseCategorySchema
>;

export const updateCourseSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(20).max(300),
  description: z.string().trim().min(40).max(8000),
  category: optionalText(80),
  difficulty: z.enum(COURSE_DIFFICULTIES),
  estimatedMinutes: z.coerce.number().int().min(5).max(10000),
  learningOutcomes: optionalText(2000),
  prerequisites: optionalText(2000),
  scholarshipEligible: z.boolean().default(false),
  certificateEnabled: z.boolean().default(true),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const createModuleSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(3, "Enter a module title").max(160),
  summary: optionalText(500),
  isRequired: z.boolean().default(true),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const createLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().trim().min(3, "Enter a lesson title").max(160),
  content: z
    .string()
    .trim()
    .min(40, "Add lesson content of at least 40 characters")
    .max(20000),
  estimatedMinutes: z.coerce.number().int().min(1).max(600),
  isRequired: z.boolean().default(true),
  isPreview: z.boolean().default(false),
  videoUrl: optionalText(500),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const certificateVerificationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Enter the verification code printed on the certificate")
    .max(64),
});

// Learning resources -----------------------------------------------------------

export const LEARNING_RESOURCE_KINDS = [
  "document",
  "pdf",
  "presentation",
  "spreadsheet",
  "audio",
  "video",
  "image",
  "zip",
  "link",
  "other",
] as const;

export const learningResourceKindLabels: Record<
  (typeof LEARNING_RESOURCE_KINDS)[number],
  string
> = {
  document: "Document",
  pdf: "PDF",
  presentation: "Presentation",
  spreadsheet: "Spreadsheet",
  audio: "Audio",
  video: "Video",
  image: "Image",
  zip: "ZIP / archive",
  link: "Link",
  other: "Other",
};

export const learningResourceSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid().optional().or(z.literal("")),
  title: z
    .string()
    .trim()
    .min(2, "Enter a resource title")
    .max(160, "Keep the title under 160 characters"),
  kind: z.enum(LEARNING_RESOURCE_KINDS).default("document"),
  externalUrl: z
    .string()
    .trim()
    .max(800)
    .optional()
    .or(z.literal(""))
    .refine(
      (value) =>
        !value ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("/"),
      "Use an http(s) link or a site path",
    ),
  mimeType: optionalText(120),
  isPrivate: z.boolean().default(true),
});

export type LearningResourceInput = z.infer<typeof learningResourceSchema>;

// Assessments -----------------------------------------------------------------

export const ASSESSMENT_KINDS = ["quiz", "exam"] as const;

export const assessmentKindLabels: Record<
  (typeof ASSESSMENT_KINDS)[number],
  string
> = {
  quiz: "Quiz",
  exam: "Exam",
};

export const ASSESSMENT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export const assessmentStatusLabels: Record<
  (typeof ASSESSMENT_STATUSES)[number],
  string
> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const ASSESSMENT_QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "true_false",
] as const;

export const assessmentQuestionTypeLabels: Record<
  (typeof ASSESSMENT_QUESTION_TYPES)[number],
  string
> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True / false",
};

export const ASSESSMENT_ATTEMPT_STATUSES = [
  "in_progress",
  "submitted",
  "expired",
] as const;

export const assessmentAttemptStatusLabels: Record<
  (typeof ASSESSMENT_ATTEMPT_STATUSES)[number],
  string
> = {
  in_progress: "In progress",
  submitted: "Submitted",
  expired: "Expired",
};

const optionalMinutes = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().min(1, "Use at least 1 minute").max(480).optional(),
);

export const createAssessmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(3, "Enter an assessment title")
    .max(160, "Keep the title under 160 characters"),
  kind: z.enum(ASSESSMENT_KINDS).default("quiz"),
  instructions: optionalText(2000),
  passMarkPercent: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .default(70),
  maxAttempts: z.coerce.number().int().min(1).max(20).default(3),
  timeLimitMinutes: optionalMinutes,
  isRequired: z.boolean().default(false),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export function parseCorrectOptionIds(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,\s]+/)
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export const createAssessmentQuestionSchema = z
  .object({
    assessmentId: z.string().uuid(),
    prompt: z
      .string()
      .trim()
      .min(10, "Write the question prompt (at least 10 characters)")
      .max(2000),
    questionType: z.enum(ASSESSMENT_QUESTION_TYPES).default("single_choice"),
    optionA: optionalText(200),
    optionB: optionalText(200),
    optionC: optionalText(200),
    optionD: optionalText(200),
    correctAnswer: z
      .string()
      .trim()
      .min(1, "Enter the correct answer")
      .max(40),
    points: z.coerce.number().int().min(1).max(100).default(1),
    explanation: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    if (data.questionType === "true_false") {
      const answer = data.correctAnswer.trim().toLowerCase();
      if (answer !== "true" && answer !== "false") {
        ctx.addIssue({
          code: "custom",
          path: ["correctAnswer"],
          message: "Choose True or False",
        });
      }
      return;
    }

    if (!data.optionA?.trim() || !data.optionB?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["optionA"],
        message: "Add at least two options",
      });
      return;
    }

    const available = (
      [
        ["a", data.optionA],
        ["b", data.optionB],
        ["c", data.optionC],
        ["d", data.optionD],
      ] as const
    )
      .filter(([, label]) => Boolean(label?.trim()))
      .map(([id]) => id);

    const correct = parseCorrectOptionIds(data.correctAnswer);
    if (correct.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Enter the correct option letter, e.g. A or A,C",
      });
      return;
    }

    if (correct.some((id) => !available.includes(id as "a" | "b" | "c" | "d"))) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Correct answers must match an option you filled in",
      });
      return;
    }

    if (data.questionType === "single_choice" && correct.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Single choice questions need exactly one correct option",
      });
    }

    if (data.questionType === "multiple_choice" && correct.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswer"],
        message: "Choose at least one correct option",
      });
    }
  });

export type CreateAssessmentQuestionInput = z.infer<
  typeof createAssessmentQuestionSchema
>;
