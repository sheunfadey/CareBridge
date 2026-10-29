"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <ErrorState
        title="This page could not be loaded"
        description="An unexpected error occurred. Try again, or contact support if the problem continues."
        action={<Button onClick={reset}>Try again</Button>}
        className="w-full max-w-lg"
      />
    </div>
  );
}
