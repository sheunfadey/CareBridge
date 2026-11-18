import type { Metadata } from "next";

import { trainerStudioBase } from "@/features/academy/studio/base";
import { NewCoursePage } from "@/features/academy/studio/new-course-page";

export const metadata: Metadata = {
  title: "New course",
};

export default function TrainerNewCoursePage() {
  return <NewCoursePage base={trainerStudioBase} />;
}
