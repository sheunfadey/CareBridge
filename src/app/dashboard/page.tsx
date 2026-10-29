import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  Building2Icon,
  GraduationCapIcon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCard,
  MetricCard,
  ProgressCard,
} from "@/components/dashboard";
import { brand } from "@/config/brand";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDashboardFacts } from "@/server/dashboard/queries";

export default function DashboardPage(): ReactNode {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Welcome to CareBridge"
        description="Your workspace across training, placements, employment and care operations. Metrics populate only from real data as each phase goes live."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/organisation">
                Organisations
                <ArrowUpRightIcon />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/organisation">Manage workspace</Link>
            </Button>
          </>
        }
      />

      <Suspense fallback={<DashboardFactsSkeleton />}>
        <DashboardFacts />
      </Suspense>

      <AlertCard
        tone="info"
        title="Phase 2 — authentication & multi-tenancy"
        description={`Accounts, organisations, roles, invitations and row-level security are live. No fabricated metrics and no live ${brand.currency} transactions are shown.`}
      />

      <section aria-label="Implementation status" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold text-brand-navy">
            Implementation status
          </h2>
          <StatusBadge status="in_progress" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressCard title="Phase 1 — Brand & design system" value={100} />
          <ProgressCard title="Phase 2 — Auth & multi-tenancy" value={70} />
          <ProgressCard title="Phase 3 — Public site & admin" value={0} />
          <ProgressCard title="Phase 4 — Academy" value={40} />
        </div>
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="font-heading text-sm font-semibold text-brand-navy">
            Delivery progress
          </h3>
          <div className="mt-4 flex items-center gap-4">
            <Progress value={35} aria-label="Overall build progress: 35 percent" />
            <span className="text-sm font-semibold tabular-nums text-brand-teal">
              35%
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Phases are built and verified in order. A phase is never marked
            complete before its core workflow works against the real database.
          </p>
        </div>
      </section>
    </div>
  );
}

async function DashboardFacts() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const facts = await getDashboardFacts(user);

  return (
    <section
      aria-label="Your workspace"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        label="Organisations"
        value={String(facts.organisationCount)}
        hint="Workspaces you belong to"
        icon={<Building2Icon />}
      />
      <MetricCard
        label="Active members"
        value={String(facts.activeMembershipCount)}
        hint="Across your organisations"
        icon={<UsersIcon />}
      />
      <MetricCard
        label="Pending invitations"
        value={String(facts.pendingInvitationCount)}
        hint="Awaiting acceptance"
        icon={<MailIcon />}
      />
      <MetricCard
        label="Academy"
        value="Live"
        hint="Browse and learn"
        icon={<GraduationCapIcon />}
      />
      <MetricCard
        label="Verifications"
        value="—"
        hint="Organisation review, Phase 3"
        icon={<ShieldCheckIcon />}
        empty
      />
    </section>
  );
}

function DashboardFactsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}
