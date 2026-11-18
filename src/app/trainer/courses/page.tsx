import type { Metadata } from "next";

import { trainerStudioBase } from "@/features/academy/studio/base";
import { ManageCoursesPage } from "@/features/academy/studio/manage-courses-page";

export const metadata: Metadata = {
  title: "Courses",
};

export default function TrainerCoursesPage() {
  return <ManageCoursesPage base={trainerStudioBase} />;
}
