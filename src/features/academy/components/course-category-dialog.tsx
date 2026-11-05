"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import { createCourseCategoryAction } from "@/features/academy/actions";
import {
  createCourseCategorySchema,
  type CreateCourseCategoryInput,
} from "@/lib/validation/academy";
import type { OrganisationOption } from "@/server/academy/queries";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CourseCategoryDialog({
  organisations,
  isSuperAdmin,
  children,
}: {
  organisations: OrganisationOption[];
  isSuperAdmin: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const firstScope = organisations[0]?.id ?? (isSuperAdmin ? "" : "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourseCategoryInput>({
    resolver: zodResolver(createCourseCategorySchema),
    defaultValues: {
      organisationId: firstScope,
      name: "",
      description: "",
      sortOrder: 100,
    },
  } as never);

  const onSubmit = (values: CreateCourseCategoryInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createCourseCategoryAction({
        ...values,
        organisationId: values.organisationId || undefined,
        description: values.description || undefined,
      });
      if (result.ok) {
        reset({
          organisationId: firstScope,
          name: "",
          description: "",
          sortOrder: 100,
        });
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New course category</DialogTitle>
          <DialogDescription>
            Categories group courses in the catalogue. Organisation categories
            are visible to your team; platform categories are managed by the
            platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}

          <div className="space-y-2">
            <Label htmlFor="category-scope">Scope</Label>
            <select
              id="category-scope"
              className={selectClass}
              {...register("organisationId")}
            >
              {isSuperAdmin ? (
                <option value="">Platform category</option>
              ) : null}
              {organisations.map((organisation) => (
                <option key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            <FormFieldError
              messages={
                errors.name?.message ? [errors.name.message] : undefined
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description (optional)</Label>
            <Textarea
              id="category-description"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-order">Sort order</Label>
            <Input
              id="category-order"
              type="number"
              min={0}
              max={999}
              {...register("sortOrder")}
            />
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
              {isPending ? "Creating..." : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
