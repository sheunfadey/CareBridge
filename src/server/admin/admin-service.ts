import "server-only";

import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganisationRow = Database["public"]["Tables"]["organisations"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "UNAVAILABLE" | "FAILED"; message: string };

const UNAVAILABLE_MESSAGE =
  "Platform administration requires SUPABASE_SERVICE_ROLE_KEY, which is not configured.";

function unavailable<T>(): AdminResult<T> {
  return { ok: false, reason: "UNAVAILABLE", message: UNAVAILABLE_MESSAGE };
}

function failed<T>(message: string): AdminResult<T> {
  return { ok: false, reason: "FAILED", message };
}

/**
 * Platform-level administration operations. Each function requires the caller to
 * have already been verified as a super admin by the calling server action —
 * these functions deliberately do not re-check the caller's identity, because
 * the admin client has no user context. Keep the super-admin check adjacent to
 * the call site (see src/features/admin/actions.ts).
 *
 * Every write here is paired with an audit record in the calling action.
 */
export const adminService = {
  isAvailable(): boolean {
    return hasAdminClient();
  },

  // ---- Users ---------------------------------------------------------------

  async listProfiles(options?: {
    search?: string;
    limit?: number;
  }): Promise<AdminResult<ProfileRow[]>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    let query = client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.search) {
      const term = `%${options.search}%`;
      query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) return failed(error.message);
    return { ok: true, data: data ?? [] };
  },

  async countProfiles(): Promise<AdminResult<number>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { count, error } = await client
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) return failed(error.message);
    return { ok: true, data: count ?? 0 };
  },

  async getProfile(userId: string): Promise<AdminResult<ProfileRow>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) return failed(error.message);
    if (!data) return failed("Account not found.");
    return { ok: true, data };
  },

  async setAccountStatus(
    userId: string,
    status: ProfileRow["status"],
  ): Promise<AdminResult<ProfileRow>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("profiles")
      .update({ status })
      .eq("id", userId)
      .select("*")
      .single();

    if (error || !data) return failed(error?.message ?? "Account update failed.");
    return { ok: true, data };
  },

  // ---- Organisations -------------------------------------------------------

  async listOrganisations(options?: {
    status?: OrganisationRow["status"];
    limit?: number;
  }): Promise<AdminResult<OrganisationRow[]>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    let query = client
      .from("organisations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;
    if (error) return failed(error.message);
    return { ok: true, data: data ?? [] };
  },

  /** Organisations awaiting review, oldest first, for the approval queue. */
  async listPendingOrganisations(
    limit = 50,
  ): Promise<AdminResult<OrganisationRow[]>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("organisations")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return failed(error.message);
    return { ok: true, data: data ?? [] };
  },

  async countPendingOrganisations(): Promise<AdminResult<number>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { count, error } = await client
      .from("organisations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) return failed(error.message);
    return { ok: true, data: count ?? 0 };
  },

  async getOrganisation(
    organisationId: string,
  ): Promise<AdminResult<OrganisationRow>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("organisations")
      .select("*")
      .eq("id", organisationId)
      .maybeSingle();

    if (error) return failed(error.message);
    if (!data) return failed("Organisation not found.");
    return { ok: true, data };
  },

  /**
   * Hard-deletes an organisation and every tenant-scoped row that cascades from
   * it. The database function defers restrictive foreign keys to the end of the
   * transaction so a single delete can cascade through history tables.
   */
  async deleteOrganisation(
    organisationId: string,
  ): Promise<AdminResult<{ id: string }>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { error } = await client.rpc("delete_organisation", {
      p_organisation_id: organisationId,
    });

    if (error) return failed(error.message);
    return { ok: true, data: { id: organisationId } };
  },

  async setOrganisationStatus(
    organisationId: string,
    status: OrganisationRow["status"],
  ): Promise<AdminResult<OrganisationRow>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("organisations")
      .update({ status })
      .eq("id", organisationId)
      .select("*")
      .single();

    if (error || !data) {
      return failed(error?.message ?? "Organisation update failed.");
    }
    return { ok: true, data };
  },

  async setOrganisationVerification(
    organisationId: string,
    verificationStatus: OrganisationRow["verification_status"],
    reviewerId: string,
    notes?: string,
  ): Promise<AdminResult<OrganisationRow>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("organisations")
      .update({ verification_status: verificationStatus })
      .eq("id", organisationId)
      .select("*")
      .single();

    if (error || !data) {
      return failed(error?.message ?? "Verification update failed.");
    }

    await client.from("organisation_verifications").insert({
      organisation_id: organisationId,
      status: verificationStatus,
      reviewer_id: reviewerId,
      notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    });

    return { ok: true, data };
  },

  // ---- Audit ---------------------------------------------------------------

  async listAuditLogs(limit = 50): Promise<AdminResult<AuditLogRow[]>> {
    const client = createAdminClient();
    if (!client) return unavailable();

    const { data, error } = await client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return failed(error.message);
    return { ok: true, data: data ?? [] };
  },
};
