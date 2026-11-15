"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createJobPostingAction } from "@/features/employment/actions";
import {
  EMPLOYMENT_TYPES,
  employmentTypeLabels,
} from "@/lib/validation/employment";
import type { EmploymentOrganisationOption } from "@/server/employment/queries";
import type { EmploymentType } from "@/types/database";

type CreateJobFormProps = {
  organisations: EmploymentOrganisationOption[];
};

function toMinorUnits(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return Math.round(amount * 100);
}

export function CreateJobForm({ organisations }: CreateJobFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [organisationId, setOrganisationId] = useState(
    organisations[0]?.id ?? "",
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    "full_time",
  );
  const [isSalaryDisclosed, setIsSalaryDisclosed] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createJobPostingAction({
        organisationId,
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        description: String(formData.get("description") ?? ""),
        duties: String(formData.get("duties") ?? ""),
        employmentType,
        workLocation: String(formData.get("workLocation") ?? ""),
        state: String(formData.get("state") ?? ""),
        city: String(formData.get("city") ?? ""),
        shiftRequirements: String(formData.get("shiftRequirements") ?? ""),
        experienceRequirements: String(
          formData.get("experienceRequirements") ?? "",
        ),
        qualifications: String(formData.get("qualifications") ?? ""),
        skills: String(formData.get("skills") ?? ""),
        salaryMinMinorUnits: toMinorUnits(formData.get("salaryMin")),
        salaryMaxMinorUnits: toMinorUnits(formData.get("salaryMax")),
        isSalaryDisclosed,
        safeguardingRequirements: String(
          formData.get("safeguardingRequirements") ?? "",
        ),
        applicationDeadline: String(formData.get("applicationDeadline") ?? ""),
      });

      if (result.ok) {
        router.push(result.redirectTo ?? "/dashboard/jobs/manage");
        router.refresh();
      } else {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  if (organisations.length === 0) {
    return (
      <FormAlert tone="error">
        You need an organisation with recruitment access to post jobs.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="job-organisation">Hiring organisation</Label>
          <Select value={organisationId} onValueChange={setOrganisationId}>
            <SelectTrigger id="job-organisation" className="w-full">
              <SelectValue placeholder="Select an organisation" />
            </SelectTrigger>
            <SelectContent>
              {organisations.map((organisation) => (
                <SelectItem key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError messages={fieldErrors.organisationId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-type">Employment type</Label>
          <Select
            value={employmentType}
            onValueChange={(value) =>
              setEmploymentType(value as EmploymentType)
            }
          >
            <SelectTrigger id="job-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {employmentTypeLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-title">Job title</Label>
        <Input id="job-title" name="title" required />
        <FormFieldError messages={fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-summary">Short summary</Label>
        <Textarea id="job-summary" name="summary" rows={3} required />
        <FormFieldError messages={fieldErrors.summary} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-description">Full description</Label>
        <Textarea id="job-description" name="description" rows={7} required />
        <FormFieldError messages={fieldErrors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="job-state">State</Label>
          <Input id="job-state" name="state" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-city">City</Label>
          <Input id="job-city" name="city" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-location">Work location</Label>
          <Input id="job-location" name="workLocation" placeholder="On-site" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="job-duties">Key duties (one per line)</Label>
          <Textarea id="job-duties" name="duties" rows={5} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-qualifications">
            Qualifications (one per line)
          </Label>
          <Textarea id="job-qualifications" name="qualifications" rows={5} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-skills">Skills (one per line)</Label>
        <Textarea id="job-skills" name="skills" rows={4} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="job-experience">Experience requirements</Label>
          <Textarea id="job-experience" name="experienceRequirements" rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-shifts">Shift requirements</Label>
          <Textarea id="job-shifts" name="shiftRequirements" rows={3} />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <p className="text-sm font-medium">Compensation</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-salary-min">Minimum monthly salary (NGN)</Label>
            <Input id="job-salary-min" name="salaryMin" type="number" min={0} />
            <FormFieldError messages={fieldErrors.salaryMinMinorUnits} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-salary-max">Maximum monthly salary (NGN)</Label>
            <Input id="job-salary-max" name="salaryMax" type="number" min={0} />
            <FormFieldError messages={fieldErrors.salaryMaxMinorUnits} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={isSalaryDisclosed}
            onCheckedChange={(checked) => setIsSalaryDisclosed(checked === true)}
          />
          Show the salary range publicly
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-safeguarding">Safeguarding requirements</Label>
        <Textarea id="job-safeguarding" name="safeguardingRequirements" rows={3} />
      </div>

      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor="job-deadline">Application deadline</Label>
        <Input id="job-deadline" name="applicationDeadline" type="date" />
        <FormFieldError messages={fieldErrors.applicationDeadline} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save draft job"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/jobs/manage">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
