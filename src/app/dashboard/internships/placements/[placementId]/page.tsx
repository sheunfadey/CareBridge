import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AttendanceForm,
  CompletePlacementForm,
  EvaluationForm,
  IncidentForm,
  IncidentUpdateButtons,
  IssueCompletionForm,
  PlacementAgreementButtons,
  PlacementManagerControls,
  ReviewLogButtons,
  WeeklyLogForm,
} from "@/features/employment/components/placement-forms";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/current-user";
import { getPlacementDetail } from "@/server/employment/workspace-queries";

type PlacementPageProps = {
  params: Promise<{ placementId: string }>;
};

export async function generateMetadata({
  params,
}: PlacementPageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  const { placementId } = await params;
  if (!user) return { title: "Placement" };
  const placement = await getPlacementDetail(user, placementId);
  return { title: placement ? placement.listingTitle : "Placement" };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function PlacementDetailPage({
  params,
}: PlacementPageProps) {
  const { placementId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/internships/placements/${placementId}`);
  }

  const placement = await getPlacementDetail(user, placementId);
  if (!placement) notFound();

  const totalAttendanceHours = placement.attendance.reduce(
    (total, entry) => total + entry.hours,
    0,
  );
  const totalLogHours = placement.logs.reduce(
    (total, entry) => total + entry.hours,
    0,
  );
  const isAssignedSupervisor = placement.supervisorId === user.id;
  const canWriteLogs =
    (placement.isCandidate || isAssignedSupervisor) &&
    placement.status === "active";

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Placement"
        title={placement.listingTitle}
        description={`${placement.organisationName} · ${[
          placement.city,
          placement.state,
        ]
          .filter(Boolean)
          .join(", ") || placement.location || "Location not set"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          {
            label: "Placements",
            href: "/dashboard/internships/placements",
          },
          { label: placement.listingTitle },
        ]}
        actions={
          <>
            <StatusBadge status={placement.status} />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/internships/${placement.listingId}`}>
                View listing
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Candidate</p>
          <p className="font-heading font-semibold text-brand-strong">
            {placement.candidateName}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserRoundIcon className="size-3.5" aria-hidden="true" />
            {placement.candidateName === user.fullName
              ? "You"
              : "Accepted applicant"}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Supervisor</p>
          <p className="font-heading font-semibold text-brand-strong">
            {placement.supervisorName ?? "Not assigned"}
          </p>
          <p className="text-xs text-muted-foreground">
            Agreement: {placement.agreementStatus.replaceAll("_", " ")}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Dates</p>
          <p className="flex items-center gap-1 font-heading font-semibold text-brand-strong">
            <CalendarDaysIcon className="size-4" aria-hidden="true" />
            {formatDate(placement.startDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            to {formatDate(placement.endDate)}
            {placement.expectedHours
              ? ` · ${placement.expectedHours} hrs/week`
              : ""}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs text-muted-foreground">Clearance</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusBadge
              status={placement.safeguardingCleared ? "verified" : "pending"}
              label={
                placement.safeguardingCleared
                  ? "Safeguarding"
                  : "Safeguarding pending"
              }
            />
            <StatusBadge
              status={placement.insuranceCleared ? "verified" : "pending"}
              label={placement.insuranceCleared ? "Insurance" : "Insurance pending"}
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3.5" aria-hidden="true" />
            {placement.location ?? "Location not set"}
          </p>
        </Card>
      </div>

      {placement.isCandidate && placement.agreementStatus === "pending" ? (
        <Card className="space-y-2 border-brand-teal/30 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Placement agreement
          </h2>
          <p className="text-sm text-muted-foreground">
            Confirm the details above and accept the agreement so your host can
            activate the placement.
          </p>
          <PlacementAgreementButtons placementId={placement.id} />
        </Card>
      ) : null}

      {placement.canManage ? (
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Manage placement
            </h2>
          </div>
          <PlacementManagerControls
            placementId={placement.id}
            status={placement.status}
            supervisorId={placement.supervisorId}
            agreementStatus={placement.agreementStatus}
            supervisors={placement.supervisorOptions}
          />
          {placement.status === "active" ? (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-heading text-sm font-semibold text-brand-strong">
                Complete placement
              </h3>
              <CompletePlacementForm
                placementId={placement.id}
                disabledReason={
                  placement.safeguardingCleared
                    ? null
                    : "Confirm safeguarding clearance before completing the placement."
                }
              />
            </div>
          ) : null}
          {placement.status === "completed" && !placement.completion ? (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-heading text-sm font-semibold text-brand-strong">
                Issue completion record
              </h3>
              <IssueCompletionForm
                placementId={placement.id}
                defaultHours={totalAttendanceHours || totalLogHours}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-2 p-4 lg:col-span-2">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Learning objectives
          </h2>
          {placement.learningObjectives.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No objectives were recorded. The supervisor can add them from the
              manage panel.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {placement.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          )}
          {placement.supervisionArrangements ? (
            <div className="border-t pt-2">
              <h3 className="font-heading text-sm font-semibold text-brand-strong">
                Supervision
              </h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {placement.supervisionArrangements}
              </p>
            </div>
          ) : null}
        </Card>
        <Card className="space-y-2 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Hours
          </h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Attendance recorded</dt>
              <dd className="font-medium">{totalAttendanceHours} hrs</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Weekly logs</dt>
              <dd className="font-medium">{totalLogHours} hrs</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Required</dt>
              <dd className="font-medium">
                {placement.expectedHours
                  ? `${placement.expectedHours} hrs/week`
                  : "Not set"}
              </dd>
            </div>
          </dl>
          {placement.completion ? (
            <div className="rounded-lg border border-brand-success/20 bg-brand-success/5 p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-brand-success">
                <GraduationCapIcon className="size-4" aria-hidden="true" />
                Completion record issued
              </p>
              <p className="mt-1 font-mono text-sm">
                {placement.completion.certificateCode}
              </p>
              <p className="text-xs text-muted-foreground">
                {placement.completion.hoursCompleted} hrs · issued{" "}
                {formatDate(placement.completion.issuedAt.slice(0, 10))}
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheckIcon className="size-4 text-brand-teal" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Weekly logs
          </h2>
          <span className="text-xs text-muted-foreground">
            {placement.logs.length} submitted
          </span>
        </div>

        {canWriteLogs ? (
          <Card className="p-4">
            <WeeklyLogForm placementId={placement.id} />
          </Card>
        ) : null}

        {placement.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No weekly logs yet.
          </p>
        ) : (
          <div className="space-y-3">
            {placement.logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-heading text-sm font-semibold text-brand-strong">
                      Week of {formatDate(log.weekStart)} – {formatDate(log.weekEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.hours} hrs · submitted by {log.authorName}
                    </p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {log.summary}
                </p>
                {log.challenges ? (
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-brand-strong">Challenges: </span>
                    {log.challenges}
                  </p>
                ) : null}
                {log.nextSteps ? (
                  <p className="mt-1 text-sm">
                    <span className="font-medium text-brand-strong">Next steps: </span>
                    {log.nextSteps}
                  </p>
                ) : null}
                {log.supervisorFeedback ? (
                  <p className="mt-2 rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                    Supervisor: {log.supervisorFeedback}
                  </p>
                ) : null}
                {placement.canSupervise && log.status === "submitted" ? (
                  <div className="mt-3">
                    <ReviewLogButtons logId={log.id} />
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-4 text-brand-teal" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Attendance
          </h2>
        </div>
        {placement.canSupervise ? (
          <Card className="p-4">
            <AttendanceForm placementId={placement.id} />
          </Card>
        ) : null}
        {placement.attendance.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No attendance recorded yet.
          </p>
        ) : (
          <Card className="divide-y p-0">
            {placement.attendance.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
              >
                <span>{formatDate(entry.attendanceDate)}</span>
                <span className="text-muted-foreground">
                  {entry.hours} hrs{entry.notes ? ` · ${entry.notes}` : ""}
                </span>
                <StatusBadge status={entry.status} />
              </div>
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-4 text-brand-teal" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Evaluations
          </h2>
        </div>
        {placement.canSupervise ? (
          <Card className="p-4">
            <EvaluationForm placementId={placement.id} />
          </Card>
        ) : null}
        {placement.evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No evaluations submitted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {placement.evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-heading text-sm font-semibold text-brand-strong">
                    {formatDate(evaluation.evaluationDate)} ·{" "}
                    {evaluation.evaluatorName}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={evaluation.recommendation} />
                    {evaluation.status !== "submitted" ? (
                      <StatusBadge status={evaluation.status} />
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall {evaluation.overallRating}/5
                  {evaluation.carePracticeRating
                    ? ` · Care ${evaluation.carePracticeRating}/5`
                    : ""}
                  {evaluation.communicationRating
                    ? ` · Communication ${evaluation.communicationRating}/5`
                    : ""}
                  {evaluation.professionalismRating
                    ? ` · Professionalism ${evaluation.professionalismRating}/5`
                    : ""}
                  {evaluation.safeguardingRating
                    ? ` · Safeguarding ${evaluation.safeguardingRating}/5`
                    : ""}
                </p>
                {evaluation.strengths ? (
                  <p className="text-sm">
                    <span className="font-medium text-brand-strong">Strengths: </span>
                    {evaluation.strengths}
                  </p>
                ) : null}
                {evaluation.areasForImprovement ? (
                  <p className="text-sm">
                    <span className="font-medium text-brand-strong">
                      Areas for improvement:{" "}
                    </span>
                    {evaluation.areasForImprovement}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-brand-warning" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Incidents
          </h2>
        </div>
        {placement.isCandidate || placement.canSupervise ? (
          <Card className="p-4">
            <IncidentForm placementId={placement.id} />
          </Card>
        ) : null}
        {placement.incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No incidents reported.
          </p>
        ) : (
          <div className="space-y-3">
            {placement.incidents.map((incident) => (
              <Card key={incident.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-heading text-sm font-semibold text-brand-strong">
                    {incident.category} · {formatDateTime(incident.occurredAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {incident.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reported by {incident.reporterName}
                </p>
                {incident.resolution ? (
                  <p className="rounded-lg bg-muted/50 p-2 text-sm">
                    Resolution: {incident.resolution}
                  </p>
                ) : null}
                {placement.canSupervise ? (
                  <IncidentUpdateButtons
                    incidentId={incident.id}
                    currentStatus={incident.status}
                  />
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
