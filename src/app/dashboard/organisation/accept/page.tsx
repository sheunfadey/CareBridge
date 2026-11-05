import type { Metadata } from "next";
import { Suspense } from "react";

import { RouteLoadingFallback } from "@/components/feedback/route-loading-fallback";
import { AcceptInvitationPanel } from "@/features/organisations/components/accept-invitation-panel";

export const metadata: Metadata = {
  title: "Accept invitation",
};

export default function AcceptInvitationPage() {
  return (
    <div className="mx-auto max-w-xl py-4">
      <Suspense
        fallback={<RouteLoadingFallback message="Loading your invitation" />}
      >
        <AcceptInvitationPanel />
      </Suspense>
    </div>
  );
}
