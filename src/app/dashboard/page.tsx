import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangleIcon,
  BookOpenCheckIcon,
  Building2Icon,
  CalendarClockIcon,
  CreditCardIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  ReceiptTextIcon,
  Share2Icon,
  ShieldAlertIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions/registry";
import { subscriptionStatusLabels } from "@/lib/validation/billing";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import { getDashboardFacts } from "@/server/dashboard/queries";
import {
  getAcademySnapshot,
  getCareDashboardSnapshot,
  getCharityDashboardSnapshot,
  getEmployerSnapshot,
  getFinanceSnapshot,
  getMyCharitySnapshot,
  getReferralPartnerSnapshot,
} from "@/server/dashboard/role-queries";
import { getBillingSummary } from "@/server/billing/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

function isTrialEndingSoon(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard");
  }

  if (user.isSuperAdmin) {
    redirect("/dashboard/admin");
  }

  const [
    facts,
    care,
    charityAdmin,
    myCharity,
    referralPartner,
    employer,
    academy,
    finance,
  ] = await Promise.all([
    getDashboardFacts(user),
    getCareDashboardSnapshot(user),
    getCharityDashboardSnapshot(user),
    getMyCharitySnapshot(user),
    getReferralPartnerSnapshot(user),
    getEmployerSnapshot(user),
    getAcademySnapshot(user),
    getFinanceSnapshot(user),
  ]);

  const primaryOrganisation =
    user.organisations.find((organisation) => organisation.isOwner) ??
    user.organisations[0];
  const canViewBilling =
    user.isSuperAdmin ||
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
  const trialEndsSoon =
    effectiveStatus === "trialing" &&
    isTrialEndingSoon(billing?.subscription?.trialEndsAt);

  const firstName = user.fullName?.split(" ")[0] ?? user.email.split("@")[0];
  const roleNames = user.roles
    .map((role) => ROLE_LABELS[role])
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description={
          roleNames.length > 0
            ? `Your workspace as ${roleNames.join(", ")}. Metrics below come from live data only.`
            : "Your CareBridge workspace. Metrics below come from live data only."
        }
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <>
            {userHasPermission(user, "report_view") ? (
              <Button variant="outline" asChild>
                <Link href="/dashboard/reports">Reports</Link>
              </Button>
            ) : null}
            {canViewBilling && primaryOrganisation ? (
              <Button variant="outline" asChild>
                <Link
                  href={`/dashboard/organisation/${primaryOrganisation.organisationId}/billing`}
                >
                  Billing
                </Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href="/dashboard/organisation">Manage workspace</Link>
            </Button>
          </>
        }
      />

      {readOnly ? (
        <Card className="border-brand-warning/50 bg-brand-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="mt-0.5 size-5 text-brand-warning" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                Workspace is read-only
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The subscription is{" "}
                {effectiveStatus
                  ? subscriptionStatusLabels[
                      effectiveStatus as keyof typeof subscriptionStatusLabels
                    ] ?? effectiveStatus.replaceAll("_", " ")
                  : "inactive"}
                . Existing records remain readable and exportable. New records are
                blocked until billing is resolved.
              </p>
              {primaryOrganisation ? (
                <Button className="mt-3" size="sm" asChild>
                  <Link
                    href={`/dashboard/organisation/${primaryOrganisation.organisationId}/billing`}
                  >
                    Review billing
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {trialEndsSoon ? (
        <Card className="border-brand-sky bg-brand-sky/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                Your trial ends soon
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the plan and limits before the trial expires to avoid a
                read-only workspace.
              </p>
            </div>
            {primaryOrganisation ? (
              <Button size="sm" asChild>
                <Link
                  href={`/dashboard/organisation/${primaryOrganisation.organisationId}/billing`}
                >
                  View plan
                </Link>
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {care ? (
        <section className="space-y-4" aria-label="Care operations">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Care operations · {care.workspaceName}
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/care-homes?organisation=${care.organisationId}`}>
                Open workspace
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active residents"
              value={care.activeResidents}
              hint={`${care.onLeaveResidents} on leave`}
              icon={<UsersIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Shifts today"
              value={care.shiftsToday}
              hint={`${care.coverageGaps} coverage gaps`}
              icon={<CalendarClockIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Open incidents"
              value={care.openIncidents}
              hint="Requires review or closure"
              icon={<ShieldAlertIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Outstanding invoices"
              value={formatMoney(care.outstandingMinorUnits, "NGN")}
              hint={`${care.facilities} facilities`}
              icon={<ReceiptTextIcon aria-hidden="true" />}
            />
          </div>
        </section>
      ) : null}

      {charityAdmin ? (
        <section className="space-y-4" aria-label="Charity">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Charity · {charityAdmin.workspaceName}
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/charity?organisation=${charityAdmin.organisationId}`}>
                Open workspace
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active campaigns"
              value={charityAdmin.activeCampaigns}
              hint="Approved and public"
              icon={<HeartHandshakeIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Donations received"
              value={formatMoney(charityAdmin.receivedMinorUnits, "NGN")}
              hint="Net of refunds"
              icon={<WalletIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Committed funds"
              value={formatMoney(charityAdmin.committedMinorUnits, "NGN")}
              hint="Allocated to campaign purposes"
              icon={<ReceiptTextIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Scholarships"
              value={charityAdmin.awardsCount}
              hint={`${charityAdmin.studentsSponsored} students sponsored`}
              icon={<GraduationCapIcon aria-hidden="true" />}
            />
          </div>
        </section>
      ) : null}

      {referralPartner ? (
        <section className="space-y-4" aria-label="Referral partner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Referral partner · {referralPartner.code}
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/referrals">Open referrals</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Approved balance"
              value={formatMoney(referralPartner.approvedMinorUnits, "NGN")}
              hint="Available to request"
              icon={<WalletIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Pending commissions"
              value={formatMoney(referralPartner.pendingMinorUnits, "NGN")}
              hint="Awaiting eligibility or approval"
              icon={<CalendarClockIcon aria-hidden="true" />}
            />
            <MetricCard
              label="In payout"
              value={formatMoney(referralPartner.inPayoutMinorUnits, "NGN")}
              hint="Held against a payout request"
              icon={<CreditCardIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Paid to date"
              value={formatMoney(referralPartner.paidMinorUnits, "NGN")}
              hint="Confirmed transfers"
              icon={<Share2Icon aria-hidden="true" />}
            />
          </div>
        </section>
      ) : null}

      {employer ? (
        <section className="space-y-4" aria-label="Employer">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Employment
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/jobs/manage">Manage jobs</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Published jobs" value={employer.publishedJobs} hint={`${employer.draftJobs} drafts`} icon={<Building2Icon />} />
            <MetricCard label="Applications" value={employer.applications} hint="Across your roles" icon={<UsersIcon />} />
            <MetricCard label="Shortlisted" value={employer.shortlisted} hint="Awaiting interview or offer" icon={<BookOpenCheckIcon />} />
            <MetricCard label="Hired" value={employer.hired} hint="Recorded outcomes" icon={<GraduationCapIcon />} />
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-2">
        <section className="space-y-4" aria-label="Academy">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Academy
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/academy">Open academy</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Active enrolments" value={academy.myEnrolments} hint="Your learning" icon={<BookOpenCheckIcon />} />
            <MetricCard label="Completed courses" value={academy.myCompleted} hint={`${academy.myCertificates} certificates`} icon={<GraduationCapIcon />} />
            {academy.managedCourses > 0 ? (
              <MetricCard label="Managed courses" value={academy.managedCourses} hint={`${academy.publishedCourses} published`} icon={<BookOpenCheckIcon />} />
            ) : null}
          </div>
        </section>

        {finance ? (
          <section className="space-y-4" aria-label="Finance">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Finance
              </h2>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/admin/payments">Review payments</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="Payments pending" value={finance.pendingPayments} hint="Awaiting provider verification" icon={<CreditCardIcon />} />
              <MetricCard label="Reconciliation mismatches" value={finance.mismatches} hint="Flagged for review" icon={<AlertTriangleIcon />} />
              <MetricCard label="Refunds in progress" value={finance.refundsInProgress} hint="Requested or processing" icon={<ReceiptTextIcon />} />
              <MetricCard label="Payouts awaiting action" value={finance.pendingPayouts} hint="Pending or approved" icon={<WalletIcon />} />
            </div>
          </section>
        ) : null}
      </div>

      {myCharity.donationsCount > 0 ||
      myCharity.applicationsCount > 0 ||
      myCharity.awardsCount > 0 ? (
        <section className="space-y-4" aria-label="My charity activity">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              My charity and scholarships
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/charity">Open charity</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Donations" value={myCharity.donationsCount} hint={formatMoney(myCharity.donatedMinorUnits, "NGN")} icon={<HeartHandshakeIcon />} />
            <MetricCard label="Scholarship applications" value={myCharity.applicationsCount} hint="Submitted" icon={<BookOpenCheckIcon />} />
            <MetricCard label="Awards" value={myCharity.awardsCount} hint={`${myCharity.pendingAwards} awaiting response`} icon={<GraduationCapIcon />} />
          </div>
        </section>
      ) : null}

      <section className="space-y-4" aria-label="Your organisations">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Your organisations
        </h2>
        {user.organisations.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">
            You are not a member of an organisation yet.{" "}
            <Link href="/dashboard/organisation" className="font-medium text-brand-teal hover:underline">
              Create or join a workspace
            </Link>
            .
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {user.organisations.map((organisation) => (
              <Card key={organisation.organisationId} className="space-y-2 p-4">
                <p className="font-heading text-base font-semibold text-brand-strong">
                  {organisation.organisationName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {organisation.roles
                    .map((role) => ROLE_LABELS[role])
                    .join(", ") || "Member"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/organisation/${organisation.organisationId}`}>
                      Open
                    </Link>
                  </Button>
                  {canViewBilling ? (
                    <Button size="sm" variant="ghost" asChild>
                      <Link
                        href={`/dashboard/organisation/${organisation.organisationId}/billing`}
                      >
                        Billing
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Organisations" value={facts.organisationCount} hint="Workspaces you belong to" icon={<Building2Icon />} />
          <MetricCard label="Active members" value={facts.activeMembershipCount} hint="Across your organisations" icon={<UsersIcon />} />
          <MetricCard label="Pending invitations" value={facts.pendingInvitationCount} hint="Awaiting acceptance" icon={<UsersIcon />} />
        </div>
      </section>
    </div>
  );
}
