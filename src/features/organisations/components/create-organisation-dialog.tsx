"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import { createOrganisationAction } from "@/features/organisations/actions";
import {
  ORGANISATION_TYPES,
  createOrganisationSchema,
  organisationTypeLabels,
  type CreateOrganisationInput,
} from "@/lib/validation/organisation";

export function CreateOrganisationDialog({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateOrganisationInput>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: {
      name: "",
      type: "care_home",
      contactEmail: "",
      state: "",
      city: "",
    },
  });

  const type = useWatch({ control, name: "type" });

  const onSubmit = (values: CreateOrganisationInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrganisationAction(values);
      if (result.ok) {
        setOpen(false);
        reset();
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.refresh();
        }
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New organisation</DialogTitle>
          <DialogDescription>
            Create a workspace. You become its owner and can invite teammates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}

          <div className="space-y-2">
            <Label htmlFor="org-name">Organisation name</Label>
            <Input
              id="org-name"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            <FormFieldError
              messages={errors.name?.message ? [errors.name.message] : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue("type", value as CreateOrganisationInput["type"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="org-type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {ORGANISATION_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {organisationTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError
              messages={errors.type?.message ? [errors.type.message] : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-email">Contact email (optional)</Label>
            <Input
              id="org-email"
              type="email"
              aria-invalid={Boolean(errors.contactEmail)}
              {...register("contactEmail")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-state">State (optional)</Label>
              <Input id="org-state" {...register("state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-city">City (optional)</Label>
              <Input id="org-city" {...register("city")} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create organisation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
