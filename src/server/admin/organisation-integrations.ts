import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type OrganisationIntegrationKind =
  | "paystack"
  | "sms"
  | "email"
  | "custom_api";

export type OrganisationIntegrationSummary = {
  kind: OrganisationIntegrationKind;
  provider: string;
  mode: "sandbox" | "live" | null;
  publicKey: string;
  senderId: string;
  senderName: string;
  config: Record<string, unknown>;
  isEnabled: boolean;
  hasSecret: boolean;
  hasWebhookSecret: boolean;
  updatedAt: string | null;
};

export type OrganisationIntegrationRecord = OrganisationIntegrationSummary & {
  secretKey: string | null;
  webhookSecret: string | null;
};

function metadata(row: {
  kind: string;
  provider: string;
  mode: string | null;
  public_key: string | null;
  secret_key: string | null;
  webhook_secret: string | null;
  sender_id: string | null;
  sender_name: string | null;
  config: unknown;
  is_enabled: boolean;
  updated_at: string;
}): OrganisationIntegrationRecord {
  return {
    kind: row.kind as OrganisationIntegrationKind,
    provider: row.provider,
    mode: row.mode === "live" ? "live" : row.mode === "sandbox" ? "sandbox" : null,
    publicKey: row.public_key ?? "",
    secretKey: row.secret_key,
    webhookSecret: row.webhook_secret,
    senderId: row.sender_id ?? "",
    senderName: row.sender_name ?? "",
    config:
      row.config && typeof row.config === "object" && !Array.isArray(row.config)
        ? (row.config as Record<string, unknown>)
        : {},
    isEnabled: row.is_enabled,
    hasSecret: Boolean(row.secret_key),
    hasWebhookSecret: Boolean(row.webhook_secret || row.secret_key),
    updatedAt: row.updated_at ?? null,
  };
}

export async function getOrganisationBasic(organisationId: string): Promise<{
  id: string;
  name: string;
  slug: string;
  type: string;
} | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("organisations")
    .select("id, name, slug, type")
    .eq("id", organisationId)
    .maybeSingle();
  return data ?? null;
}

export async function listOrganisationIntegrations(
  organisationId: string,
): Promise<OrganisationIntegrationSummary[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("organisation_integrations")
    .select(
      "kind, provider, mode, public_key, secret_key, webhook_secret, sender_id, sender_name, config, is_enabled, updated_at",
    )
    .eq("organisation_id", organisationId)
    .order("kind");

  return (data ?? []).map((row) => {
    const record = metadata(row);
    return {
      kind: record.kind,
      provider: record.provider,
      mode: record.mode,
      publicKey: record.publicKey,
      senderId: record.senderId,
      senderName: record.senderName,
      config: record.config,
      isEnabled: record.isEnabled,
      hasSecret: record.hasSecret,
      hasWebhookSecret: record.hasWebhookSecret,
      updatedAt: record.updatedAt,
    };
  });
}

export async function getOrganisationIntegration(
  organisationId: string,
  kind: OrganisationIntegrationKind,
): Promise<OrganisationIntegrationRecord | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("organisation_integrations")
    .select(
      "kind, provider, mode, public_key, secret_key, webhook_secret, sender_id, sender_name, config, is_enabled, updated_at",
    )
    .eq("organisation_id", organisationId)
    .eq("kind", kind)
    .maybeSingle();
  return data ? metadata(data) : null;
}

export async function getEnabledIntegration(
  organisationId: string,
  kind: OrganisationIntegrationKind,
): Promise<OrganisationIntegrationRecord | null> {
  const integration = await getOrganisationIntegration(organisationId, kind);
  return integration?.isEnabled ? integration : null;
}
