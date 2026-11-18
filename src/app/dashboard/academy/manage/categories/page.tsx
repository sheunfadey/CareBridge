import type { Metadata } from "next";

import { dashboardStudioBase } from "@/features/academy/studio/base";
import { CourseCategoriesPage } from "@/features/academy/studio/categories-page";

export const metadata: Metadata = {
  title: "Course categories",
};

export default function CourseCategoriesRoute() {
  return <CourseCategoriesPage base={dashboardStudioBase} />;
}
