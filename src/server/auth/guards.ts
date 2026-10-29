import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/permissions/registry";
import type { Json } from "@/types/database";

/**
 * Thrown by server-side guards. Never surfaced verbatim to users.
 */
export class AuthorisationError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "AuthorisationError";
  }
}

export async function writeAuditLog(entry: {
  actorId: string | null;
  organisationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
}) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_id: entry.actorId,
    organisation_id: entry.organisationId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  });
}

/**
 * Server-side permission gate. Use inside Server Actions and Route Handlers.
 * Delegates the check to the database function `has_permission`, which is the
 * same logic RLS relies on.
 */
export async function assertPermission(
  userId: string,
  permission: PermissionKey,
  organisationId: string | null = null,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    p_permission: permission,
    p_organisation: organisationId ?? undefined,
  });

  if (error) {
    throw new AuthorisationError("Permission check failed", "FORBIDDEN");
  }
  if (!data) {
    throw new AuthorisationError(
      `Missing permission: ${permission}`,
      "FORBIDDEN",
    );
  }
}
