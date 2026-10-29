"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, XIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  setOrganisationStatusAction,
  setOrganisationVerificationAction,
} from "@/features/admin/actions";

type OrganisationActionsProps = {
  organisationId: string;
  organisationName: string;
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
    </div>
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
