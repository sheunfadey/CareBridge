import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";

export type DashboardFacts = {
  organisationCount: number;
  pendingInvitationCount: number;
  activeMembershipCount: number;
};

/**
 * Aggregate facts that are actually backed by the Phase 2 schema. Deliberately
 * small: no fabricated metrics. Later phases add their own counters here.
 */
export async function getDashboardFacts(
  user: CurrentUser,
): Promise<DashboardFacts> {
  const supabase = await createClient();

  const organisationIds = user.organisations.map((org) => org.organisationId);

  let activeMembershipCount = 0;

  const [{ count: invitations }, { data: memberships }] = await Promise.all([
    supabase
      .from("organisation_invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .in(
        "organisation_id",
        organisationIds.length > 0 ? organisationIds : ["00000000-0000-0000-0000-000000000000"],
      ),
    organisationIds.length > 0
      ? supabase
          .from("organisation_memberships")
          .select("organisation_id")
          .eq("status", "active")
          .in("organisation_id", organisationIds)
      : Promise.resolve({ data: [] as { organisation_id: string }[] }),
  ]);

  activeMembershipCount = memberships?.length ?? 0;

  return {
    organisationCount: user.organisations.length,
    pendingInvitationCount: invitations ?? 0,
    activeMembershipCount,
  };
}
