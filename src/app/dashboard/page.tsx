import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CaregiverDashboard } from "@/features/portal/components/caregiver-dashboard";
import { StudentDashboard } from "@/features/portal/components/student-dashboard";
import { subscriptionStatusLabels } from "@/lib/validation/billing";
import { getBillingSummary } from "@/server/billing/queries";
import {
  canUseTrainerWorkspace,
  getCurrentUser,
  userHasPermission,
} from "@/server/auth/current-user";
import {
  getCaregiverDashboardData,
  getStudentDashboardData,
} from "@/server/portal/queries";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard");
  }

  if (user.isSuperAdmin) {
    redirect("/dashboard/admin");
  }

  // Trainers work in their own workspace, which is not a mode of this portal.
  if (user.activePortal === "trainer" && canUseTrainerWorkspace(user)) {
    redirect("/trainer");
  }

  const primaryOrganisation =
    user.organisations.find((organisation) => organisation.isOwner) ??
    user.organisations[0];
  const canViewBilling =
    userHasPermission(user, "subscription_view") ||
    userHasPermission(user, "billing_manage");
  const billing =
    primaryOrganisation && canViewBilling
      ? await getBillingSummary(primaryOrganisation.organisationId)
      : null;

  const effectiveStatus = billing?.subscription?.effectiveStatus;
  const readOnly =
    effectiveStatus !== undefined &&
    !["active", "trialing", "grace", "cancelled_active", "legacy"].includes(
      effectiveStatus,
    );

  const showWorkspaceOverview =
    user.organisations.some((organisation) => organisation.isOwner) ||
    userHasPermission(user, "report_view") ||
    userHasPermission(user, "resident_view") ||
    userHasPermission(user, "job_manage") ||
    userHasPermission(user, "course_manage");

  const person = {
    name:
      user.fullName ??
      user.email.split("@")[0]?.replace(/[._-]+/g, " ") ??
      "there",
    email: user.email,
    avatarUrl: user.avatarUrl,
  };

  return (
    <div className="space-y-5">
      {readOnly ? (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[var(--radius-2xl)] border border-brand-warning/30 bg-brand-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-brand-warning" />
            <div>
              <h2 className="font-heading text-sm font-semibold text-brand-strong">
                Workspace is read-only
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                The subscription is{" "}
                {effectiveStatus
                  ? subscriptionStatusLabels[
                      effectiveStatus as keyof typeof subscriptionStatusLabels
                    ] ?? effectiveStatus.replaceAll("_", " ")
                  : "inactive"}
                . Records stay readable and exportable.
              </p>
            </div>
          </div>
          {primaryOrganisation ? (
            <Button size="sm" className="rounded-full" asChild>
              <Link
                href={`/dashboard/organisation/${primaryOrganisation.organisationId}/billing`}
              >
                Review billing
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {user.activePortal === "caregiver" ? (
        <CaregiverDashboard
          user={person}
          data={await getCaregiverDashboardData(user.id)}
          showWorkspaceOverview={showWorkspaceOverview}
          canLogCare={userHasPermission(user, "care_record_manage")}
        />
      ) : (
        <StudentDashboard
          user={person}
          data={await getStudentDashboardData(user.id)}
          showWorkspaceOverview={showWorkspaceOverview}
        />
      )}
    </div>
  );
}
