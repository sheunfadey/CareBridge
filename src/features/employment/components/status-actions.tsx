"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateInternshipApplicationStatusAction,
  updateInternshipStatusAction,
  updateJobApplicationStatusAction,
  updateJobStatusAction,
  withdrawInternshipApplicationAction,
  withdrawJobApplicationAction,
} from "@/features/employment/actions";
import {
  APPLICATION_STATUSES,
  applicationStatusLabels,
  INTERNSHIP_APPLICATION_STATUSES,
  internshipApplicationStatusLabels,
  INTERNSHIP_LISTING_STATUSES,
  internshipListingStatusLabels,
  JOB_STATUSES,
  jobStatusLabels,
} from "@/lib/validation/employment";
import type {
  ApplicationStatus,
  InternshipApplicationStatus,
  InternshipListingStatus,
  JobStatus,
} from "@/types/database";

function useStatusUpdate<T extends string>(
  action: (value: T) => Promise<{ ok: boolean; message?: string }>,
  onDone?: () => void,
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (value: T) => {
    setError(null);
    startTransition(async () => {
      const result = await action(value);
      if (result.ok) {
        onDone?.();
        router.refresh();
      } else {
        setError(result.message ?? "Could not update. Try again.");
      }
    });
  };

  return { run, isPending, error };
}

export function JobStatusSelect({
  jobId,
  current,
}: {
  jobId: string;
  current: JobStatus;
}) {
  const { run, isPending, error } = useStatusUpdate<JobStatus>(
    (value) => updateJobStatusAction({ jobId, status: value }),
  );

  return (
    <div className="space-y-1">
      <Select value={current} onValueChange={run} disabled={isPending}>
        <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Job status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {JOB_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {jobStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function InternshipStatusSelect({
  listingId,
  current,
}: {
  listingId: string;
  current: InternshipListingStatus;
}) {
  const { run, isPending, error } = useStatusUpdate<InternshipListingStatus>(
    (value) => updateInternshipStatusAction({ listingId, status: value }),
  );

  return (
    <div className="space-y-1">
      <Select value={current} onValueChange={run} disabled={isPending}>
        <SelectTrigger
          className="h-8 w-[150px] text-xs"
          aria-label="Placement status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INTERNSHIP_LISTING_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {internshipListingStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function JobApplicationStatusSelect({
  applicationId,
  current,
}: {
  applicationId: string;
  current: ApplicationStatus;
}) {
  const { run, isPending, error } = useStatusUpdate<ApplicationStatus>(
    (value) =>
      updateJobApplicationStatusAction({ applicationId, status: value }),
  );

  return (
    <div className="space-y-1">
      <Select value={current} onValueChange={run} disabled={isPending}>
        <SelectTrigger
          className="h-8 w-[150px] text-xs"
          aria-label="Application status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPLICATION_STATUSES.filter((status) => status !== "withdrawn").map(
            (status) => (
              <SelectItem key={status} value={status}>
                {applicationStatusLabels[status]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function InternshipApplicationStatusSelect({
  applicationId,
  current,
}: {
  applicationId: string;
  current: InternshipApplicationStatus;
}) {
  const { run, isPending, error } = useStatusUpdate<InternshipApplicationStatus>(
    (value) =>
      updateInternshipApplicationStatusAction({ applicationId, status: value }),
  );

  return (
    <div className="space-y-1">
      <Select value={current} onValueChange={run} disabled={isPending}>
        <SelectTrigger
          className="h-8 w-[150px] text-xs"
          aria-label="Application status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INTERNSHIP_APPLICATION_STATUSES.filter(
            (status) => status !== "withdrawn",
          ).map((status) => (
            <SelectItem key={status} value={status}>
              {internshipApplicationStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function WithdrawApplicationButton({
  kind,
  applicationId,
}: {
  kind: "job" | "internship";
  applicationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "job"
          ? await withdrawJobApplicationAction(applicationId)
          : await withdrawInternshipApplicationAction(applicationId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={isPending}
      >
        {isPending ? "Withdrawing..." : "Withdraw"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
