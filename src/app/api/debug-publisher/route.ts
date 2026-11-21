import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getPublishedCourses } from "@/server/academy/queries";

export async function GET() {
  const supabase = await createClient();
  const { data: instructorRows, error: instructorError } = await supabase.rpc(
    "course_instructor_names",
  );

  const result = await getPublishedCourses();

  return NextResponse.json({
    rpcError: instructorError?.message ?? null,
    rpcRows: instructorRows,
    courses: result.courses.map((course) => ({
      title: course.title,
      publisherName: course.publisherName,
      providerName: course.providerName,
    })),
  });
}
