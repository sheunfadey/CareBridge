import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/permissions/registry";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import type { CurrentUser } from "@/server/auth/current-user";
import { AuthorisationError, assertPermission } from "@/server/auth/guards";
import type { RoleKey } from "@/types/database";

export type CareFacilityOption = {
  id: string;
  name: string;
  status: string;
  capacity: number | null;
};

export type CareWorkspace = {
  organisationId: string;
  name: string;
  slug: string;
  type: "care_home" | "home_care_agency";
  isOwner: boolean;
  roles: RoleKey[];
  facilities: CareFacilityOption[];
};

const CARE_PERMISSIONS: PermissionKey[] = [
  "resident_view",
  "resident_manage",
  "care_plan_manage",
  "care_record_manage",
  "shift_view",
  "shift_manage",
  "staff_manage",
  "medication_manage",
  "incident_view",
  "incident_manage",
  "inventory_view",
  "inventory_manage",
  "expense_manage",
  "expense_approve",
  "invoice_view",
  "invoice_manage",
  "care_report_view",
];

export function hasAnyCarePermission(user: CurrentUser): boolean {
  return (
    user.isSuperAdmin ||
    CARE_PERMISSIONS.some((permission) => userHasPermission(user, permission))
  );
}

/**
 * Care workspaces are organisations of type care_home/home_care_agency that
 * the user belongs to. Super administrators see every care organisation.
 */
export async function listCareWorkspaces(
  user: CurrentUser,
): Promise<CareWorkspace[]> {
  const supabase = await createClient();

  let query = supabase
    .from("organisations")
    .select("id, name, slug, type")
    .in("type", ["care_home", "home_care_agency"])
    .order("name");

  if (!user.isSuperAdmin) {
    const organisationIds = user.organisations.map((org) => org.organisationId);
    if (organisationIds.length === 0) return [];
    query = query.in("id", organisationIds);
  }

  const { data: organisations, error } = await query;
  if (error || !organisations) return [];

  const facilitiesResult = await supabase
    .from("care_facilities")
    .select("id, organisation_id, name, status, capacity")
    .in(
      "organisation_id",
      organisations.map((org) => org.id),
    )
    .order("name");

  const facilitiesByOrg = new Map<string, CareFacilityOption[]>();
  for (const facility of facilitiesResult.data ?? []) {
    const list = facilitiesByOrg.get(facility.organisation_id) ?? [];
    list.push({
      id: facility.id,
      name: facility.name,
      status: facility.status,
      capacity: facility.capacity,
    });
    facilitiesByOrg.set(facility.organisation_id, list);
  }

  return organisations.map((org) => {
    const membership = user.organisations.find(
      (item) => item.organisationId === org.id,
    );
    return {
      organisationId: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type as CareWorkspace["type"],
      isOwner: Boolean(membership?.isOwner) || user.isSuperAdmin,
      roles: membership?.roles ?? [],
      facilities: facilitiesByOrg.get(org.id) ?? [],
    };
  });
}

export async function canInWorkspace(
  organisationId: string,
  permission: PermissionKey,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    p_permission: permission,
    p_organisation: organisationId,
  });
  return !error && Boolean(data);
}

/**
 * Resolves the workspace for a page. When `requested` is provided it must be a
 * workspace the user can access; otherwise the first workspace where the user
 * holds the required permission is used.
 */
export async function resolveCareWorkspace(
  user: CurrentUser,
  options: { permission?: PermissionKey; requested?: string } = {},
): Promise<CareWorkspace | null> {
  const workspaces = await listCareWorkspaces(user);
  if (workspaces.length === 0) return null;

  if (options.requested) {
    const requested = workspaces.find(
      (workspace) => workspace.organisationId === options.requested,
    );
    if (requested) {
      if (
        !options.permission ||
        (await canInWorkspace(requested.organisationId, options.permission))
      ) {
        return requested;
      }
    }
  }

  if (!options.permission) {
    return workspaces[0];
  }

  for (const workspace of workspaces) {
    if (await canInWorkspace(workspace.organisationId, options.permission)) {
      return workspace;
    }
  }

  return null;
}

export type CarePageContext = {
  user: CurrentUser;
  workspace: CareWorkspace;
  facilities: CareFacilityOption[];
  facility: CareFacilityOption | null;
  can: (permission: PermissionKey) => Promise<boolean>;
};

export async function requireCarePage(options: {
  permission: PermissionKey;
  requestedOrganisation?: string;
  requestedFacility?: string;
  redirectTo?: string;
}): Promise<CarePageContext> {
  const user = await getCurrentUser();
  const redirectTo = options.redirectTo ?? "/dashboard/care-homes";

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const workspace = await resolveCareWorkspace(user, {
    permission: options.permission,
    requested: options.requestedOrganisation,
  });

  if (!workspace) {
    redirect("/dashboard?care=unavailable");
  }

  const facilities = workspace.facilities;
  const facility =
    facilities.find((item) => item.id === options.requestedFacility) ??
    facilities[0] ??
    null;

  return {
    user,
    workspace,
    facilities,
    facility,
    can: (permission) => canInWorkspace(workspace.organisationId, permission),
  };
}

/**
 * Server-action guard. Throws AuthorisationError when the caller lacks the
 * permission in the supplied organisation.
 */
export async function assertCarePermission(
  user: CurrentUser,
  organisationId: string,
  permission: PermissionKey,
): Promise<void> {
  if (!user.isSuperAdmin && !user.organisations.some((org) => org.organisationId === organisationId)) {
    throw new AuthorisationError("Not a member of this care workspace", "FORBIDDEN");
  }
  await assertPermission(user.id, permission, organisationId);
}

export function assertCareFacility(
  workspace: CareWorkspace,
  facilityId: string,
): void {
  if (!workspace.facilities.some((facility) => facility.id === facilityId)) {
    throw new AuthorisationError("Facility is not part of this workspace", "FORBIDDEN");
  }
}
