import type { Metadata } from "next";

import {
  CourseDetailPage,
  getCourseStudioMetadata,
} from "@/features/academy/studio/course-detail-page";
import { dashboardStudioBase } from "@/features/academy/studio/base";

type ManageCourseRouteProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: ManageCourseRouteProps): Promise<Metadata> {
  const { courseId } = await params;
  return getCourseStudioMetadata(courseId);
}

export default async function ManageCourseRoute({
  params,
}: ManageCourseRouteProps) {
  const { courseId } = await params;
  return <CourseDetailPage base={dashboardStudioBase} courseId={courseId} />;
}
