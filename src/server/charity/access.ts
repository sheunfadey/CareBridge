import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/permissions/registry";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import type { CurrentUser } from "@/server/auth/current-user";
import { AuthorisationError, assertPermission } from "@/server/auth/guards";
import type { RoleKey } from "@/types/database";

export type CharityWorkspace = {
  organisationId: string;
  name: string;
  slug: string;
  isOwner: boolean;
  roles: RoleKey[];
};

const CHARITY_ADMIN_PERMISSIONS: PermissionKey[] = [
  "charity_campaign_manage",
  "charity_campaign_approve",
  "donor_report_view",
  "scholarship_manage",
  "scholarship_review",
];

export async function listCharityWorkspaces(
  user: CurrentUser,
): Promise<CharityWorkspace[]> {
  const supabase = await createClient();
  let query = supabase
    .from("organisations")
    .select("id, name, slug")
    .eq("type", "charity")
    .order("name");

  if (!user.isSuperAdmin) {
    const organisationIds = user.organisations.map((org) => org.organisationId);
    if (organisationIds.length === 0) return [];
    query = query.in("id", organisationIds);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((org) => {
    const membership = user.organisations.find(
      (item) => item.organisationId === org.id,
    );
    return {
      organisationId: org.id,
      name: org.name,
      slug: org.slug,
      isOwner: Boolean(membership?.isOwner) || user.isSuperAdmin,
      roles: membership?.roles ?? [],
    };
  });
}

export function hasAnyCharityAdminPermission(user: CurrentUser): boolean {
  return (
    user.isSuperAdmin ||
    CHARITY_ADMIN_PERMISSIONS.some((permission) =>
      userHasPermission(user, permission),
    )
  );
}

export async function canInCharityWorkspace(
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

export async function resolveCharityWorkspace(
  user: CurrentUser,
  options: { permission?: PermissionKey; requested?: string } = {},
): Promise<CharityWorkspace | null> {
  if (!hasAnyCharityAdminPermission(user)) return null;

  const workspaces = await listCharityWorkspaces(user);
  if (workspaces.length === 0) return null;

  if (options.requested) {
    const requested = workspaces.find(
      (workspace) => workspace.organisationId === options.requested,
    );
    if (
      requested &&
      (!options.permission ||
        (await canInCharityWorkspace(requested.organisationId, options.permission)))
    ) {
      return requested;
    }
  }

  if (!options.permission) return workspaces[0];

  for (const workspace of workspaces) {
    if (await canInCharityWorkspace(workspace.organisationId, options.permission)) {
      return workspace;
    }
  }

  return null;
}

export type CharityPageContext = {
  user: CurrentUser;
  workspace: CharityWorkspace;
  can: (permission: PermissionKey) => Promise<boolean>;
};

async function workspaceHasAny(
  organisationId: string,
  permissions: PermissionKey[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (await canInCharityWorkspace(organisationId, permission)) return true;
  }
  return false;
}

export async function requireAnyCharityPage(options: {
  permissions: PermissionKey[];
  requestedOrganisation?: string;
  redirectTo?: string;
}): Promise<CharityPageContext> {
  const user = await getCurrentUser();
  const redirectTo = options.redirectTo ?? "/dashboard/charity";

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const workspaces = await listCharityWorkspaces(user);
  let workspace =
    workspaces.find(
      (item) => item.organisationId === options.requestedOrganisation,
    ) ?? null;

  if (workspace && (await workspaceHasAny(workspace.organisationId, options.permissions))) {
    const selected = workspace;
    return {
      user,
      workspace: selected,
      can: (permission) =>
        canInCharityWorkspace(selected.organisationId, permission),
    };
  }

  workspace = null;
  for (const candidate of workspaces) {
    if (await workspaceHasAny(candidate.organisationId, options.permissions)) {
      workspace = candidate;
      break;
    }
  }

  if (!workspace) {
    redirect("/dashboard?charity=unavailable");
  }

  const selected = workspace;
  return {
    user,
    workspace: selected,
    can: (permission) =>
      canInCharityWorkspace(selected.organisationId, permission),
  };
}

export async function requireCharityPage(options: {
  permission: PermissionKey;
  requestedOrganisation?: string;
  redirectTo?: string;
}): Promise<CharityPageContext> {
  const user = await getCurrentUser();
  const redirectTo = options.redirectTo ?? "/dashboard/charity";

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const workspace = await resolveCharityWorkspace(user, {
    permission: options.permission,
    requested: options.requestedOrganisation,
  });

  if (!workspace) {
    redirect("/dashboard?charity=unavailable");
  }

  return {
    user,
    workspace,
    can: (permission) =>
      canInCharityWorkspace(workspace.organisationId, permission),
  };
}

export async function assertCharityPermission(
  user: CurrentUser,
  organisationId: string,
  permission: PermissionKey,
): Promise<void> {
  if (
    !user.isSuperAdmin &&
    !user.organisations.some((org) => org.organisationId === organisationId)
  ) {
    throw new AuthorisationError("Not a member of this charity workspace", "FORBIDDEN");
  }
  await assertPermission(user.id, permission, organisationId);
}
