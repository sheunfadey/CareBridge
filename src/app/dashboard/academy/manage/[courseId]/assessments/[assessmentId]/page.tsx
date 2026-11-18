import type { Metadata } from "next";

import {
  AssessmentDetailPage,
  getAssessmentStudioMetadata,
} from "@/features/academy/studio/assessment-detail-page";
import { dashboardStudioBase } from "@/features/academy/studio/base";

type AssessmentRouteProps = {
  params: Promise<{ courseId: string; assessmentId: string }>;
};

export async function generateMetadata({
  params,
}: AssessmentRouteProps): Promise<Metadata> {
  const { courseId, assessmentId } = await params;
  return getAssessmentStudioMetadata(courseId, assessmentId);
}

export default async function ManageAssessmentRoute({
  params,
}: AssessmentRouteProps) {
  const { courseId, assessmentId } = await params;
  return (
    <AssessmentDetailPage
      base={dashboardStudioBase}
      courseId={courseId}
      assessmentId={assessmentId}
    />
  );
}
