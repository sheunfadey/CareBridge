import type { Metadata } from "next";

import {
  AssessmentDetailPage,
  getAssessmentStudioMetadata,
} from "@/features/academy/studio/assessment-detail-page";
import { trainerStudioBase } from "@/features/academy/studio/base";

type TrainerAssessmentRouteProps = {
  params: Promise<{ courseId: string; assessmentId: string }>;
};

export async function generateMetadata({
  params,
}: TrainerAssessmentRouteProps): Promise<Metadata> {
  const { courseId, assessmentId } = await params;
  return getAssessmentStudioMetadata(courseId, assessmentId);
}

export default async function TrainerAssessmentDetailPage({
  params,
}: TrainerAssessmentRouteProps) {
  const { courseId, assessmentId } = await params;
  return (
    <AssessmentDetailPage
      base={trainerStudioBase}
      courseId={courseId}
      assessmentId={assessmentId}
    />
  );
}
