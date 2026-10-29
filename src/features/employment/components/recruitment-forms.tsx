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
  respondToOfferAction,
  scheduleInterviewAction,
  sendInternshipOfferAction,
  sendJobOfferAction,
  updateInterviewAction,
  withdrawOfferAction,
} from "@/features/employment/placement-actions";
import {
  INTERVIEW_MODES,
  INTERVIEW_STATUSES,
  interviewModeLabels,
  interviewStatusLabels,
} from "@/lib/validation/placement";
import { EMPLOYMENT_TYPES, employmentTypeLabels } from "@/lib/validation/employment";

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
  }>) => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setSuccess(result.message ?? "Saved.");
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

export function ScheduleInterviewForm({
  applicationId,
  applicationType,
}: {
  applicationId: string;
  applicationType: "job" | "internship";
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [mode, setMode] = useState<(typeof INTERVIEW_MODES)[number]>("in_person");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    run(async () => {
      const result = await scheduleInterviewAction({
        applicationId,
        applicationType,
        scheduledAt: String(formData.get("scheduledAt") ?? ""),
        durationMinutes: Number(formData.get("durationMinutes") ?? 30),
        mode,
        location: String(formData.get("location") ?? ""),
        meetingLink: String(formData.get("meetingLink") ?? ""),
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
          <Label htmlFor="interview-when">Date and time</Label>
          <Input
            id="interview-when"
            name="scheduledAt"
            type="datetime-local"
            required
          />
          <FormFieldError messages={fieldErrors.scheduledAt} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="interview-duration">Duration (minutes)</Label>
          <Input
            id="interview-duration"
            name="durationMinutes"
            type="number"
            min={10}
            max={480}
            defaultValue={30}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="interview-mode">Format</Label>
          <Select
            value={mode}
            onValueChange={(value) =>
              setMode(value as (typeof INTERVIEW_MODES)[number])
            }
          >
            <SelectTrigger id="interview-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_MODES.map((option) => (
                <SelectItem key={option} value={option}>
                  {interviewModeLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="interview-location">Location</Label>
          <Input
            id="interview-location"
            name="location"
            placeholder={
              mode === "in_person" ? "Address or room" : "Optional"
            }
          />
          <FormFieldError messages={fieldErrors.location} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="interview-link">Meeting link</Label>
          <Input
            id="interview-link"
            name="meetingLink"
            placeholder="https://"
          />
          <FormFieldError messages={fieldErrors.meetingLink} />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Scheduling..." : "Schedule interview"}
      </Button>
    </form>
  );
}

export function InterviewOutcomeForm({
  interviewId,
  currentStatus,
}: {
  interviewId: string;
  currentStatus: (typeof INTERVIEW_STATUSES)[number];
}) {
  const { run, isPending, error, success } = useRun();
  const [status, setStatus] = useState(currentStatus);
  const [rating, setRating] = useState("");

  return (
    <div className="space-y-2 border-t pt-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`interview-status-${interviewId}`}>Outcome</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as (typeof INTERVIEW_STATUSES)[number])
            }
          >
            <SelectTrigger
              id={`interview-status-${interviewId}`}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {interviewStatusLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`interview-rating-${interviewId}`}>Rating</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger
              id={`interview-rating-${interviewId}`}
              className="w-full"
            >
              <SelectValue placeholder="Not rated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 / 5</SelectItem>
              <SelectItem value="2">2 / 5</SelectItem>
              <SelectItem value="3">3 / 5</SelectItem>
              <SelectItem value="4">4 / 5</SelectItem>
              <SelectItem value="5">5 / 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor={`interview-feedback-${interviewId}`}>Notes</Label>
          <Input id={`interview-feedback-${interviewId}`} name="feedback" />
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          const feedback = (
            document.getElementById(
              `interview-feedback-${interviewId}`,
            ) as HTMLInputElement | null
          )?.value;
          run(() =>
            updateInterviewAction({
              interviewId,
              status,
              feedback,
              rating: rating === "" ? "" : Number(rating),
            }),
          );
        }}
      >
        {isPending ? "Saving..." : "Save interview outcome"}
      </Button>
    </div>
  );
}

export function JobOfferForm({
  applicationId,
  defaultEmploymentType,
}: {
  applicationId: string;
  defaultEmploymentType: (typeof EMPLOYMENT_TYPES)[number];
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [employmentType, setEmploymentType] = useState(defaultEmploymentType);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const salaryRaw = String(formData.get("salary") ?? "").trim();
    run(() =>
      sendJobOfferAction({
        applicationId,
        employmentType,
        salaryMinorUnits: salaryRaw ? Math.round(Number(salaryRaw) * 100) : undefined,
        salaryCurrency: "NGN",
        startDate: String(formData.get("startDate") ?? ""),
        expiresAt: String(formData.get("expiresAt") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="offer-employment-type">Employment type</Label>
          <Select
            value={employmentType}
            onValueChange={(value) =>
              setEmploymentType(value as (typeof EMPLOYMENT_TYPES)[number])
            }
          >
            <SelectTrigger id="offer-employment-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {employmentTypeLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offer-salary">Annual salary (₦, optional)</Label>
          <Input
            id="offer-salary"
            name="salary"
            type="number"
            min={0}
            step={1000}
          />
          <FormFieldError messages={fieldErrors.salaryMinorUnits} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offer-start">Start date</Label>
          <Input id="offer-start" name="startDate" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offer-expires">Respond by</Label>
          <Input id="offer-expires" name="expiresAt" type="datetime-local" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="offer-notes">Notes for the candidate</Label>
        <Textarea id="offer-notes" name="notes" rows={3} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Sending..." : "Send job offer"}
      </Button>
    </form>
  );
}

export function InternshipOfferForm({
  applicationId,
  defaults,
}: {
  applicationId: string;
  defaults: {
    startDate: string | null;
    endDate: string | null;
    expectedHours: number | null;
    location: string | null;
  };
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() =>
      sendInternshipOfferAction({
        applicationId,
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        expectedHours: formData.get("expectedHours")
          ? Number(formData.get("expectedHours"))
          : undefined,
        location: String(formData.get("location") ?? ""),
        expiresAt: String(formData.get("expiresAt") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Feedback error={error} success={success} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="internship-offer-start">Start date</Label>
          <Input
            id="internship-offer-start"
            name="startDate"
            type="date"
            defaultValue={defaults.startDate ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="internship-offer-end">End date</Label>
          <Input
            id="internship-offer-end"
            name="endDate"
            type="date"
            defaultValue={defaults.endDate ?? ""}
          />
          <FormFieldError messages={fieldErrors.endDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="internship-offer-hours">Expected hours / week</Label>
          <Input
            id="internship-offer-hours"
            name="expectedHours"
            type="number"
            min={1}
            defaultValue={defaults.expectedHours ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="internship-offer-location">Location</Label>
          <Input
            id="internship-offer-location"
            name="location"
            defaultValue={defaults.location ?? ""}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="internship-offer-expires">Respond by</Label>
          <Input
            id="internship-offer-expires"
            name="expiresAt"
            type="datetime-local"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="internship-offer-notes">Notes for the candidate</Label>
        <Textarea id="internship-offer-notes" name="notes" rows={3} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Sending..." : "Send placement offer"}
      </Button>
    </form>
  );
}

export function OfferResponseButtons({
  offerId,
  offerType,
}: {
  offerId: string;
  offerType: "job" | "internship";
}) {
  const { run, isPending, error, success } = useRun();

  return (
    <div className="mt-3 space-y-2">
      <Feedback error={error} success={success} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() =>
              respondToOfferAction({
                offerId,
                offerType,
                response: "accepted",
              }),
            )
          }
        >
          Accept offer
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() =>
              respondToOfferAction({
                offerId,
                offerType,
                response: "declined",
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

export function WithdrawOfferButton({
  offerId,
  offerType,
}: {
  offerId: string;
  offerType: "job" | "internship";
}) {
  const { run, isPending, error } = useRun();

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => run(() => withdrawOfferAction({ offerId, offerType }))}
      >
        {isPending ? "Withdrawing..." : "Withdraw offer"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
