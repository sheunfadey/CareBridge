import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PlatformStats = {
  organisations: number;
  activeOrganisations: number;
  pendingOrganisations: number;
  users: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  suspendedSubscriptions: number;
  pendingPayments: number;
  conversations: number;
};

const emptyStats: PlatformStats = {
  organisations: 0,
  activeOrganisations: 0,
  pendingOrganisations: 0,
  users: 0,
  activeSubscriptions: 0,
  trialingSubscriptions: 0,
  suspendedSubscriptions: 0,
  pendingPayments: 0,
  conversations: 0,
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const client = createAdminClient();
  if (!client) return emptyStats;

  const [
    organisations,
    activeOrganisations,
    pendingOrganisations,
    users,
    activeSubscriptions,
    trialingSubscriptions,
    suspendedSubscriptions,
    pendingPayments,
    conversations,
  ] = await Promise.all([
    client
      .from("organisations")
      .select("id", { count: "exact", head: true }),
    client
      .from("organisations")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    client
      .from("organisations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    client.from("profiles").select("id", { count: "exact", head: true }),
    client
      .from("organisation_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    client
      .from("organisation_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "trialing"),
    client
      .from("organisation_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "suspended"),
    client
      .from("payment_transactions")
      .select("id", { count: "exact", head: true })
      .in("status", ["initiated", "pending"]),
    client.from("conversations").select("id", { count: "exact", head: true }),
  ]);

  return {
    organisations: organisations.count ?? 0,
    activeOrganisations: activeOrganisations.count ?? 0,
    pendingOrganisations: pendingOrganisations.count ?? 0,
    users: users.count ?? 0,
    activeSubscriptions: activeSubscriptions.count ?? 0,
    trialingSubscriptions: trialingSubscriptions.count ?? 0,
    suspendedSubscriptions: suspendedSubscriptions.count ?? 0,
    pendingPayments: pendingPayments.count ?? 0,
    conversations: conversations.count ?? 0,
  };
}
