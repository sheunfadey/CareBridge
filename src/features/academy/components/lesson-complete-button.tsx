"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { completeLessonAction } from "@/features/academy/actions";
import { toast } from "sonner";

type LessonCompleteButtonProps = {
  lessonId: string;
  completed: boolean;
};

export function LessonCompleteButton({
  lessonId,
  completed,
}: LessonCompleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(completed);

  if (done) {
    return (
      <Button variant="outline" size="sm" disabled>
        <CheckCircle2Icon />
        Completed
      </Button>
    );
  }

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeLessonAction(lessonId);
      if (result.ok) {
        setDone(true);
        toast.success(
          result.courseCompleted
            ? "Course completed. Certificate issued if enabled."
            : "Lesson completed.",
        );
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button size="sm" onClick={handleComplete} disabled={isPending}>
      {isPending ? <Loader2Icon className="animate-spin" /> : null}
      Mark complete
    </Button>
  );
}
