import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MembershipStatus, RoleKey, OrganisationType } from "@/types/database";

export type OrganisationSummary = {
  id: string;
  name: string;
  slug: string;
  type: OrganisationType;
  status: "pending" | "active" | "suspended" | "disabled";
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  isOwner: boolean;
  memberCount: number;
};

export type OrganisationMember = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string;
  status: MembershipStatus;
  isOwner: boolean;
  roles: RoleKey[];
};

export type OrganisationInvitation = {
  id: string;
  email: string;
  roleKey: RoleKey;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
};

/**
 * Lists organisations the given user can access (RLS already restricts this to
 * active memberships; super admins see all).
 */
export async function listOrganisationsForUser(): Promise<OrganisationSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisation_memberships")
    .select(
      "organisation_id, is_owner, status, organisations(id, name, slug, type, status, verification_status)",
    )
    .eq("status", "active");

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const org = row.organisations as {
      id: string;
      name: string;
      slug: string;
      type: OrganisationType;
      status: OrganisationSummary["status"];
      verification_status: OrganisationSummary["verificationStatus"];
    };

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      status: org.status,
      verificationStatus: org.verification_status,
      isOwner: row.is_owner,
      memberCount: 0,
    };
  });
}

export type PlacementProviderProfile = {
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  state: string;
  city: string;
  safeguardingLead: string;
  isAcceptingInterns: boolean;
};

export async function getPlacementProvider(
  organisationId: string,
): Promise<PlacementProviderProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placement_providers")
    .select(
      "description, contact_email, contact_phone, address, state, city, safeguarding_lead, is_accepting_interns",
    )
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[organisations] could not load provider profile", error);
    }
    return null;
  }

  return {
    description: data.description ?? "",
    contactEmail: data.contact_email ?? "",
    contactPhone: data.contact_phone ?? "",
    address: data.address ?? "",
    state: data.state ?? "",
    city: data.city ?? "",
    safeguardingLead: data.safeguarding_lead ?? "",
    isAcceptingInterns: data.is_accepting_interns,
  };
}

/**
 * Loads a single organisation with its members and their role assignments.
 * Returns null when the caller cannot access the organisation (RLS yields no
 * rows) ?" callers must treat null as "not found or forbidden".
 */
export async function getOrganisationDetail(organisationId: string): Promise<{
  summary: OrganisationSummary;
  members: OrganisationMember[];
  invitations: OrganisationInvitation[];
} | null> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organisations")
    .select("id, name, slug, type, status, verification_status")
    .eq("id", organisationId)
    .maybeSingle();

  if (!org) {
    return null;
  }

  const [{ data: memberships }, { data: assignments }, { data: invitations }] =
    await Promise.all([
      supabase
        .from("organisation_memberships")
        .select("id, user_id, status, is_owner, profiles(full_name, email)")
        .eq("organisation_id", organisationId),
      supabase
        .from("user_role_assignments")
        .select("user_id, role_key")
        .eq("organisation_id", organisationId),
      supabase
        .from("organisation_invitations")
        .select("id, email, role_key, status, expires_at, created_at")
        .eq("organisation_id", organisationId)
        .eq("status", "pending"),
    ]);

  const rolesByUser = new Map<string, RoleKey[]>();
  for (const assignment of assignments ?? []) {
    const list = rolesByUser.get(assignment.user_id) ?? [];
    list.push(assignment.role_key as RoleKey);
    rolesByUser.set(assignment.user_id, list);
  }

  const members: OrganisationMember[] = (memberships ?? []).map((row) => {
    const profile = row.profiles as {
      full_name: string | null;
      email: string;
    } | null;
    return {
      membershipId: row.id,
      userId: row.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? "",
      status: row.status,
      isOwner: row.is_owner,
      roles: rolesByUser.get(row.user_id) ?? [],
    };
  });

  const invs: OrganisationInvitation[] = (invitations ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    roleKey: row.role_key as RoleKey,
    status: row.status as OrganisationInvitation["status"],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));

  const currentUserOwner =
    members.find((m) => m.isOwner && m.status === "active")?.isOwner ?? false;

  return {
    summary: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type as OrganisationType,
      status: org.status as OrganisationSummary["status"],
      verificationStatus:
        org.verification_status as OrganisationSummary["verificationStatus"],
      isOwner: currentUserOwner,
      memberCount: members.filter((m) => m.status === "active").length,
    },
    members,
    invitations: invs,
  };
}
