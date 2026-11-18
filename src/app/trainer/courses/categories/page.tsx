import type { Metadata } from "next";

import { trainerStudioBase } from "@/features/academy/studio/base";
import { CourseCategoriesPage } from "@/features/academy/studio/categories-page";

export const metadata: Metadata = {
  title: "Course categories",
};

export default function TrainerCourseCategoriesPage() {
  return <CourseCategoriesPage base={trainerStudioBase} />;
}
