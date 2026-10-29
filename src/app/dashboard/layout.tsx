import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { PageLoadingSkeleton } from "@/components/feedback/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Dashboard",
};

function DashboardChromeFallback() {
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 border-b border-border bg-background/85" />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
          <PageLoadingSkeleton cards={4} rows={4} />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardChromeFallback />}>
      <DashboardChrome>{children}</DashboardChrome>
    </Suspense>
  );
}
