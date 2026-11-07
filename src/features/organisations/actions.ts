"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type CurrentUser } from "@/server/auth/current-user";
import { AuthorisationError, assertPermission } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit/record-audit";
import { PRIVILEGED_ROLES, ROLE_LABELS } from "@/lib/permissions/registry";
import { sendEmail } from "@/lib/email/send";
import { organisationInvitationEmail } from "@/lib/email/templates/organisation-invitation";
import { getPublicEnv } from "@/lib/env";
import { createOrganisationSchema, inviteMemberSchema } from "@/lib/validation/organisation";
import type { OrganisationType, RoleKey } from "@/types/database";

export type OrgActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] = [...(result[key] ?? []), issue.message];
  }
  return result;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function requireAuthorisedUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorisationError("Not signed in", "UNAUTHENTICATED");
  }
  return user;
}

function toFriendlyError(error: unknown): OrgActionResult {
  if (error instanceof AuthorisationError) {
    return { ok: false, message: "You do not have permission to do that." };
  }
  console.error("[organisations] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

export async function acceptInvitationAction(
  token: string,
): Promise<OrgActionResult> {
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return { ok: false, message: "This invitation link is not valid." };
  }

  try {
    await requireAuthorisedUser();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("accept_invitation", {
      p_token: token,
    });

    if (error || !data) {
      const message = error?.message?.toLowerCase() ?? "";
      return {
        ok: false,
        message: message.includes("expired")
          ? "This invitation has expired. Ask the organisation for a new one."
          : message.includes("different email")
            ? "This invitation was sent to a different email address."
            : "We could not accept this invitation.",
      };
    }

    revalidatePath("/dashboard/organisation");
    return {
      ok: true,
      message: "Invitation accepted.",
      redirectTo: `/dashboard/organisation/${data}`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function createOrganisationAction(input: {
  name: string;
  type: OrganisationType;
  contactEmail?: string;
  state?: string;
  city?: string;
}): Promise<OrgActionResult> {
  const parsed = createOrganisationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireAuthorisedUser();
    const supabase = await createClient();

    const baseSlug = slugify(parsed.data.name);
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({
        name: parsed.data.name,
        slug,
        type: parsed.data.type,
        status: "pending",
        contact_email: parsed.data.contactEmail || null,
        state: parsed.data.state || null,
        city: parsed.data.city || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      return {
        ok: false,
        message:
          orgError?.code === "23505"
            ? "An organisation with a similar name already exists."
            : "We could not create the organisation.",
      };
    }

    // The creator becomes the owner (active membership, is_owner = true).
    const { error: membershipError } = await supabase
      .from("organisation_memberships")
      .insert({
        organisation_id: org.id,
        user_id: user.id,
        status: "active",
        is_owner: true,
        joined_at: new Date().toISOString(),
      });

    if (membershipError) {
      return {
        ok: false,
        message: "Organisation created but your owner membership failed.",
      };
    }

    // Grant the owner role scoped to this organisation.
    await supabase.from("user_role_assignments").insert({
      user_id: user.id,
      role_key: ownerRoleForOrgType(parsed.data.type),
      organisation_id: org.id,
      granted_by: user.id,
    });

    await recordAudit({
      actorId: user.id,
      organisationId: org.id,
      action: "organisation.created",
      entityType: "organisation",
      entityId: org.id,
      metadata: { name: parsed.data.name, type: parsed.data.type },
    });

    revalidatePath("/dashboard/organisation");
    return {
      ok: true,
      message: "Organisation created.",
      redirectTo: `/dashboard/organisation/${org.id}`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

function ownerRoleForOrgType(type: OrganisationType): RoleKey {
  switch (type) {
    case "training_provider":
    case "platform_academy":
      return "training_admin";
    case "care_home":
    case "home_care_agency":
      return "care_home_owner";
    case "charity":
      return "charity_admin";
    case "recruitment_partner":
    case "corporate_customer":
      return "employer";
    default:
      return "care_home_owner";
  }
}

export async function inviteMemberAction(input: {
  organisationId: string;
  email: string;
  roleKey: RoleKey;
}): Promise<OrgActionResult> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireAuthorisedUser();
    await assertPermission(user.id, "user_invite", parsed.data.organisationId);

    if (PRIVILEGED_ROLES.includes(parsed.data.roleKey)) {
      return {
        ok: false,
        message: "That role can only be granted by a platform administrator.",
      };
    }

    const supabase = await createClient();
    const { data: invitation, error } = await supabase
      .from("organisation_invitations")
      .insert({
        organisation_id: parsed.data.organisationId,
        email: parsed.data.email,
        role_key: parsed.data.roleKey,
        token: crypto.randomUUID(),
        invited_by: user.id,
        status: "pending",
      })
      .select("id, token")
      .single();

    if (error || !invitation) {
      if (error?.message.toLowerCase().includes("user limit for this plan")) {
        return {
          ok: false,
          message:
            "This plan's user limit has been reached. Upgrade the subscription to invite more members.",
        };
      }
      if (error?.message.toLowerCase().includes("read-only because the subscription")) {
        return {
          ok: false,
          message:
            "This workspace is read-only because the subscription is suspended or expired.",
        };
      }
      return { ok: false, message: "We could not create the invitation." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: parsed.data.organisationId,
      action: "membership.invited",
      entityType: "organisation_invitation",
      entityId: invitation.id,
      metadata: { email: parsed.data.email, role: parsed.data.roleKey },
    });

    const emailDelivered = await sendInvitationEmail({
      organisationId: parsed.data.organisationId,
      token: invitation.token,
      email: parsed.data.email,
      roleKey: parsed.data.roleKey,
      inviterName: user.fullName,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    revalidatePath(`/dashboard/organisation/${parsed.data.organisationId}`);
    return {
      ok: true,
      message: emailDelivered
        ? `Invitation emailed to ${parsed.data.email}.`
        : `Invitation created for ${parsed.data.email}, but email delivery is not configured. Share the accept link from the invitations list.`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

/**
 * Sends the branded invitation email. Returns whether a real transport accepted
 * the message; the invitation row exists regardless.
 */
async function sendInvitationEmail(input: {
  organisationId: string;
  token: string;
  email: string;
  roleKey: RoleKey;
  inviterName: string | null;
  expiresAt: Date;
}): Promise<boolean> {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", input.organisationId)
    .maybeSingle();

  const env = getPublicEnv();
  const acceptUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/organisation/accept?token=${input.token}`;

  const email = organisationInvitationEmail({
    organisationName: org?.name ?? "an organisation",
    roleLabel: ROLE_LABELS[input.roleKey],
    inviterName: input.inviterName,
    acceptUrl,
    expiresAt: input.expiresAt,
  });

  const result = await sendEmail(
    {
      to: { email: input.email },
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: { type: "organisation_invitation" },
    },
    input.organisationId,
  );

  return result.ok;
}

export async function revokeInvitationAction(input: {
  organisationId: string;
  invitationId: string;
}): Promise<OrgActionResult> {
  try {
    const user = await requireAuthorisedUser();
    await assertPermission(user.id, "user_invite", input.organisationId);

    const supabase = await createClient();
    const { error } = await supabase
      .from("organisation_invitations")
      .update({ status: "revoked" })
      .eq("id", input.invitationId)
      .eq("organisation_id", input.organisationId);

    if (error) {
      return { ok: false, message: "We could not revoke that invitation." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "invitation.revoked",
      entityType: "organisation_invitation",
      entityId: input.invitationId,
    });

    revalidatePath(`/dashboard/organisation/${input.organisationId}`);
    return { ok: true, message: "Invitation revoked." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function assignRoleAction(input: {
  organisationId: string;
  userId: string;
  roleKey: RoleKey;
}): Promise<OrgActionResult> {
  try {
    const user = await requireAuthorisedUser();
    await assertPermission(user.id, "user_role_assign", input.organisationId);

    if (PRIVILEGED_ROLES.includes(input.roleKey)) {
      return {
        ok: false,
        message: "That role can only be granted by a platform administrator.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("user_role_assignments").insert({
      user_id: input.userId,
      role_key: input.roleKey,
      organisation_id: input.organisationId,
      granted_by: user.id,
    });

    if (error) {
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "That member already has this role."
            : "We could not assign that role.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "membership.role_assigned",
      entityType: "user_role_assignment",
      entityId: input.userId,
      metadata: { role: input.roleKey },
    });

    revalidatePath(`/dashboard/organisation/${input.organisationId}`);
    return { ok: true, message: "Role assigned." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function removeMemberAction(input: {
  organisationId: string;
  userId: string;
}): Promise<OrgActionResult> {
  try {
    const user = await requireAuthorisedUser();
    await assertPermission(user.id, "user_role_assign", input.organisationId);

    if (input.userId === user.id) {
      return { ok: false, message: "You cannot remove your own membership." };
    }

    const supabase = await createClient();

    const { error: roleError } = await supabase
      .from("user_role_assignments")
      .delete()
      .eq("user_id", input.userId)
      .eq("organisation_id", input.organisationId);
    if (roleError) {
      return { ok: false, message: "We could not revoke the member's roles." };
    }

    const { error } = await supabase
      .from("organisation_memberships")
      .update({ status: "removed" })
      .eq("organisation_id", input.organisationId)
      .eq("user_id", input.userId);
    if (error) {
      return { ok: false, message: "We could not remove that member." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "membership.removed",
      entityType: "organisation_membership",
      entityId: input.userId,
    });

    revalidatePath(`/dashboard/organisation/${input.organisationId}`);
    return { ok: true, message: "Member removed." };
  } catch (error) {
    return toFriendlyError(error);
  }
}
