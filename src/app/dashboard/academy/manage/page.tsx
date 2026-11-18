import type { Metadata } from "next";

import { dashboardStudioBase } from "@/features/academy/studio/base";
import { ManageCoursesPage } from "@/features/academy/studio/manage-courses-page";

export const metadata: Metadata = {
  title: "Manage courses",
};

export default function ManageCoursesRoute() {
  return <ManageCoursesPage base={dashboardStudioBase} />;
}
