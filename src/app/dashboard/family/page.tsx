import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartHandshakeIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { residentStatusLabels } from "@/lib/validation/care";
import { getCurrentUser } from "@/server/auth/current-user";
import { listFamilyResidents } from "@/server/family/queries";

export const metadata: Metadata = {
  title: "Family portal",
};

export default async function FamilyPortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard%2Ffamily");
  }

  const residents = await listFamilyResidents();

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Family access"
        title="Family portal"
        description="Summary information for residents linked to your account. Clinical records, incidents, medication and billing are not shown here."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Family portal" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">Account settings</Link>
          </Button>
        }
      />

      {residents.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No resident records linked"
            description="Ask the care home to link your CareBridge account to a resident. You will then see a summary here."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {residents.map((resident) => (
            <Card key={resident.residentId} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <HeartHandshakeIcon className="size-5 text-brand-teal" aria-hidden="true" />
                    <h2 className="font-heading text-lg font-semibold text-brand-strong">
                      {resident.firstName} {resident.lastName}
                    </h2>
                  </div>
                  {resident.preferredName ? (
                    <p className="text-xs text-muted-foreground">
                      Prefers {resident.preferredName}
                    </p>
                  ) : null}
                </div>
                <StatusBadge
                  status={resident.status}
                  label={residentStatusLabels[resident.status]}
                />
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Facility</dt>
                  <dd className="font-medium text-brand-strong">
                    {resident.facilityName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Room</dt>
                  <dd className="font-medium text-brand-strong">
                    {resident.roomNumber ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Admitted</dt>
                  <dd className="font-medium text-brand-strong">
                    {formatDate(resident.admissionDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Care level</dt>
                  <dd className="font-medium text-brand-strong">
                    {resident.careLevel ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Your relationship</dt>
                  <dd className="font-medium text-brand-strong">
                    {resident.relationship ?? "Linked family"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Access level</dt>
                  <dd className="font-medium text-brand-strong">
                    {resident.accessLevel === "full" ? "Full" : "Summary"}
                  </dd>
                </div>
              </dl>

              <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                {resident.accessLevel === "full"
                  ? "Full access is limited to the care team's authorised records. Contact the care home if you need a care-plan review or a formal report."
                  : "Summary access shows basic residency information only. Ask the care home to review your access if you need more detail."}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 text-sm text-muted-foreground">
        <p className="font-medium text-brand-strong">What this portal does not show</p>
        <p className="mt-1">
          Incident reports, medication records, daily care notes, staff notes and
          invoices are restricted to authorised care and finance staff. This is a
          deliberate privacy and safeguarding control. Contact the care home
          directly for care discussions or formal information requests.
        </p>
      </Card>
    </div>
  );
}
