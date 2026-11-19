"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/server/auth/current-user";
import { AuthorisationError } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit/record-audit";
import { adminService } from "@/server/admin/admin-service";
import { createNotification } from "@/server/notifications/service";

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorisationError("Not signed in", "UNAUTHENTICATED");
  }
  if (!user.isSuperAdmin) {
    throw new AuthorisationError("Super admin required", "FORBIDDEN");
  }
  return user;
}

function sanitiseReason(reason: string): string {
  return reason.trim().slice(0, 500);
}

export async function setAccountStatusAction(input: {
  userId: string;
  status: "active" | "deactivated";
  reason?: string;
}): Promise<AdminActionResult> {
  try {
    const user = await requireSuperAdmin();

    if (input.userId === user.id) {
      return { ok: false, message: "You cannot change your own account status." };
    }

    const result = await adminService.setAccountStatus(input.userId, input.status);
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    await recordAudit({
      actorId: user.id,
      action:
        input.status === "deactivated"
          ? "account.deactivated"
          : "account.activated",
      entityType: "profile",
      entityId: input.userId,
      metadata: {
        account_status: input.status,
        via: "platform_admin",
        reason: input.reason ? sanitiseReason(input.reason) : null,
      },
    });

    await createNotification({
      userId: input.userId,
      category: "account",
      priority: "high",
      title:
        input.status === "deactivated"
          ? "Your account has been deactivated"
          : "Your account has been reactivated",
      body:
        input.status === "deactivated"
          ? "A platform administrator has deactivated your account. Contact support if you believe this is a mistake."
          : "A platform administrator has reactivated your account. You can sign in again.",
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/users");
    return {
      ok: true,
      message:
        input.status === "deactivated"
          ? "Account deactivated."
          : "Account reactivated.",
    };
  } catch (error) {
    if (error instanceof AuthorisationError) {
      return { ok: false, message: "You do not have permission to do that." };
    }
    console.error("[admin] setAccountStatusAction failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export async function setOrganisationStatusAction(input: {
  organisationId: string;
  status: "active" | "suspended" | "disabled" | "pending";
  reason?: string;
}): Promise<AdminActionResult> {
  try {
    const user = await requireSuperAdmin();

    const result = await adminService.setOrganisationStatus(
      input.organisationId,
      input.status,
    );
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: `organisation.status.${input.status}`,
      entityType: "organisation",
      entityId: input.organisationId,
      metadata: {
        status: input.status,
        via: "platform_admin",
        reason: input.reason ? sanitiseReason(input.reason) : null,
      },
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/organisations");
    return { ok: true, message: `Organisation marked as ${input.status}.` };
  } catch (error) {
    if (error instanceof AuthorisationError) {
      return { ok: false, message: "You do not have permission to do that." };
    }
    console.error("[admin] setOrganisationStatusAction failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export async function setOrganisationVerificationAction(input: {
  organisationId: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  notes?: string;
}): Promise<AdminActionResult> {
  try {
    const user = await requireSuperAdmin();

    const result = await adminService.setOrganisationVerification(
      input.organisationId,
      input.verificationStatus,
      user.id,
      input.notes ? sanitiseReason(input.notes) : undefined,
    );
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: `organisation.verification.${input.verificationStatus}`,
      entityType: "organisation",
      entityId: input.organisationId,
      metadata: {
        verification_status: input.verificationStatus,
        via: "platform_admin",
        notes: input.notes ? sanitiseReason(input.notes) : null,
      },
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/organisations");
    return {
      ok: true,
      message: `Verification set to ${input.verificationStatus}.`,
    };
  } catch (error) {
    if (error instanceof AuthorisationError) {
      return { ok: false, message: "You do not have permission to do that." };
    }
    console.error("[admin] setOrganisationVerificationAction failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/**
 * Hard-deletes an organisation and all tenant-scoped data. The caller must type
 * the organisation slug so an accidental click cannot destroy a workspace.
 */
export async function deleteOrganisationAction(input: {
  organisationId: string;
  confirmation: string;
  reason?: string;
}): Promise<AdminActionResult> {
  try {
    const user = await requireSuperAdmin();

    const organisation = await adminService.getOrganisation(input.organisationId);
    if (!organisation.ok) {
      return { ok: false, message: organisation.message };
    }

    const expectedSlug = organisation.data.slug;
    if (input.confirmation.trim().toLowerCase() !== expectedSlug.toLowerCase()) {
      return {
        ok: false,
        message: "Type the organisation slug exactly to confirm deletion.",
      };
    }

    const result = await adminService.deleteOrganisation(input.organisationId);
    if (!result.ok) {
      return {
        ok: false,
        message:
          result.reason === "UNAVAILABLE"
            ? result.message
            : "The organisation could not be deleted. Some linked records may still block it.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: null,
      action: "organisation.deleted",
      entityType: "organisation",
      entityId: input.organisationId,
      metadata: {
        name: organisation.data.name,
        slug: organisation.data.slug,
        type: organisation.data.type,
        status: organisation.data.status,
        via: "platform_admin",
        reason: input.reason ? sanitiseReason(input.reason) : null,
      },
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/organisations");
    return { ok: true, message: `${organisation.data.name} deleted.` };
  } catch (error) {
    if (error instanceof AuthorisationError) {
      return { ok: false, message: "You do not have permission to do that." };
    }
    console.error("[admin] deleteOrganisationAction failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
