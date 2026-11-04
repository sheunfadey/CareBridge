"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SendIcon, Undo2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setAssessmentPublicationAction } from "@/features/academy/actions";

export function AssessmentPublishButton({
  assessmentId,
  published,
}: {
  assessmentId: string;
  published: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await setAssessmentPublicationAction(
        assessmentId,
        !published,
      );
      if (result.ok) {
        toast.success(result.message ?? "Assessment updated.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button
      variant={published ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" />
      ) : published ? (
        <Undo2Icon />
      ) : (
        <SendIcon />
      )}
      {published ? "Return to draft" : "Publish assessment"}
    </Button>
  );
}
