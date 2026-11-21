import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getPublishedCourses } from "@/server/academy/queries";

export async function GET() {
  const supabase = await createClient();

  const { data: rawCourses, error: rawError } = await supabase
    .from("courses")
    .select("id, title, instructor_id, organisation_id")
    .eq("status", "published")
    .eq("is_public", true);

  const ids = [
    ...new Set(
      (rawCourses ?? [])
        .map((course) => course.instructor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  const result = await getPublishedCourses();

  return NextResponse.json({
    rawError: rawError?.message ?? null,
    rawCourses,
    profileCount: profiles?.length ?? 0,
    courses: result.courses.map((course) => ({
      title: course.title,
      publisherName: course.publisherName,
    })),
  });
}
