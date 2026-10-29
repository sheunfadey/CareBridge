import type { Metadata } from "next";
import { Suspense } from "react";

import { CareBridgeLogo } from "@/components/brand/carebridge-logo";
import { RouteLoadingFallback } from "@/components/feedback/route-loading-fallback";
import { OnboardingGate } from "@/features/auth/components/onboarding-gate";

export const metadata: Metadata = {
  title: "Set up your account",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-8">
        <CareBridgeLogo size="md" />
      </div>
      <Suspense fallback={<RouteLoadingFallback message="Loading your profile" />}>
        <OnboardingGate />
      </Suspense>
    </div>
  );
}
