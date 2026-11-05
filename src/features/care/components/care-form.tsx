"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

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
import type { CareActionResult } from "@/features/care/actions";

export type CareField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "date"
    | "datetime-local"
    | "number"
    | "textarea"
    | "select"
    | "checkbox";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: string;
  help?: string;
  full?: boolean;
};

type CareFormProps = {
  action: (input: Record<string, unknown>) => Promise<CareActionResult>;
  fields: CareField[];
  extra?: Record<string, unknown>;
  submitLabel: string;
  columns?: 1 | 2;
  resetOnSuccess?: boolean;
  successText?: string;
};

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function initialValues(fields: CareField[]): Record<string, string | boolean> {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.type === "checkbox"
        ? Boolean(field.defaultValue)
        : field.defaultValue === undefined
          ? ""
          : String(field.defaultValue),
    ]),
  );
}

export function CareForm({
  action,
  fields,
  extra,
  submitLabel,
  columns = 2,
  resetOnSuccess = true,
  successText,
}: CareFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    initialValues(fields),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function setValue(name: string, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function submit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const payload: Record<string, unknown> = { ...extra };
    for (const field of fields) {
      const value = values[field.name];
      if (field.type === "checkbox") {
        payload[field.name] = Boolean(value);
        continue;
      }
      const text = String(value ?? "").trim();
      if (field.type === "number") {
        payload[field.name] = text === "" ? undefined : Number(text);
        continue;
      }
      payload[field.name] = text;
    }

    startTransition(async () => {
      const result = await action(payload);
      if (result.ok) {
        setSuccess(result.message ?? successText ?? "Saved.");
        if (resetOnSuccess) setValues(initialValues(fields));
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
        router.refresh();
      } else {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      {success ? <FormAlert tone="success">{success}</FormAlert> : null}

      <div className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.full || field.type === "textarea" ? "sm:col-span-2" : undefined}
          >
            {field.type === "checkbox" ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border-input"
                  checked={Boolean(values[field.name])}
                  onChange={(event) => setValue(field.name, event.target.checked)}
                />
                <span>
                  <span className="font-medium text-brand-strong">{field.label}</span>
                  {field.help ? (
                    <span className="block text-xs text-muted-foreground">{field.help}</span>
                  ) : null}
                </span>
              </label>
            ) : (
              <>
                <Label htmlFor={`care-${field.name}`} className="mb-1.5 block">
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`care-${field.name}`}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={`care-${field.name}`}
                    className={inputClass}
                    value={String(values[field.name] ?? "")}
                    required={field.required}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  >
                    <option value="">Select…</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`care-${field.name}`}
                    type={field.type ?? "text"}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(event) => setValue(field.name, event.target.value)}
                  />
                )}
                {field.help ? (
                  <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                ) : null}
                {fieldErrors[field.name]?.length ? (
                  <FormFieldError messages={fieldErrors[field.name]} />
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

export function CareDialogForm({
  trigger,
  title,
  description,
  triggerVariant = "default",
  ...formProps
}: CareFormProps & {
  trigger: ReactNode;
  title: string;
  description?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <CareForm {...formProps} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CareActionButton({
  action,
  label,
  extra,
  confirm,
  variant = "outline",
  size = "sm",
  disabled,
}: {
  action: (input: Record<string, unknown>) => Promise<CareActionResult>;
  label: string;
  extra: Record<string, unknown>;
  confirm?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isPending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          setSuccess(null);
          startTransition(async () => {
            const result = await action(extra);
            if (result.ok) {
              setSuccess(result.message);
              if (result.redirectTo) router.push(result.redirectTo);
              router.refresh();
            } else {
              setError(result.message);
            }
          });
        }}
      >
        {isPending ? "Working…" : label}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      {success ? <span className="text-xs text-brand-teal">{success}</span> : null}
    </span>
  );
}
