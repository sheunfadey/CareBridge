import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Building2Icon } from "lucide-react";

import { WorkspacePageHeader } from "@/features/organisations/components/workspace-page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { MemberManager } from "@/features/organisations/components/member-manager";
import {
  PlacementProviderForm,
  VerificationRequestButton,
} from "@/features/employment/components/placement-forms";
import {
  getOrganisationDetail,
  getPlacementProvider,
} from "@/server/organisations/queries";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import { organisationTypeLabels } from "@/lib/validation/organisation";

export const metadata: Metadata = {
  title: "Organisation",
};

export default async function OrganisationDetailPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/organisation/${organisationId}`);
  }

  const detail = await getOrganisationDetail(organisationId);
  if (!detail) {
    notFound();
  }

  const canManage =
    userHasPermission(user, "user_invite") &&
    (user.isSuperAdmin ||
      user.organisations.some((org) => org.organisationId === organisationId));

  const membership = user.organisations.find(
    (org) => org.organisationId === organisationId,
  );
  const isOwner = user.isSuperAdmin || Boolean(membership?.isOwner);

  const provider = canManage
    ? await getPlacementProvider(organisationId)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <WorkspacePageHeader
        eyebrow={organisationTypeLabels[detail.summary.type]}
        title={detail.summary.name}
        description="Manage members, invitations and roles for this workspace."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Organisation", href: "/dashboard/organisation" },
          { label: detail.summary.name },
        ]}
        actions={
          userHasPermission(user, "subscription_view") || user.isSuperAdmin ? (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/organisation/${organisationId}/billing`}>
                Billing & plan
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex flex-row items-center gap-3 p-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand-sky text-brand-teal">
            <Building2Icon className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={detail.summary.status} />
          </div>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">Verification</p>
          <StatusBadge status={detail.summary.verificationStatus} />
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-muted-foreground">Active members</p>
          <p className="font-heading text-2xl font-semibold text-brand-strong">
            {detail.summary.memberCount}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Verification
          </h2>
          {isOwner ? (
            <VerificationRequestButton
              organisationId={detail.summary.id}
              status={detail.summary.verificationStatus}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Only the organisation owner can request verification.
            </p>
          )}
        </Card>
        {canManage ? (
          <Card className="space-y-3 p-4">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Internship provider details
            </h2>
            <p className="text-sm text-muted-foreground">
              Shown to candidates on your placement listings.
            </p>
            <PlacementProviderForm
              organisationId={detail.summary.id}
              initial={provider}
            />
          </Card>
        ) : null}
      </div>

      <MemberManager
        organisationId={detail.summary.id}
        members={detail.members}
        invitations={detail.invitations}
        canManage={canManage}
        currentUserId={user.id}
      />
    </div>
  );
}
