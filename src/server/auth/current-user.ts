import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/permissions/registry";
import { ROLE_PERMISSIONS } from "@/lib/permissions/registry";
import type { PortalMode, RoleKey } from "@/types/database";

export type OrgMembership = {
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
  isOwner: boolean;
  roles: RoleKey[];
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  state: string | null;
  city: string | null;
  avatarUrl: string | null;
  timezone: string;
  activePortal: PortalMode;
  isSuperAdmin: boolean;
  roles: RoleKey[];
  organisations: OrgMembership[];
  permissions: Set<PermissionKey>;
};

/**
 * Resolves the authenticated user together with their roles, organisation
 * memberships and effective permissions. Returns null when unauthenticated.
 *
 * Authorisation must still be enforced by RLS in the database — this is a
 * convenience layer for server logic and UI gating, never the sole control.
 */
export const getCurrentUser = cache(
  async (): Promise<CurrentUser | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return buildCurrentUser(supabase, user);
  },
);

async function buildCurrentUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
): Promise<CurrentUser> {
  const [{ data: profile }, { data: assignments }, { data: memberships }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, phone, state, city, avatar_url, timezone, active_portal, is_super_admin",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_role_assignments")
        .select("role_key, organisation_id")
        .eq("user_id", user.id),
      supabase
        .from("organisation_memberships")
        .select(
          "organisation_id, is_owner, status, organisations(name, slug)",
        )
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

  const globalRoles = new Set<RoleKey>();
  const rolesByOrg = new Map<string, Set<RoleKey>>();

  for (const assignment of assignments ?? []) {
    const role = assignment.role_key as RoleKey;
    if (assignment.organisation_id) {
      const set = rolesByOrg.get(assignment.organisation_id) ?? new Set<RoleKey>();
      set.add(role);
      rolesByOrg.set(assignment.organisation_id, set);
    } else {
      globalRoles.add(role);
    }
  }

  const organisations: OrgMembership[] = (memberships ?? []).map((membership) => {
    const org = membership.organisations as
      | { name: string; slug: string }
      | null;
    return {
      organisationId: membership.organisation_id,
      organisationName: org?.name ?? "Unknown organisation",
      organisationSlug: org?.slug ?? "",
      isOwner: membership.is_owner,
      roles: Array.from(rolesByOrg.get(membership.organisation_id) ?? []),
    };
  });

  const isSuperAdmin =
    Boolean(profile?.is_super_admin) || globalRoles.has("super_admin");

  const permissions = new Set<PermissionKey>();
  const allRoles = new Set<RoleKey>([...globalRoles]);
  for (const org of organisations) {
    for (const role of org.roles) {
      allRoles.add(role);
    }
  }
  for (const role of allRoles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      permissions.add(permission);
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    state: profile?.state ?? null,
    city: profile?.city ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    timezone: profile?.timezone ?? "Africa/Lagos",
    activePortal: profile?.active_portal ?? "student",
    isSuperAdmin,
    roles: Array.from(allRoles),
    organisations,
    permissions,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export function userHasPermission(
  user: CurrentUser,
  permission: PermissionKey,
): boolean {
  if (user.isSuperAdmin) {
    return true;
  }
  return user.permissions.has(permission);
}

/**
 * Trainer accounts use the standalone trainer workspace and never the personal
 * dashboard. Course permissions alone are not enough, because care managers
 * hold them too. Platform super administrators are deliberately excluded: they
 * belong in the admin console, not in a tenant workspace.
 */
export function isTrainerAccount(user: CurrentUser): boolean {
  return (
    !user.isSuperAdmin &&
    (user.roles.includes("instructor") || user.roles.includes("training_admin"))
  );
}

/**
 * Organisation administrators run a care workspace. They oversee members,
 * trainers and learners, so they are not offered the personal portal switcher.
 */
export function isOrganisationAdmin(user: CurrentUser): boolean {
  return (
    !user.isSuperAdmin &&
    (user.roles.includes("care_home_owner") ||
      user.roles.includes("care_home_manager"))
  );
}

export function canAccessOrganisation(
  user: CurrentUser,
  organisationId: string,
): boolean {
  if (user.isSuperAdmin) {
    return true;
  }
  return user.organisations.some((org) => org.organisationId === organisationId);
}
