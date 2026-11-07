"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  organisationIntegrationSchema,
  type OrganisationIntegrationInput,
} from "@/lib/validation/organisation";
import { requireUser } from "@/server/auth/current-user";
import { recordAudit } from "@/server/audit/record-audit";

export type IntegrationActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function saveOrganisationIntegrationAction(
  input: OrganisationIntegrationInput,
): Promise<IntegrationActionResult> {
  const parsed = organisationIntegrationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const user = await requireUser();
  if (!user.isSuperAdmin) {
    return {
      ok: false,
      message: "Only a platform super administrator can manage integrations.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Integration settings require the service-role client.",
    };
  }

  const data = parsed.data;
  const { data: existing } = await admin
    .from("organisation_integrations")
    .select("mode, public_key, sender_id, sender_name, config")
    .eq("organisation_id", data.organisationId)
    .eq("kind", data.kind)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    organisation_id: data.organisationId,
    kind: data.kind,
    provider: data.provider,
    mode:
      data.kind === "paystack"
        ? data.mode || "sandbox"
        : data.mode || existing?.mode || null,
    public_key: data.publicKey || existing?.public_key || null,
    sender_id: data.senderId || existing?.sender_id || null,
    sender_name: data.senderName || existing?.sender_name || null,
    config: data.configText
      ? JSON.parse(data.configText)
      : (existing?.config ?? {}),
    is_enabled: data.isEnabled,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  if (data.secretKey) payload.secret_key = data.secretKey;
  if (data.webhookSecret) payload.webhook_secret = data.webhookSecret;

  const { error } = await admin
    .from("organisation_integrations")
    .upsert(payload as never, { onConflict: "organisation_id,kind" });

  if (error) {
    return { ok: false, message: "We could not save that integration." };
  }

  await recordAudit({
    actorId: user.id,
    organisationId: data.organisationId,
    action: "organisation.integration_updated",
    entityType: "organisation_integration",
    entityId: `${data.organisationId}:${data.kind}`,
    metadata: { kind: data.kind, provider: data.provider, enabled: data.isEnabled },
  });

  revalidatePath(
    `/dashboard/admin/organisations/${data.organisationId}/integrations`,
  );
  revalidatePath("/dashboard/admin/organisations");
  revalidatePath("/dashboard/admin/system");
  return { ok: true, message: "Integration saved." };
}
