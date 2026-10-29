import "server-only";

import { createClient } from "@/lib/supabase/server";
import { AuthorisationError } from "@/server/auth/guards";

export async function assertCanManageCourse(courseId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("can_manage_course", {
    p_course: courseId,
  });

  if (error) {
    throw new AuthorisationError("Course permission check failed", "FORBIDDEN");
  }
  if (!data) {
    throw new AuthorisationError("Course is not manageable", "FORBIDDEN");
  }
}
