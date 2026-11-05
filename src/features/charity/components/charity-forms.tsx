"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CareActionButton,
  CareDialogForm,
  CareForm,
  type CareField,
} from "@/features/care/components/care-form";
import {
  applyToProgrammeAction,
  createScholarshipAwardAction,
  recordCampaignAllocationAction,
  recordCampaignExpenseAction,
  recordScholarshipOutcomeAction,
  respondToScholarshipAwardAction,
  reviewCampaignAction,
  reviewScholarshipApplicationAction,
  saveCampaignAction,
  saveImpactReportAction,
  saveScholarshipProgrammeAction,
  startDonationAction,
  submitCampaignForApprovalAction,
  updateDonationPreferenceAction,
  updateScholarshipAwardStatusAction,
} from "@/features/charity/actions";
import type { CharityActionResult } from "@/features/charity/actions";
import {
  CAMPAIGN_ALLOCATION_TYPES,
  CAMPAIGN_EXPENSE_STATUSES,
  CAMPAIGN_REVIEW_DECISIONS,
  SCHOLARSHIP_APPLICATION_STATUSES,
  SCHOLARSHIP_COVERAGES,
  SCHOLARSHIP_PROGRAMME_STATUSES,
  campaignAllocationTypeLabels,
  campaignExpenseStatusLabels,
  campaignReviewDecisionLabels,
  scholarshipApplicationStatusLabels,
  scholarshipCoverageLabels,
  scholarshipProgrammeStatusLabels,
} from "@/lib/validation/charity";

type Values = Record<string, unknown>;
type InputOf<T> = T extends (input: infer I) => Promise<CharityActionResult> ? I : never;

function optionsFrom<K extends string>(
  keys: readonly K[],
  labels: Record<K, string>,
): { value: string; label: string }[] {
  return keys.map((key) => ({ value: key, label: labels[key] }));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function cast<T>(values: Values, extra: Values): InputOf<T> {
  return { ...extra, ...values } as unknown as InputOf<T>;
}

// Campaigns --------------------------------------------------------------------

export function CampaignDialogForm({
  organisationId,
  campaign,
}: {
  organisationId: string;
  campaign?: {
    id: string;
    title: string;
    slug: string;
    purpose: string;
    description: string | null;
    beneficiaryCriteria: string | null;
    fundingTargetMinorUnits: number;
    currency: string;
    startsOn: string;
    endsOn: string | null;
    isPublic: boolean;
    sponsorshipOptions: unknown;
    supportingDocuments: unknown;
  };
}) {
  const fields: CareField[] = [
    { name: "title", label: "Campaign title", required: true, defaultValue: campaign?.title },
    { name: "slug", label: "URL slug", defaultValue: campaign?.slug ?? "", help: "Leave blank to generate from the title." },
    { name: "fundingTarget", label: "Funding target (NGN)", required: true, defaultValue: campaign ? String(campaign.fundingTargetMinorUnits / 100) : "" },
    { name: "currency", label: "Currency", required: true, defaultValue: campaign?.currency ?? "NGN" },
    { name: "startsOn", label: "Starts on", type: "date", required: true, defaultValue: campaign?.startsOn ?? today() },
    { name: "endsOn", label: "Ends on", type: "date", defaultValue: campaign?.endsOn ?? "" },
    { name: "purpose", label: "Purpose", type: "textarea", required: true, defaultValue: campaign?.purpose },
    { name: "description", label: "Description", type: "textarea", defaultValue: campaign?.description ?? "" },
    { name: "beneficiaryCriteria", label: "Beneficiary criteria", type: "textarea", defaultValue: campaign?.beneficiaryCriteria ?? "" },
    {
      name: "sponsorshipOptions",
      label: "Sponsorship options",
      type: "textarea",
      defaultValue: Array.isArray(campaign?.sponsorshipOptions)
        ? (campaign?.sponsorshipOptions as string[]).join("\n")
        : "",
      help: "One option per line.",
    },
    {
      name: "supportingDocuments",
      label: "Supporting documents",
      type: "textarea",
      defaultValue: Array.isArray(campaign?.supportingDocuments)
        ? (campaign?.supportingDocuments as string[]).join("\n")
        : "",
      help: "One reference or link per line. File uploads are not enabled yet.",
    },
    { name: "isPublic", label: "List publicly once approved", type: "checkbox", defaultValue: campaign?.isPublic ?? true },
  ];

  return (
    <CareDialogForm
      trigger={campaign ? "Edit campaign" : "New campaign"}
      triggerVariant={campaign ? "outline" : "default"}
      title={campaign ? "Edit campaign" : "Create a charity campaign"}
      description="Campaigns are reviewed before they can accept public donations. Approval requires a separate reviewer."
      submitLabel="Save campaign"
      fields={fields}
      action={(values) =>
        saveCampaignAction(
          cast<typeof saveCampaignAction>(values, {
            organisationId,
            campaignId: campaign?.id,
          }),
        )
      }
    />
  );
}

export function SubmitCampaignButton({ organisationId, campaignId }: { organisationId: string; campaignId: string }) {
  return (
    <CareActionButton
      label="Submit for approval"
      extra={{ organisationId, campaignId }}
      action={(values) => submitCampaignForApprovalAction(cast<typeof submitCampaignForApprovalAction>(values, {}))}
    />
  );
}

export function CampaignReviewForm({ organisationId, campaignId }: { organisationId: string; campaignId: string }) {
  const fields: CareField[] = [
    {
      name: "decision",
      label: "Decision",
      type: "select",
      required: true,
      defaultValue: "approved",
      options: optionsFrom(CAMPAIGN_REVIEW_DECISIONS, campaignReviewDecisionLabels),
    },
    { name: "notes", label: "Review note", type: "textarea", required: true },
  ];
  return (
    <CareForm
      submitLabel="Record decision"
      fields={fields}
      action={(values) =>
        reviewCampaignAction(cast<typeof reviewCampaignAction>(values, { organisationId, campaignId }))
      }
    />
  );
}

export function AllocationDialogForm({
  organisationId,
  campaignId,
  currency,
}: {
  organisationId: string;
  campaignId: string;
  currency: string;
}) {
  const fields: CareField[] = [
    {
      name: "allocationType",
      label: "Type",
      type: "select",
      required: true,
      defaultValue: "allocation",
      options: optionsFrom(CAMPAIGN_ALLOCATION_TYPES, campaignAllocationTypeLabels),
    },
    { name: "category", label: "Category", required: true, placeholder: "Scholarships, training, operations" },
    { name: "amount", label: `Amount (${currency})`, required: true, placeholder: "0.00" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record allocation"
      triggerVariant="outline"
      title="Allocate campaign funds"
      description="Allocations are append-only. Record a release to reverse part of an allocation."
      submitLabel="Save allocation"
      fields={fields}
      action={(values) =>
        recordCampaignAllocationAction(
          cast<typeof recordCampaignAllocationAction>(values, { organisationId, campaignId }),
        )
      }
    />
  );
}

export function CampaignExpenseDialogForm({
  organisationId,
  campaignId,
  currency,
}: {
  organisationId: string;
  campaignId: string;
  currency: string;
}) {
  const fields: CareField[] = [
    { name: "category", label: "Category", required: true, placeholder: "Training fees, transport, materials" },
    { name: "amount", label: `Amount (${currency})`, required: true, placeholder: "0.00" },
    { name: "incurredOn", label: "Incurred on", type: "date", required: true, defaultValue: today() },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: optionsFrom(CAMPAIGN_EXPENSE_STATUSES, campaignExpenseStatusLabels),
    },
    { name: "payee", label: "Payee" },
    { name: "receiptReference", label: "Receipt reference" },
    { name: "description", label: "Description", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record expense"
      triggerVariant="outline"
      title="Record a campaign expense"
      description="Expenses are append-only and count as disbursed funds when approved or paid."
      submitLabel="Save expense"
      fields={fields}
      action={(values) =>
        recordCampaignExpenseAction(
          cast<typeof recordCampaignExpenseAction>(values, { organisationId, campaignId }),
        )
      }
    />
  );
}

export function ImpactReportDialogForm({
  organisationId,
  campaignId,
  campaigns,
  report,
}: {
  organisationId: string;
  campaignId?: string;
  campaigns?: { id: string; title: string }[];
  report?: {
    id: string;
    campaignId: string;
    title: string;
    summary: string | null;
    metrics: unknown;
    isPublished: boolean;
  };
}) {
  const fields: CareField[] = [
    ...(!campaignId && campaigns
      ? [
          {
            name: "campaignId",
            label: "Campaign",
            type: "select" as const,
            required: true,
            options: campaigns.map((campaign) => ({
              value: campaign.id,
              label: campaign.title,
            })),
          },
        ]
      : []),
    { name: "title", label: "Report title", required: true, defaultValue: report?.title },
    { name: "summary", label: "Summary", type: "textarea", required: true, defaultValue: report?.summary ?? "" },
    {
      name: "metrics",
      label: "Metrics (JSON or text)",
      type: "textarea",
      defaultValue:
        report?.metrics && typeof report.metrics === "object"
          ? JSON.stringify(report.metrics, null, 2)
          : "",
      help: "Optional. Key figures are shown on the published campaign page.",
    },
    { name: "isPublished", label: "Publish publicly", type: "checkbox", defaultValue: report?.isPublished ?? false },
  ];
  return (
    <CareDialogForm
      trigger={report ? "Edit report" : "New impact report"}
      triggerVariant={report ? "outline" : "default"}
      title={report ? "Edit impact report" : "Publish an impact update"}
      submitLabel="Save report"
      fields={fields}
      action={(values) =>
        saveImpactReportAction(
          cast<typeof saveImpactReportAction>(values, {
            organisationId,
            campaignId: campaignId ?? report?.campaignId ?? (values.campaignId as string),
            reportId: report?.id,
          }),
        )
      }
    />
  );
}

// Donations --------------------------------------------------------------------

export function DonateForm({
  campaignId,
  campaignTitle,
}: {
  campaignId: string;
  campaignTitle: string;
}) {
  const [amount, setAmount] = useState("");
  const [publicAcknowledgement, setPublicAcknowledgement] = useState(false);
  const [donorDisplayName, setDonorDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You are supporting <span className="font-medium text-brand-strong">{campaignTitle}</span>.
        Payments are verified server-side; a donation is recorded only after the
        provider confirms it.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="donation-amount">Amount (NGN)</Label>
          <Input
            id="donation-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[1000, 2500, 5000, 10000].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(preset))}
              >
                ₦{preset.toLocaleString("en-NG")}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-input"
              checked={publicAcknowledgement}
              onChange={(event) => setPublicAcknowledgement(event.target.checked)}
            />
            <span>
              <span className="font-medium text-brand-strong">Acknowledge me publicly</span>
              <span className="block text-xs text-muted-foreground">
                Only your chosen display name and amount are shown. Your email is never public.
              </span>
            </span>
          </label>
          {publicAcknowledgement ? (
            <Input
              placeholder="Display name (optional — defaults to Supporter)"
              value={donorDisplayName}
              onChange={(event) => setDonorDisplayName(event.target.value)}
            />
          ) : null}
        </div>
      </div>
      <div>
        <Label htmlFor="donation-message">Message (optional)</Label>
        <Input
          id="donation-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      <Button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startDonationAction({
              campaignId,
              amount,
              publicAcknowledgement,
              donorDisplayName: donorDisplayName || undefined,
              message: message || undefined,
            });
            if (result.ok && result.redirectTo) {
              window.location.assign(result.redirectTo);
              return;
            }
            if (result.redirectTo) {
              window.location.assign(result.redirectTo);
              return;
            }
            setError(result.ok ? null : result.message);
          });
        }}
      >
        {isPending ? "Starting checkout…" : "Donate securely"}
      </Button>
    </div>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}

export function DonationPreferenceDialogForm({
  donationId,
  isPublic,
  donorDisplayName,
  message,
}: {
  donationId: string;
  isPublic: boolean;
  donorDisplayName: string | null;
  message: string | null;
}) {
  const fields: CareField[] = [
    { name: "publicAcknowledgement", label: "Acknowledge me publicly", type: "checkbox", defaultValue: isPublic },
    { name: "donorDisplayName", label: "Display name", defaultValue: donorDisplayName ?? "" },
    { name: "message", label: "Message", type: "textarea", defaultValue: message ?? "" },
  ];
  return (
    <CareDialogForm
      trigger="Acknowledgement"
      triggerVariant="ghost"
      title="Donation acknowledgement"
      description="Public acknowledgements show only your chosen display name and amount."
      submitLabel="Save preference"
      fields={fields}
      action={(values) =>
        updateDonationPreferenceAction(
          cast<typeof updateDonationPreferenceAction>(values, { donationId }),
        )
      }
    />
  );
}

// Scholarships -----------------------------------------------------------------

export function ProgrammeDialogForm({
  organisationId,
  courses,
  programme,
}: {
  organisationId: string;
  courses: { id: string; title: string }[];
  programme?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    eligibility: string;
    coverage: "full" | "partial";
    maxAwardMinorUnits: number;
    currency: string;
    courseId: string | null;
    opensOn: string;
    closesOn: string | null;
    status: string;
    isPublic: boolean;
  };
}) {
  const fields: CareField[] = [
    { name: "name", label: "Programme name", required: true, defaultValue: programme?.name },
    { name: "slug", label: "URL slug", defaultValue: programme?.slug ?? "" },
    { name: "maxAward", label: "Maximum award", required: true, defaultValue: programme ? String(programme.maxAwardMinorUnits / 100) : "" },
    { name: "currency", label: "Currency", required: true, defaultValue: programme?.currency ?? "NGN" },
    {
      name: "coverage",
      label: "Coverage",
      type: "select",
      required: true,
      defaultValue: programme?.coverage ?? "partial",
      options: optionsFrom(SCHOLARSHIP_COVERAGES, scholarshipCoverageLabels),
    },
    {
      name: "courseId",
      label: "Course allocation",
      type: "select",
      options: courses.map((course) => ({ value: course.id, label: course.title })),
      defaultValue: programme?.courseId ?? "",
    },
    { name: "opensOn", label: "Opens on", type: "date", required: true, defaultValue: programme?.opensOn ?? today() },
    { name: "closesOn", label: "Closes on", type: "date", defaultValue: programme?.closesOn ?? "" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: programme?.status ?? "draft",
      options: optionsFrom(SCHOLARSHIP_PROGRAMME_STATUSES, scholarshipProgrammeStatusLabels),
    },
    { name: "eligibility", label: "Eligibility", type: "textarea", required: true, defaultValue: programme?.eligibility },
    { name: "description", label: "Description", type: "textarea", defaultValue: programme?.description ?? "" },
    { name: "isPublic", label: "List publicly when open", type: "checkbox", defaultValue: programme?.isPublic ?? true },
  ];
  return (
    <CareDialogForm
      trigger={programme ? "Edit programme" : "New programme"}
      triggerVariant={programme ? "outline" : "default"}
      title={programme ? "Edit scholarship programme" : "Create a scholarship programme"}
      description="Applicants can apply while the programme is open. Awards create a scholarship course enrolment when accepted."
      submitLabel="Save programme"
      fields={fields}
      action={(values) =>
        saveScholarshipProgrammeAction(
          cast<typeof saveScholarshipProgrammeAction>(values, {
            organisationId,
            programmeId: programme?.id,
          }),
        )
      }
    />
  );
}

export function ScholarshipApplicationDialogForm({ programmeId }: { programmeId: string }) {
  const fields: CareField[] = [
    { name: "statement", label: "Your circumstances", type: "textarea", required: true, help: "At least 50 characters. Explain why you need support." },
    { name: "evidenceReferences", label: "Evidence references", type: "textarea", help: "One reference or link per line. File uploads are not enabled yet." },
  ];
  return (
    <CareDialogForm
      trigger="Apply"
      title="Apply for this scholarship"
      description="Applications are reviewed by the charity team. Decisions are recorded with reasons."
      submitLabel="Submit application"
      fields={fields}
      action={(values) =>
        applyToProgrammeAction(
          cast<typeof applyToProgrammeAction>(values, { programmeId }),
        )
      }
    />
  );
}

export function ScholarshipReviewForm({
  organisationId,
  applicationId,
  status,
}: {
  organisationId: string;
  applicationId: string;
  status: string;
}) {
  const fields: CareField[] = [
    {
      name: "status",
      label: "Decision",
      type: "select",
      required: true,
      defaultValue: status,
      options: optionsFrom(
        SCHOLARSHIP_APPLICATION_STATUSES.filter(
          (value) => value !== "submitted" && value !== "withdrawn",
        ),
        scholarshipApplicationStatusLabels,
      ),
    },
    { name: "notes", label: "Notes / reason", type: "textarea" },
  ];
  return (
    <CareForm
      submitLabel="Save review"
      fields={fields}
      action={(values) =>
        reviewScholarshipApplicationAction(
          cast<typeof reviewScholarshipApplicationAction>(values, {
            organisationId,
            applicationId,
          }),
        )
      }
    />
  );
}

export function AwardDialogForm({
  organisationId,
  applicationId,
  courses,
  maxAwardMinorUnits,
  currency,
}: {
  organisationId: string;
  applicationId: string;
  courses: { id: string; title: string }[];
  maxAwardMinorUnits: number;
  currency: string;
}) {
  const fields: CareField[] = [
    { name: "amount", label: `Award amount (${currency}, max ${maxAwardMinorUnits / 100})`, required: true, placeholder: "0.00" },
    {
      name: "coverage",
      label: "Coverage",
      type: "select",
      required: true,
      defaultValue: "partial",
      options: optionsFrom(SCHOLARSHIP_COVERAGES, scholarshipCoverageLabels),
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: courses.map((course) => ({ value: course.id, label: course.title })),
    },
  ];
  return (
    <CareDialogForm
      trigger="Award"
      title="Award a scholarship"
      description="The applicant must accept before course access is created."
      submitLabel="Create award"
      fields={fields}
      action={(values) =>
        createScholarshipAwardAction(
          cast<typeof createScholarshipAwardAction>(values, {
            organisationId,
            applicationId,
          }),
        )
      }
    />
  );
}

export function AwardResponseButtons({ awardId }: { awardId: string }) {
  return (
    <div className="flex gap-2">
      <CareActionButton
        label="Accept award"
        extra={{ awardId, decision: "accepted" }}
        action={(values) => respondToScholarshipAwardAction(cast<typeof respondToScholarshipAwardAction>(values, {}))}
      />
      <CareActionButton
        label="Decline"
        variant="ghost"
        confirm="Decline this award?"
        extra={{ awardId, decision: "declined" }}
        action={(values) => respondToScholarshipAwardAction(cast<typeof respondToScholarshipAwardAction>(values, {}))}
      />
    </div>
  );
}

export function AwardStatusButtons({
  organisationId,
  awardId,
  status,
}: {
  organisationId: string;
  awardId: string;
  status: string;
}) {
  const transitions: { label: string; status: "active" | "completed" | "revoked" }[] = [];
  if (status === "awarded") transitions.push({ label: "Revoke", status: "revoked" });
  if (status === "accepted") {
    transitions.push({ label: "Activate", status: "active" });
    transitions.push({ label: "Revoke", status: "revoked" });
  }
  if (status === "active") {
    transitions.push({ label: "Mark completed", status: "completed" });
    transitions.push({ label: "Revoke", status: "revoked" });
  }
  if (transitions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((transition) => (
        <CareActionButton
          key={transition.status}
          label={transition.label}
          variant={transition.status === "revoked" ? "ghost" : "outline"}
          extra={{ organisationId, awardId, status: transition.status }}
          action={(values) => updateScholarshipAwardStatusAction(cast<typeof updateScholarshipAwardStatusAction>(values, {}))}
        />
      ))}
    </div>
  );
}

export function OutcomeDialogForm({
  organisationId,
  awardId,
}: {
  organisationId: string;
  awardId: string;
}) {
  const fields: CareField[] = [
    { name: "completionOutcome", label: "Training completion outcome", type: "textarea" },
    { name: "internshipOutcome", label: "Internship outcome", type: "textarea" },
    { name: "employmentOutcome", label: "Employment outcome (if shareable)", type: "textarea" },
    { name: "outcomeShareable", label: "Outcome may be shared in impact reporting", type: "checkbox" },
  ];
  return (
    <CareDialogForm
      trigger="Record outcome"
      triggerVariant="ghost"
      title="Record scholarship outcome"
      description="Only record employment outcomes where the learner has agreed they can be shared."
      submitLabel="Save outcome"
      fields={fields}
      action={(values) =>
        recordScholarshipOutcomeAction(
          cast<typeof recordScholarshipOutcomeAction>(values, { organisationId, awardId }),
        )
      }
    />
  );
}
