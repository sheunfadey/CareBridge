"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserXIcon, UserCheckIcon } from "lucide-react";

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
import { setAccountStatusAction } from "@/features/admin/actions";

type AccountActionsProps = {
  userId: string;
  userName: string;
  status: "active" | "deactivated";
  isSelf: boolean;
};

export function AccountActions({
  userId,
  userName,
  status,
  isSelf,
}: AccountActionsProps) {
  const router = useRouter();
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const deactivating = status === "active";

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground">Current account</span>
    );
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await setAccountStatusAction({
        userId,
        status: deactivating ? "deactivated" : "active",
        reason,
      });

      if (result.ok) {
        toast.success(result.message);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={deactivating ? "destructive" : "outline"}
          size="sm"
          disabled={pending}
        >
          {deactivating ? (
            <>
              <UserXIcon aria-hidden="true" />
              Deactivate
            </>
          ) : (
            <>
              <UserCheckIcon aria-hidden="true" />
              Reactivate
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deactivating
              ? `Deactivate ${userName}?`
              : `Reactivate ${userName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivating
              ? "The account will lose access to the platform. This is recorded in the audit log and a notification is sent to the account holder."
              : "The account will regain access to the platform. This is recorded in the audit log."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deactivating ? (
          <div className="space-y-2">
            <Label htmlFor={`reason-${userId}`}>Reason (optional)</Label>
            <Textarea
              id={`reason-${userId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Add context for the audit record"
              rows={3}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={pending}
          >
            {pending ? "Working…" : deactivating ? "Deactivate" : "Reactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
