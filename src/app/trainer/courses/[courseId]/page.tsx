import type { Metadata } from "next";

import {
  CourseDetailPage,
  getCourseStudioMetadata,
} from "@/features/academy/studio/course-detail-page";
import { trainerStudioBase } from "@/features/academy/studio/base";

type TrainerCourseRouteProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: TrainerCourseRouteProps): Promise<Metadata> {
  const { courseId } = await params;
  return getCourseStudioMetadata(courseId);
}

export default async function TrainerCourseDetailPage({
  params,
}: TrainerCourseRouteProps) {
  const { courseId } = await params;
  return <CourseDetailPage base={trainerStudioBase} courseId={courseId} />;
}
