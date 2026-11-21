import { NextResponse } from "next/server";

import { getPublishedCourses } from "@/server/academy/queries";

export async function GET() {
  const result = await getPublishedCourses();
  return NextResponse.json({
    unavailable: result.unavailable,
    courses: result.courses.map((course) => ({
      title: course.title,
      publisherName: course.publisherName,
      providerName: course.providerName,
      programmeTitle: course.programmeTitle,
    })),
  });
}
