"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";
import { LogoMark } from "@/components/brand/logo-mark";

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
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <LogoMark size={40} />
          <ErrorState
            title="CareBridge could not start"
            description="An unexpected error occurred while loading the application. Try again, or contact support if the problem continues."
            action={<Button onClick={reset}>Try again</Button>}
          />
        </div>
      </body>
    </html>
  );
}
