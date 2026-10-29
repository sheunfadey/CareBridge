import { redirect } from "next/navigation";

import { OnboardingForm } from "@/features/auth/components/onboarding-form";
import { getCurrentUser } from "@/server/auth/current-user";

/**
 * Resolves the authenticated user (dynamic cookie access) and renders the
 * onboarding form. Split out so it can live behind a Suspense boundary.
 */
export async function OnboardingGate() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/onboarding");
  }

  return <OnboardingForm defaultFullName={user.fullName ?? ""} />;
}
