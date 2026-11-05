import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

/**
 * Canonical audit actions. Kept as a union so callers cannot invent
 * free-form action names that would fragment reporting.
 */
export type AuditAction =
  | "auth.registered"
  | "auth.login"
  | "auth.logout"
  | "onboarding.completed"
  | "organisation.created"
  | "organisation.updated"
  | "membership.invited"
  | "membership.accepted"
  | "membership.role_assigned"
  | "membership.role_revoked"
  | "membership.removed"
  | "invitation.revoked"
  | "verification.submitted"
  | "verification.reviewed"
  | "account.activated"
  | "account.deactivated"
  | "organisation.status.pending"
  | "organisation.status.active"
  | "organisation.status.suspended"
  | "organisation.status.disabled"
  | "organisation.verification.unverified"
  | "organisation.verification.pending"
  | "organisation.verification.verified"
  | "organisation.verification.rejected"
  | "course.created"
  | "course.updated"
  | "course.published"
  | "course.unpublished"
  | "course.category.created"
  | "course.category.updated"
  | "course.resource.created"
  | "course.module.created"
  | "course.lesson.created"
  | "course.enrolled"
  | "course.completed"
  | "course.assessment.created"
  | "course.assessment.question.created"
  | "course.assessment.published"
  | "course.assessment.unpublished"
  | "assessment.attempt.submitted"
  | "message.conversation.started"
  | "message.sent"
  | "certificate.issued"
  | "job.created"
  | "job.updated"
  | "job.published"
  | "job.closed"
  | "job.application.submitted"
  | "job.application.status_changed"
  | "internship.created"
  | "internship.updated"
  | "internship.opened"
  | "internship.closed"
  | "internship.application.submitted"
  | "internship.application.status_changed"
  | "placement.created"
  | "placement.updated"
  | "placement.activated"
  | "placement.completed"
  | "placement.terminated"
  | "placement.agreement.responded"
  | "internship.log.submitted"
  | "internship.log.reviewed"
  | "internship.attendance.recorded"
  | "internship.evaluation.submitted"
  | "internship.incident.reported"
  | "internship.incident.updated"
  | "internship.completion.issued"
  | "interview.scheduled"
  | "interview.updated"
  | "job.offer.sent"
  | "job.offer.responded"
  | "job.offer.withdrawn"
  | "internship.offer.sent"
  | "internship.offer.responded"
  | "internship.offer.withdrawn"
  | "organisation.verification_requested"
  | "placement_provider.updated"
  | "payment.checkout_started"
  | "payment.verified"
  | "payment.failed"
  | "payment.refunded"
  | "referral.partner.applied"
  | "referral.partner.reviewed"
  | "referral.policy.saved"
  | "referral.commission.reviewed"
  | "referral.payout.requested"
  | "referral.payout.reviewed"
  | "referral.payout.transfer"
  | "referral.payout_account.saved"
  | "referral.payout_account.verified"
  | "care.facility.saved"
  | "care.resident.saved"
  | "care.resident.contact_saved"
  | "care.resident.relationship_linked"
  | "care.resident.relationship_revoked"
  | "care.resident.consent_recorded"
  | "care.staff.saved"
  | "care.staff.qualification_saved"
  | "care.staff.training_saved"
  | "care.staff.document_saved"
  | "care.shift.saved"
  | "care.shift.assignment_saved"
  | "care.shift.assignment_removed"
  | "care.shift.attendance_saved"
  | "care.shift.handover_saved"
  | "care.plan.saved"
  | "care.plan.version_saved"
  | "care.plan.status_changed"
  | "care.plan.assignment_saved"
  | "care.record.saved"
  | "care.record.reviewed"
  | "care.medication.scheduled"
  | "care.medication.recorded"
  | "care.incident.reported"
  | "care.incident.updated"
  | "care.incident.action_saved"
  | "care.inventory.item_saved"
  | "care.inventory.movement_recorded"
  | "care.supplier.saved"
  | "care.expense.saved"
  | "care.purchase_request.saved"
  | "care.purchase_request.reviewed"
  | "care.invoice.created"
  | "care.invoice.issued"
  | "care.invoice.voided"
  | "care.invoice.payment_recorded"
  | "care.invoice.refund_recorded"
  | "charity.campaign.saved"
  | "charity.campaign.submitted"
  | "charity.campaign.reviewed"
  | "charity.allocation.recorded"
  | "charity.expense.recorded"
  | "charity.donation.started"
  | "charity.donation.preference_saved"
  | "charity.scholarship.programme_saved"
  | "charity.scholarship.applied"
  | "charity.scholarship.reviewed"
  | "charity.scholarship.awarded"
  | "charity.scholarship.award_status_changed"
  | "charity.scholarship.outcome_recorded"
  | "charity.impact.saved"
  | "billing.plan_saved"
  | "billing.subscription_plan_changed"
  | "billing.subscription_cancelled"
  | "billing.subscription_resumed"
  | "billing.payment_recorded"
  | "billing.status_changed"
  | "report.exported";

export type AuditEntry = {
  actorId: string | null;
  organisationId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Json;
};

/**
 * Writes an audit record through the request-scoped client, so RLS applies.
 * Failures are logged but never thrown — audit must not break the user flow,
 * and the database remains the source of truth via triggers where required.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: entry.actorId,
    organisation_id: entry.organisationId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  });

  if (error) {
    console.error("[audit] failed to write audit log", {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      message: error.message,
    });
  }
}
