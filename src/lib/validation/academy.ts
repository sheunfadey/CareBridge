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
  difficulty: z.enum(COURSE_DIFFICULTIES),
  estimatedMinutes: z.coerce
    .number()
    .int()
    .min(5, "Estimated duration must be at least 5 minutes")
    .max(10000),
  learningOutcomes: optionalText(2000),
  prerequisites: optionalText(2000),
  scholarshipEligible: z.boolean().default(false),
  certificateEnabled: z.boolean().default(true),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

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
