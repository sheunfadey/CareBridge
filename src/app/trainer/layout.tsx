import type { Metadata } from "next";
import { Suspense } from "react";

import { PageLoadingSkeleton } from "@/components/feedback/page-loading-skeleton";
import { TrainerChrome } from "@/components/layout/trainer-chrome";

export const metadata: Metadata = {
  title: {
    default: "Trainer workspace",
    template: "%s · Trainer workspace",
  },
};

function TrainerChromeFallback() {
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 border-b border-border bg-background/85" />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-3 py-2.5 pb-24 sm:px-4 sm:py-3.5 md:px-5 lg:px-6 lg:py-4 lg:pb-7">
          <PageLoadingSkeleton cards={4} rows={4} />
        </main>
      </div>
    </div>
  );
}

export default function TrainerLayout({
  children,
}: LayoutProps<"/trainer">) {
  return (
    <Suspense fallback={<TrainerChromeFallback />}>
      <TrainerChrome>{children}</TrainerChrome>
    </Suspense>
  );
}
