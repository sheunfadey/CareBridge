import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { debugCoursePublishers } from "@/server/academy/queries";

export async function GET() {
  const supabase = await createClient();
  const { data: rawCourses } = await supabase
    .from("courses")
    .select("id, instructor_id")
    .eq("status", "published")
    .eq("is_public", true);

  const ids = [...new Set((rawCourses ?? []).map((course) => course.instructor_id).filter(Boolean))];

  const publishers = await debugCoursePublishers();

  return NextResponse.json({ ids, publishers });
}
