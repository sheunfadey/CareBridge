"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  isOrganisationAdmin,
} from "@/server/auth/current-user";
import { recordAudit } from "@/server/audit/record-audit";
import type { PortalMode } from "@/types/database";

const PORTALS: PortalMode[] = ["student", "caregiver"];

export async function switchPortalAction(formData: FormData): Promise<void> {
  const requested = String(formData.get("portal") ?? "");
  if (!PORTALS.includes(requested as PortalMode)) {
    return;
  }

  const portal = requested as PortalMode;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard");
  }

  // Organisation administrators run a workspace; they do not hold personal
  // portals, so portal switching is refused for them as well as hidden.
  const current = await getCurrentUser();
  if (current && isOrganisationAdmin(current)) {
    redirect("/dashboard");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ active_portal: portal })
    .eq("id", user.id);

  if (error) {
    console.error("[portal] could not switch portal", { message: error.message });
    redirect("/dashboard");
  }

  await recordAudit({
    actorId: user.id,
    action: "account.portal_switched",
    entityType: "profile",
    entityId: user.id,
    metadata: { portal },
  });

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
