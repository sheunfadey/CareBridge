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
import { inviteMemberAction } from "@/features/organisations/actions";
import { ROLE_LABELS, PRIVILEGED_ROLES } from "@/lib/permissions/registry";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validation/organisation";
import type { RoleKey } from "@/types/database";

const INVITABLE_ROLES = (Object.keys(ROLE_LABELS) as RoleKey[]).filter(
  (role) => !PRIVILEGED_ROLES.includes(role),
);

export function InviteMemberDialog({
  organisationId,
  children,
}: {
  organisationId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { ok: true; message?: string } | { ok: false; message: string; fieldErrors?: Record<string, string[]> } | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      organisationId,
      email: "",
      roleKey: "care_staff",
    },
  });

  const roleKey = useWatch({ control, name: "roleKey" });

  const onSubmit = (values: InviteMemberInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await inviteMemberAction(values);
      setResult(outcome);
      if (outcome.ok) {
        reset({ organisationId, email: "", roleKey: "care_staff" });
        setOpen(false);
        router.refresh();
      }
    });
  };

  const serverFieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They receive an invitation to join this organisation with the role you
            choose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {result && !result.ok ? (
            <FormAlert tone="error">{result.message}</FormAlert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FormFieldError
              messages={
                errors.email?.message
                  ? [errors.email.message]
                  : serverFieldErrors?.email
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={roleKey}
              onValueChange={(value) =>
                setValue("roleKey", value as RoleKey, { shouldValidate: true })
              }
            >
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isPending ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
