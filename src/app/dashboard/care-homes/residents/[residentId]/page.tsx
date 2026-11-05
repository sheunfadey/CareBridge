import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClockIcon,
  FileHeartIcon,
  PhoneIcon,
  PillIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react";

import { CareNav } from "@/components/care/care-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CarePlanDialogForm,
  CareRecordDialogForm,
  CareTaskDialogForm,
  ConsentDialogForm,
  ContactDialogForm,
  MedicationDialogForm,
  MedicationStatusForm,
  RelationshipDialogForm,
  ResidentDialogForm,
  RevokeFamilyButton,
} from "@/features/care/components/care-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  carePlanAccessLabels,
  carePlanStatusLabels,
  medicationStatusLabels,
  residentStatusLabels,
  serviceInvoiceStatusLabels,
} from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { getResidentRecord, listResidentAccessEvents } from "@/server/care/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Resident record",
};

export default async function ResidentRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ residentId: string }>;
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const { residentId } = await params;
  const query = await searchParams;
  const context = await requireCarePage({
    permission: "resident_view",
    requestedOrganisation: query.organisation,
    requestedFacility: query.facility,
    redirectTo: `/dashboard/care-homes/residents/${residentId}`,
  });

  const record = await getResidentRecord(context.workspace, residentId);
  if (!record) {
    notFound();
  }

  const supabase = await createClient();
  await supabase.rpc("record_resident_access", {
    p_resident: residentId,
    p_action: "view",
  });

  const resident = record.resident;
  const canManage = userHasPermission(context.user, "resident_manage");
  const canPlan = userHasPermission(context.user, "care_plan_manage");
  const canMedication = userHasPermission(context.user, "medication_manage");
  const canRecord = userHasPermission(context.user, "care_record_manage");
  const accessEvents = canManage
    ? await listResidentAccessEvents(resident.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={resident.facilityName ?? "Resident"}
        title={`${resident.firstName} ${resident.lastName}`}
        description={`${resident.reference}${resident.roomNumber ? ` · Room ${resident.roomNumber}` : ""}${resident.preferredName ? ` · Prefers ${resident.preferredName}` : ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          {
            label: "Residents",
            href: `/dashboard/care-homes/residents?organisation=${context.workspace.organisationId}`,
          },
          { label: `${resident.firstName} ${resident.lastName}` },
        ]}
        actions={
          <>
            <StatusBadge
              status={resident.status}
              label={residentStatusLabels[resident.status]}
            />
            {canManage ? (
              <ResidentDialogForm
                organisationId={context.workspace.organisationId}
                facilities={context.facilities}
                resident={resident}
              />
            ) : null}
            {canRecord ? (
              <CareRecordDialogForm
                organisationId={context.workspace.organisationId}
                residentId={resident.id}
              />
            ) : null}
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/residents"
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4 p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Resident details
          </h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Date of birth</dt>
              <dd className="font-medium text-brand-strong">
                {resident.dateOfBirth ? formatDate(resident.dateOfBirth) : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gender</dt>
              <dd className="font-medium text-brand-strong">{resident.gender ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Admitted</dt>
              <dd className="font-medium text-brand-strong">
                {formatDate(resident.admissionDate)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Discharged</dt>
              <dd className="font-medium text-brand-strong">
                {resident.dischargeDate ? formatDate(resident.dischargeDate) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Care level</dt>
              <dd className="font-medium text-brand-strong">
                {resident.careLevel ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Facility</dt>
              <dd className="font-medium text-brand-strong">
                {resident.facilityName ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="space-y-3 border-t border-border pt-4 text-sm">
            {[
              ["Mobility", resident.mobilityNotes],
              ["Dietary", resident.dietaryNotes],
              ["Communication", resident.communicationNotes],
              ["Accessibility", resident.accessibilityNeeds],
              ["Care requirements", resident.careRequirements],
              ["Medical notes", resident.medicalNotes],
            ].map(([label, value]) =>
              value ? (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-brand-strong">{value}</p>
                </div>
              ) : null,
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <PhoneIcon className="size-5 text-brand-teal" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Emergency contacts
              </h2>
            </div>
            {record.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts recorded.</p>
            ) : (
              <ul className="divide-y divide-border">
                {record.contacts.map((contact) => (
                  <li key={contact.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-brand-strong">{contact.name}</span>
                      {contact.isEmergency ? (
                        <StatusBadge status="emergency" label="Emergency" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[contact.relationship, contact.phone, contact.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {contact.isAuthorisedRepresentative ? (
                      <p className="text-xs text-brand-teal">Authorised representative</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canManage ? (
              <ContactDialogForm
                organisationId={context.workspace.organisationId}
                residentId={resident.id}
              />
            ) : null}
          </Card>

          <Card className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-5 text-brand-teal" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Family access
              </h2>
            </div>
            {record.relationships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No family accounts are linked.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {record.relationships.map((relationship) => (
                  <li key={relationship.id} className="flex items-start justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-brand-strong">
                        {relationship.relationship ?? "Linked account"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relationship.accessLevel === "full" ? "Full record" : "Summary"} ·{" "}
                        {relationship.revokedAt ? "Revoked" : "Active"}
                      </p>
                    </div>
                    {canManage && !relationship.revokedAt ? (
                      <RevokeFamilyButton
                        organisationId={context.workspace.organisationId}
                        residentId={resident.id}
                        relationshipId={relationship.id}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canManage ? (
              <RelationshipDialogForm
                organisationId={context.workspace.organisationId}
                residentId={resident.id}
              />
            ) : null}
          </Card>

          <Card className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <FileHeartIcon className="size-5 text-brand-teal" aria-hidden="true" />
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Consents
              </h2>
            </div>
            {record.consents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No consents recorded.</p>
            ) : (
              <ul className="divide-y divide-border">
                {record.consents.map((consent) => (
                  <li key={consent.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize text-brand-strong">
                        {consent.consentType.replaceAll("_", " ")}
                      </span>
                      <StatusBadge
                        status={consent.granted ? "granted" : "withdrawn"}
                        label={consent.granted ? "Granted" : "Not granted"}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {formatDate(consent.effectiveFrom)}
                      {consent.expiresOn ? ` · expires ${formatDate(consent.expiresOn)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {canManage ? (
              <ConsentDialogForm
                organisationId={context.workspace.organisationId}
                residentId={resident.id}
              />
            ) : null}
          </Card>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Care plans
          </h2>
          {canPlan ? (
            <CarePlanDialogForm
              organisationId={context.workspace.organisationId}
              residentId={resident.id}
            />
          ) : null}
        </div>
        {record.carePlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No care plans yet. Care plans are versioned and require approval.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {record.carePlans.map((plan) => (
              <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    href={`/dashboard/care-homes/plans/${plan.id}`}
                    className="font-medium text-brand-strong hover:text-brand-teal"
                  >
                    {plan.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {plan.versionCount} version{plan.versionCount === 1 ? "" : "s"} ·{" "}
                    {carePlanAccessLabels[plan.accessLevel as "standard" | "restricted"]} access
                    {plan.reviewDueOn ? ` · review by ${formatDate(plan.reviewDueOn)}` : ""}
                  </p>
                </div>
                <StatusBadge
                  status={plan.status}
                  label={carePlanStatusLabels[plan.status]}
                />
              </li>
            ))}
          </ul>
        )}
        {canPlan ? (
          <div className="border-t border-border pt-4">
            <CareTaskDialogForm
              organisationId={context.workspace.organisationId}
              residentId={resident.id}
            />
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <PillIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Medication records
            </h2>
          </div>
          {record.medication.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No medication records.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {record.medication.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-brand-strong">{item.medicationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.doseText, item.route, formatDateTime(item.scheduledAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={item.status}
                      label={medicationStatusLabels[item.status]}
                    />
                    {canMedication && item.status === "scheduled" ? (
                      <MedicationStatusForm
                        organisationId={context.workspace.organisationId}
                        medicationRecordId={item.id}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canMedication ? (
            <MedicationDialogForm
              organisationId={context.workspace.organisationId}
              residentId={resident.id}
            />
          ) : null}
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <CalendarClockIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Recent care records
            </h2>
          </div>
          {record.recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No care recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {record.recentRecords.map((entry) => (
                <li key={entry.id} className="py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium capitalize text-brand-strong">
                      {entry.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.completedAt ?? entry.recordedAt)}
                    </span>
                  </div>
                  {entry.observations ? (
                    <p className="text-xs text-muted-foreground">{entry.observations}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canRecord ? (
            <CareRecordDialogForm
              organisationId={context.workspace.organisationId}
              residentId={resident.id}
            />
          ) : null}
        </Card>
      </div>

      {canManage ? (
        <Card className="space-y-3 p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Access history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resident record views are logged for authorised staff. Only the
              latest 20 events are shown.
            </p>
          </div>
          {accessEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No access events recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {accessEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-brand-strong">
                    {event.userName ?? "Staff member"} · {event.action}
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Incidents
            </h2>
          </div>
          {record.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incidents recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {record.incidents.map((incident) => (
                <li key={incident.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <Link
                    href={`/dashboard/care-homes/incidents/${incident.id}`}
                    className="font-medium capitalize text-brand-strong hover:text-brand-teal"
                  >
                    {incident.category.replaceAll("_", " ")}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(incident.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Invoices
          </h2>
          {record.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices for this resident.</p>
          ) : (
            <ul className="divide-y divide-border">
              {record.invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <Link
                    href={`/dashboard/care-homes/invoices/${invoice.id}`}
                    className="font-medium text-brand-strong hover:text-brand-teal"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                  <div className="text-right">
                    <p className="tabular-nums text-brand-strong">
                      {formatMoney(invoice.totalMinorUnits, "NGN")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {serviceInvoiceStatusLabels[invoice.status]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button asChild size="sm" variant="outline">
            <Link
              href={`/dashboard/care-homes/invoices?organisation=${context.workspace.organisationId}`}
            >
              Open invoices
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
