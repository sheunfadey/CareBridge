"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { addModuleAction } from "@/features/academy/actions";
import {
  createModuleSchema,
  type CreateModuleInput,
} from "@/lib/validation/academy";

export function AddModuleDialog({
  courseId,
  children,
}: {
  courseId: string;
  children: ReactNode;
}) {
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
  } = useForm<CreateModuleInput>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      courseId,
      title: "",
      summary: "",
      isRequired: true,
    },
  } as never);

  const isRequired = useWatch({ control, name: "isRequired" });

  const onSubmit = (values: CreateModuleInput) => {
    setError(null);
    startTransition(async () => {
      const result = await addModuleAction({
        ...values,
        courseId,
        summary: values.summary || undefined,
      });
      if (result.ok) {
        reset({ courseId, title: "", summary: "", isRequired: true });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add module</DialogTitle>
          <DialogDescription>
            Modules group lessons in the order learners see them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}
          <div className="space-y-2">
            <Label htmlFor="module-title">Module title</Label>
            <Input
              id="module-title"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <FormFieldError
              messages={
                errors.title?.message ? [errors.title.message] : undefined
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-summary">Summary (optional)</Label>
            <Textarea id="module-summary" rows={3} {...register("summary")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isRequired}
              onCheckedChange={(checked) =>
                setValue("isRequired", checked === true)
              }
            />
            Required for completion
          </label>
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
              {isPending ? "Adding..." : "Add module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
