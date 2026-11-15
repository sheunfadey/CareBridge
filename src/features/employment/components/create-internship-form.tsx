"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
import { createInternshipListingAction } from "@/features/employment/actions";
import type { EmploymentOrganisationOption } from "@/server/employment/queries";

type CreateInternshipFormProps = {
  organisations: EmploymentOrganisationOption[];
};

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function CreateInternshipForm({
  organisations,
}: CreateInternshipFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [organisationId, setOrganisationId] = useState(
    organisations[0]?.id ?? "",
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createInternshipListingAction({
        organisationId,
        title: String(formData.get("title") ?? ""),
        summary: String(formData.get("summary") ?? ""),
        description: String(formData.get("description") ?? ""),
        state: String(formData.get("state") ?? ""),
        city: String(formData.get("city") ?? ""),
        location: String(formData.get("location") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
        expectedHours: optionalNumber(formData.get("expectedHours")),
        slots: optionalNumber(formData.get("slots")) ?? 1,
        requirements: String(formData.get("requirements") ?? ""),
        learningObjectives: String(formData.get("learningObjectives") ?? ""),
        applicationDeadline: String(formData.get("applicationDeadline") ?? ""),
      });

      if (result.ok) {
        router.push(result.redirectTo ?? "/dashboard/internships/manage");
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
        You need an organisation with internship access to publish placements.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}

      <div className="space-y-2">
        <Label htmlFor="internship-organisation">Host organisation</Label>
        <Select value={organisationId} onValueChange={setOrganisationId}>
          <SelectTrigger id="internship-organisation" className="w-full">
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
        <Label htmlFor="internship-title">Placement title</Label>
        <Input id="internship-title" name="title" required />
        <FormFieldError messages={fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internship-summary">Short summary</Label>
        <Textarea id="internship-summary" name="summary" rows={3} required />
        <FormFieldError messages={fieldErrors.summary} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internship-description">Full description</Label>
        <Textarea
          id="internship-description"
          name="description"
          rows={6}
          required
        />
        <FormFieldError messages={fieldErrors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="internship-state">State</Label>
          <Input id="internship-state" name="state" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internship-city">City</Label>
          <Input id="internship-city" name="city" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internship-location">Location details</Label>
          <Input id="internship-location" name="location" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="internship-start">Start date</Label>
          <Input id="internship-start" name="startDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internship-end">End date</Label>
          <Input id="internship-end" name="endDate" type="date" />
          <FormFieldError messages={fieldErrors.endDate} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="internship-hours">Expected hours / week</Label>
          <Input
            id="internship-hours"
            name="expectedHours"
            type="number"
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internship-slots">Available slots</Label>
          <Input
            id="internship-slots"
            name="slots"
            type="number"
            min={1}
            defaultValue={1}
            required
          />
          <FormFieldError messages={fieldErrors.slots} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internship-deadline">Application deadline</Label>
          <Input
            id="internship-deadline"
            name="applicationDeadline"
            type="date"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="internship-requirements">
            Requirements (one per line)
          </Label>
          <Textarea id="internship-requirements" name="requirements" rows={5} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="internship-objectives">
            Learning objectives (one per line)
          </Label>
          <Textarea
            id="internship-objectives"
            name="learningObjectives"
            rows={5}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save draft placement"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/internships/manage">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
