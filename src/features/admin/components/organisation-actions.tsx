"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckIcon,
  XIcon,
  PauseIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteOrganisationAction,
  setOrganisationStatusAction,
  setOrganisationVerificationAction,
} from "@/features/admin/actions";

type OrganisationActionsProps = {
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
  status: "pending" | "active" | "suspended" | "disabled";
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
};

function ReasonField({
  id,
  reason,
  onChange,
}: {
  id: string;
  reason: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Reason or notes (optional)</Label>
      <Textarea
        id={id}
        value={reason}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add context for the audit record"
        rows={3}
      />
    </div>
  );
}

export function OrganisationActions({
  organisationId,
  organisationName,
  organisationSlug,
  status,
  verificationStatus,
}: OrganisationActionsProps) {
  const router = useRouter();
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const run = (
    fn: () => Promise<{ ok: boolean; message: string }>,
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const approve = () =>
    run(() =>
      setOrganisationStatusAction({
        organisationId,
        status: "active",
        reason,
      }),
    );

  const verify = () =>
    run(() =>
      setOrganisationVerificationAction({
        organisationId,
        verificationStatus: "verified",
        notes: reason,
      }),
    );

  const rejectVerification = () =>
    run(() =>
      setOrganisationVerificationAction({
        organisationId,
        verificationStatus: "rejected",
        notes: reason,
      }),
    );

  const suspend = () =>
    run(() =>
      setOrganisationStatusAction({
        organisationId,
        status: "suspended",
        reason,
      }),
    );

  const reactivate = () =>
    run(() =>
      setOrganisationStatusAction({
        organisationId,
        status: "active",
        reason,
      }),
    );

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <ActionDialog
        triggerLabel={status === "pending" ? "Approve" : "Re-activate"}
        title={
          status === "pending"
            ? `Approve ${organisationName}?`
            : `Reactivate ${organisationName}?`
        }
        description={
          status === "pending"
            ? "The organisation will become active and able to use the platform."
            : "The organisation will regain active status."
        }
        onConfirm={status === "pending" ? approve : reactivate}
        reason={reason}
        setReason={setReason}
        pending={pending}
        variant="default"
        icon={<CheckIcon aria-hidden="true" />}
      />

      {verificationStatus !== "verified" ? (
        <ActionDialog
          triggerLabel="Verify"
          title={`Mark ${organisationName} as verified?`}
          description="This records a verification review decision against the organisation."
          onConfirm={verify}
          reason={reason}
          setReason={setReason}
          pending={pending}
          variant="outline"
          icon={<CheckIcon aria-hidden="true" />}
        />
      ) : (
        <ActionDialog
          triggerLabel="Reject verification"
          title={`Reject verification for ${organisationName}?`}
          description="The organisation's verification will be recorded as rejected. This does not disable the organisation."
          onConfirm={rejectVerification}
          reason={reason}
          setReason={setReason}
          pending={pending}
          variant="outline"
          icon={<XIcon aria-hidden="true" />}
        />
      )}

      {status === "active" ? (
        <ActionDialog
          triggerLabel="Suspend"
          title={`Suspend ${organisationName}?`}
          description="The organisation will be suspended and lose access. This is recorded in the audit log."
          onConfirm={suspend}
          reason={reason}
          setReason={setReason}
          pending={pending}
          variant="destructive"
          icon={<PauseIcon aria-hidden="true" />}
        />
      ) : status !== "pending" ? (
        <ActionDialog
          triggerLabel="Reactivate"
          title={`Reactivate ${organisationName}?`}
          description="The organisation will be restored to active status."
          onConfirm={reactivate}
          reason={reason}
          setReason={setReason}
          pending={pending}
          variant="outline"
          icon={<RotateCcwIcon aria-hidden="true" />}
        />
      ) : null}

      <DeleteOrganisationDialog
        organisationId={organisationId}
        organisationName={organisationName}
        organisationSlug={organisationSlug}
        disabled={pending}
      />
    </div>
  );
}

function DeleteOrganisationDialog({
  organisationId,
  organisationName,
  organisationSlug,
  disabled,
}: {
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const matches =
    confirmation.trim().toLowerCase() === organisationSlug.toLowerCase();
  const fieldId = `delete-confirm-${organisationId}`;

  const submit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await deleteOrganisationAction({
        organisationId,
        confirmation,
        reason,
      });

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setConfirmation("");
        setReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) {
          setConfirmation("");
          setReason("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Trash2Icon aria-hidden="true" className="text-brand-error" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {organisationName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the organisation and everything inside it:
            memberships, courses, enrolments, care records, invoices, donations
            and reports. It cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            Type{" "}
            <span className="font-mono font-semibold">{organisationSlug}</span>{" "}
            to confirm
          </Label>
          <Input
            id={fieldId}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={organisationSlug}
          />
        </div>

        <ReasonField
          id={`delete-reason-${organisationId}`}
          reason={reason}
          onChange={setReason}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={submit}
            disabled={pending || !matches}
            className="bg-brand-error text-white hover:bg-brand-error/90"
          >
            {pending ? "Deleting…" : "Delete organisation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActionDialog({
  triggerLabel,
  title,
  description,
  onConfirm,
  reason,
  setReason,
  pending,
  variant,
  icon,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  onConfirm: () => void;
  reason: string;
  setReason: (value: string) => void;
  pending: boolean;
  variant: "default" | "outline" | "destructive";
  icon: React.ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" disabled={pending}>
          {icon}
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <ReasonField id="org-reason" reason={reason} onChange={setReason} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={pending}
          >
            {pending ? "Working…" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
