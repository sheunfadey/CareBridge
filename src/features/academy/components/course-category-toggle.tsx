"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setCourseCategoryActiveAction } from "@/features/academy/actions";

export function CourseCategoryToggle({
  categoryId,
  active,
}: {
  categoryId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await setCourseCategoryActiveAction(
        categoryId,
        !active,
      );
      if (result.ok) {
        toast.success(result.message ?? "Category updated.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? <Loader2Icon className="animate-spin" /> : null}
      {active ? "Archive" : "Activate"}
    </Button>
  );
}
