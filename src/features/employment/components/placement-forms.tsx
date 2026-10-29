"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  completePlacementAction,
  createPlacementAction,
  issueCompletionRecordAction,
  recordAttendanceAction,
  reportIncidentAction,
  requestOrganisationVerificationAction,
  respondToPlacementAgreementAction,
  reviewWeeklyLogAction,
  submitEvaluationAction,
  submitWeeklyLogAction,
  updateIncidentAction,
  updatePlacementAction,
  updatePlacementProviderAction,
} from "@/features/employment/placement-actions";
import {
  ATTENDANCE_STATUSES,
  attendanceStatusLabels,
  EVALUATION_RECOMMENDATIONS,
  evaluationRecommendationLabels,
  INCIDENT_SEVERITIES,
  incidentSeverityLabels,
  PLACEMENT_STATUSES,
  placementStatusLabels,
} from "@/lib/validation/placement";
import type { PlacementSupervisorOption } from "@/server/employment/workspace-queries";

function useRun() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const run = (task: () => Promise<{
    ok: boolean;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    redirectTo?: string;
  }>) => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setSuccess(result.message ?? "Saved.");
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
        router.refresh();
      } else {
        setError(result.message ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return { run, isPending, error, success, fieldErrors };
}

function Feedback({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (error) return <FormAlert tone="error">{error}</FormAlert>;
  if (success) return <FormAlert tone="success">{success}</FormAlert>;
  return null;
}

export function PlacementAgreementButtons({
  placementId,
}: {
  placementId: string;
}) {
  const { run, isPending, error, success } = useRun();

  return (
    <div className="space-y-2">
      <Feedback error={error} success={success} />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isPending}
          onClick={() =>
            run(() =>
              respondToPlacementAgreementAction({
                placementId,
                agreementStatus: "accepted",
              }),
            )
          }
        >
          Accept agreement
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() =>
              respondToPlacementAgreementAction({
                placementId,
                agreementStatus: "declined",
              }),
            )
          }
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

export function WeeklyLogForm({ placementId }: { placementId: string }) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const today = new Date().toISOString().slice(0, 10);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(async () => {
      const result = await submitWeeklyLogAction({
        placementId,
        weekStart: String(formData.get("weekStart") ?? ""),
        weekEnd: String(formData.get("weekEnd") ?? ""),
        hours: Number(formData.get("hours") ?? 0),
        summary: String(formData.get("summary") ?? ""),
        challenges: String(formData.get("challenges") ?? ""),
        nextSteps: String(formData.get("nextSteps") ?? ""),
      });
      if (result.ok) form.reset();
      return result;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="log-week-start">Week start</Label>
          <Input
            id="log-week-start"
            name="weekStart"
            type="date"
            defaultValue={today}
            required
          />
          <FormFieldError messages={fieldErrors.weekStart} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="log-week-end">Week end</Label>
          <Input
            id="log-week-end"
            name="weekEnd"
            type="date"
            defaultValue={today}
            required
          />
          <FormFieldError messages={fieldErrors.weekEnd} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="log-hours">Hours</Label>
          <Input
            id="log-hours"
            name="hours"
            type="number"
            min={0}
            max={168}
            defaultValue={0}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="log-summary">What did you do this week?</Label>
        <Textarea id="log-summary" name="summary" rows={4} required />
        <FormFieldError messages={fieldErrors.summary} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="log-challenges">Challenges (optional)</Label>
          <Textarea id="log-challenges" name="challenges" rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="log-next">Next steps (optional)</Label>
          <Textarea id="log-next" name="nextSteps" rows={3} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit weekly log"}
      </Button>
    </form>
  );
}

export function ReviewLogButtons({ logId }: { logId: string }) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [feedback, setFeedback] = useState("");

  return (
    <div className="space-y-2">
      <Feedback error={error} success={success} />
      <Textarea
        rows={2}
        placeholder="Feedback for the candidate (optional)"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
      />
      <FormFieldError messages={fieldErrors.supervisorFeedback} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() =>
              reviewWeeklyLogAction({
                logId,
                status: "approved",
                supervisorFeedback: feedback,
              }),
            )
          }
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() =>
              reviewWeeklyLogAction({
                logId,
                status: "changes_requested",
                supervisorFeedback: feedback,
              }),
            )
          }
        >
          Request changes
        </Button>
      </div>
    </div>
  );
}

export function AttendanceForm({ placementId }: { placementId: string }) {
  const { run, isPending, error, success } = useRun();
  const today = new Date().toISOString().slice(0, 10);
  const [status, setStatus] = useState<(typeof ATTENDANCE_STATUSES)[number]>(
    "present",
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() =>
      recordAttendanceAction({
        placementId,
        attendanceDate: String(formData.get("attendanceDate") ?? ""),
        status,
        hours: Number(formData.get("hours") ?? 0),
        notes: String(formData.get("notes") ?? ""),
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="attendance-date">Date</Label>
          <Input
            id="attendance-date"
            name="attendanceDate"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attendance-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as (typeof ATTENDANCE_STATUSES)[number])
            }
          >
            <SelectTrigger id="attendance-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {attendanceStatusLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attendance-hours">Hours</Label>
          <Input
            id="attendance-hours"
            name="hours"
            type="number"
            min={0}
            max={24}
            defaultValue={0}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="attendance-notes">Notes (optional)</Label>
        <Input id="attendance-notes" name="notes" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving..." : "Record attendance"}
      </Button>
    </form>
  );
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function RatingSelect({
  id,
  label,
  name,
  defaultValue,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={String(defaultValue ?? 3)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RATING_OPTIONS.map((rating) => (
            <SelectItem key={rating} value={String(rating)}>
              {rating} / 5
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EvaluationForm({ placementId }: { placementId: string }) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const today = new Date().toISOString().slice(0, 10);
  const [recommendation, setRecommendation] = useState<
    (typeof EVALUATION_RECOMMENDATIONS)[number]
  >("pass");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() =>
      submitEvaluationAction({
        placementId,
        evaluationDate: String(formData.get("evaluationDate") ?? ""),
        overallRating: Number(formData.get("overallRating") ?? 3),
        carePracticeRating: Number(formData.get("carePracticeRating") ?? 3),
        communicationRating: Number(formData.get("communicationRating") ?? 3),
        professionalismRating: Number(
          formData.get("professionalismRating") ?? 3,
        ),
        safeguardingRating: Number(formData.get("safeguardingRating") ?? 3),
        strengths: String(formData.get("strengths") ?? ""),
        areasForImprovement: String(
          formData.get("areasForImprovement") ?? "",
        ),
        recommendation,
        status: "submitted",
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="evaluation-date">Date</Label>
          <Input
            id="evaluation-date"
            name="evaluationDate"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <RatingSelect
          id="evaluation-overall"
          name="overallRating"
          label="Overall"
        />
        <RatingSelect
          id="evaluation-care"
          name="carePracticeRating"
          label="Care practice"
        />
        <RatingSelect
          id="evaluation-communication"
          name="communicationRating"
          label="Communication"
        />
        <RatingSelect
          id="evaluation-professionalism"
          name="professionalismRating"
          label="Professionalism"
        />
        <RatingSelect
          id="evaluation-safeguarding"
          name="safeguardingRating"
          label="Safeguarding"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="evaluation-strengths">Strengths</Label>
          <Textarea id="evaluation-strengths" name="strengths" rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evaluation-areas">Areas for improvement</Label>
          <Textarea
            id="evaluation-areas"
            name="areasForImprovement"
            rows={3}
          />
        </div>
      </div>
      <div className="space-y-1.5 sm:max-w-xs">
        <Label htmlFor="evaluation-recommendation">Recommendation</Label>
        <Select
          value={recommendation}
          onValueChange={(value) =>
            setRecommendation(value as (typeof EVALUATION_RECOMMENDATIONS)[number])
          }
        >
          <SelectTrigger id="evaluation-recommendation" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVALUATION_RECOMMENDATIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {evaluationRecommendationLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit evaluation"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {fieldErrors.evaluationDate?.[0] ?? ""}
      </p>
    </form>
  );
}

export function IncidentForm({ placementId }: { placementId: string }) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [severity, setSeverity] = useState<
    (typeof INCIDENT_SEVERITIES)[number]
  >("medium");
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultOccurredAt = now.toISOString().slice(0, 16);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(async () => {
      const result = await reportIncidentAction({
        placementId,
        occurredAt: String(formData.get("occurredAt") ?? ""),
        category: String(formData.get("category") ?? ""),
        severity,
        description: String(formData.get("description") ?? ""),
      });
      if (result.ok) form.reset();
      return result;
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="incident-occurred">When did it happen?</Label>
          <Input
            id="incident-occurred"
            name="occurredAt"
            type="datetime-local"
            defaultValue={defaultOccurredAt}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incident-category">Category</Label>
          <Input
            id="incident-category"
            name="category"
            placeholder="e.g. Medication, safeguarding"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incident-severity">Severity</Label>
          <Select
            value={severity}
            onValueChange={(value) =>
              setSeverity(value as (typeof INCIDENT_SEVERITIES)[number])
            }
          >
            <SelectTrigger id="incident-severity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_SEVERITIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {incidentSeverityLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="incident-description">What happened?</Label>
        <Textarea
          id="incident-description"
          name="description"
          rows={4}
          required
        />
        <FormFieldError messages={fieldErrors.description} />
      </div>
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Reporting..." : "Report incident"}
      </Button>
    </form>
  );
}

export function CreatePlacementForm({
  applicationId,
  supervisors,
  defaults,
}: {
  applicationId: string;
  supervisors: PlacementSupervisorOption[];
  defaults: {
    startDate: string | null;
    endDate: string | null;
    expectedHours: number | null;
    location: string | null;
  };
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [supervisorId, setSupervisorId] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() =>
      createPlacementAction({
        applicationId,
        supervisorId,
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        expectedHours: formData.get("expectedHours")
          ? Number(formData.get("expectedHours"))
          : undefined,
        location: String(formData.get("location") ?? ""),
        state: String(formData.get("state") ?? ""),
        city: String(formData.get("city") ?? ""),
        learningObjectives: String(formData.get("learningObjectives") ?? ""),
        supervisionArrangements: String(
          formData.get("supervisionArrangements") ?? "",
        ),
        safeguardingCleared: formData.get("safeguardingCleared") === "on",
        insuranceCleared: formData.get("insuranceCleared") === "on",
      }),
    );
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="placement-start">Start date</Label>
          <Input
            id="placement-start"
            name="startDate"
            type="date"
            defaultValue={defaults.startDate ?? today}
            required
          />
          <FormFieldError messages={fieldErrors.startDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placement-end">End date</Label>
          <Input
            id="placement-end"
            name="endDate"
            type="date"
            defaultValue={defaults.endDate ?? ""}
            required
          />
          <FormFieldError messages={fieldErrors.endDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placement-supervisor">Supervisor</Label>
          <Select value={supervisorId} onValueChange={setSupervisorId}>
            <SelectTrigger id="placement-supervisor" className="w-full">
              <SelectValue placeholder="Assign later" />
            </SelectTrigger>
            <SelectContent>
              {supervisors.map((supervisor) => (
                <SelectItem key={supervisor.userId} value={supervisor.userId}>
                  {supervisor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placement-hours">Expected hours / week</Label>
          <Input
            id="placement-hours"
            name="expectedHours"
            type="number"
            min={1}
            defaultValue={defaults.expectedHours ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placement-location">Location</Label>
          <Input
            id="placement-location"
            name="location"
            defaultValue={defaults.location ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placement-city">City</Label>
          <Input id="placement-city" name="city" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="placement-state">State</Label>
          <Input id="placement-state" name="state" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="placement-objectives">
          Learning objectives (one per line)
        </Label>
        <Textarea
          id="placement-objectives"
          name="learningObjectives"
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="placement-supervision">Supervision arrangements</Label>
        <Textarea
          id="placement-supervision"
          name="supervisionArrangements"
          rows={2}
        />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="safeguardingCleared" className="size-4" />
          Safeguarding clearance confirmed
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="insuranceCleared" className="size-4" />
          Insurance confirmed
        </label>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create placement"}
      </Button>
    </form>
  );
}

export function PlacementManagerControls({
  placementId,
  status,
  supervisorId,
  supervisors,
  agreementStatus,
}: {
  placementId: string;
  status: (typeof PLACEMENT_STATUSES)[number];
  supervisorId: string | null;
  supervisors: PlacementSupervisorOption[];
  agreementStatus: "pending" | "accepted" | "declined";
}) {
  const { run, isPending, error, success } = useRun();
  const [nextStatus, setNextStatus] = useState(status);
  const [nextSupervisor, setNextSupervisor] = useState(supervisorId ?? "");

  return (
    <div className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="manage-status">Placement status</Label>
          <Select
            value={nextStatus}
            onValueChange={(value) =>
              setNextStatus(value as (typeof PLACEMENT_STATUSES)[number])
            }
          >
            <SelectTrigger id="manage-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACEMENT_STATUSES.filter(
                (option) => option !== "completed",
              ).map((option) => (
                <SelectItem key={option} value={option}>
                  {placementStatusLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="manage-supervisor">Supervisor</Label>
          <Select value={nextSupervisor} onValueChange={setNextSupervisor}>
            <SelectTrigger id="manage-supervisor" className="w-full">
              <SelectValue placeholder="Not assigned" />
            </SelectTrigger>
            <SelectContent>
              {supervisors.map((supervisor) => (
                <SelectItem key={supervisor.userId} value={supervisor.userId}>
                  {supervisor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {agreementStatus === "pending" && nextStatus === "active" ? (
        <p className="text-xs text-muted-foreground">
          The candidate still needs to accept the agreement before activation.
        </p>
      ) : null}
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          run(() =>
            updatePlacementAction({
              placementId,
              status: nextStatus,
              supervisorId: nextSupervisor,
            }),
          )
        }
      >
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}

export function CompletePlacementForm({
  placementId,
  disabledReason,
}: {
  placementId: string;
  disabledReason?: string | null;
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [summary, setSummary] = useState("");

  if (disabledReason) {
    return (
      <p className="text-sm text-muted-foreground">{disabledReason}</p>
    );
  }

  return (
    <div className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="space-y-1.5">
        <Label htmlFor="completion-summary">Completion summary</Label>
        <Textarea
          id="completion-summary"
          rows={3}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <FormFieldError messages={fieldErrors.completionSummary} />
      </div>
      <Button
        size="sm"
        disabled={isPending || summary.trim().length < 20}
        onClick={() =>
          run(() =>
            completePlacementAction({
              placementId,
              completionSummary: summary,
            }),
          )
        }
      >
        {isPending ? "Completing..." : "Mark placement complete"}
      </Button>
    </div>
  );
}

export function IssueCompletionForm({
  placementId,
  defaultHours,
}: {
  placementId: string;
  defaultHours: number;
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [outcome, setOutcome] = useState("completed");

  return (
    <div className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="completion-outcome">Outcome</Label>
          <Input
            id="completion-outcome"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="completion-hours">Hours completed</Label>
          <Input
            id="completion-hours"
            type="number"
            min={0}
            defaultValue={defaultHours}
            readOnly
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="completion-summary-note">Summary (optional)</Label>
          <Input id="completion-summary-note" />
        </div>
      </div>
      <FormFieldError messages={fieldErrors.outcome} />
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          run(() =>
            issueCompletionRecordAction({
              placementId,
              outcome,
              hoursCompleted: defaultHours,
            }),
          )
        }
      >
        {isPending ? "Issuing..." : "Issue completion record"}
      </Button>
    </div>
  );
}

export function PlacementProviderForm({
  organisationId,
  initial,
}: {
  organisationId: string;
  initial: {
    description: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    state: string;
    city: string;
    safeguardingLead: string;
    isAcceptingInterns: boolean;
  } | null;
}) {
  const { run, isPending, error, success } = useRun();
  const [accepting, setAccepting] = useState(
    initial?.isAcceptingInterns ?? false,
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() =>
      updatePlacementProviderAction({
        organisationId,
        description: String(formData.get("description") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
        contactPhone: String(formData.get("contactPhone") ?? ""),
        address: String(formData.get("address") ?? ""),
        state: String(formData.get("state") ?? ""),
        city: String(formData.get("city") ?? ""),
        safeguardingLead: String(formData.get("safeguardingLead") ?? ""),
        isAcceptingInterns: accepting,
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback error={error} success={success} />
      <div className="space-y-1.5">
        <Label htmlFor="provider-description">About your placements</Label>
        <Textarea
          id="provider-description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="provider-email">Contact email</Label>
          <Input
            id="provider-email"
            name="contactEmail"
            type="email"
            defaultValue={initial?.contactEmail ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-phone">Contact phone</Label>
          <Input
            id="provider-phone"
            name="contactPhone"
            defaultValue={initial?.contactPhone ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-address">Address</Label>
          <Input
            id="provider-address"
            name="address"
            defaultValue={initial?.address ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-safeguarding">Safeguarding lead</Label>
          <Input
            id="provider-safeguarding"
            name="safeguardingLead"
            defaultValue={initial?.safeguardingLead ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-city">City</Label>
          <Input
            id="provider-city"
            name="city"
            defaultValue={initial?.city ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-state">State</Label>
          <Input
            id="provider-state"
            name="state"
            defaultValue={initial?.state ?? ""}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={accepting}
          onChange={(event) => setAccepting(event.target.checked)}
        />
        Currently accepting interns
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save provider profile"}
      </Button>
    </form>
  );
}

export function IncidentUpdateButtons({
  incidentId,
  currentStatus,
}: {
  incidentId: string;
  currentStatus: "open" | "investigating" | "resolved" | "closed";
}) {
  const { run, isPending, error, success } = useRun();
  const [status, setStatus] = useState(currentStatus);
  const [resolution, setResolution] = useState("");

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`incident-status-${incidentId}`}>Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(
                value as "open" | "investigating" | "resolved" | "closed",
              )
            }
          >
            <SelectTrigger
              id={`incident-status-${incidentId}`}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`incident-resolution-${incidentId}`}>
            Resolution notes
          </Label>
          <Input
            id={`incident-resolution-${incidentId}`}
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
          />
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          run(() =>
            updateIncidentAction({
              incidentId,
              status,
              resolution,
            }),
          )
        }
      >
        {isPending ? "Saving..." : "Update incident"}
      </Button>
    </div>
  );
}

export function VerificationRequestButton({
  organisationId,
  status,
}: {
  organisationId: string;
  status: "unverified" | "pending" | "verified" | "rejected";
}) {
  const { run, isPending, error, success } = useRun();

  if (status === "verified") {
    return (
      <p className="text-sm text-brand-success">
        This organisation is verified and can publish opportunities.
      </p>
    );
  }

  if (status === "pending") {
    return (
      <p className="text-sm text-muted-foreground">
        Verification is under review. We will notify you when it is complete.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Feedback error={error} success={success} />
      <p className="text-sm text-muted-foreground">
        {status === "rejected"
          ? "Your previous verification was not approved. Update your details if needed, then request a new review."
          : "Request verification before publishing jobs, sending offers or creating placements."}
      </p>
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          run(() => requestOrganisationVerificationAction(organisationId))
        }
      >
        {isPending ? "Requesting..." : "Request verification"}
      </Button>
    </div>
  );
}
