import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CharityNav } from "@/components/charity/charity-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AwardDialogForm,
  AwardStatusButtons,
  OutcomeDialogForm,
  ProgrammeDialogForm,
  ScholarshipReviewForm,
} from "@/features/charity/components/charity-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  scholarshipApplicationStatusLabels,
  scholarshipAwardStatusLabels,
  scholarshipCoverageLabels,
  scholarshipProgrammeStatusLabels,
} from "@/lib/validation/charity";
import { requireAnyCharityPage } from "@/server/charity/access";
import { getProgrammeDetail, listCourseOptions } from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Scholarship programme",
};

export default async function ProgrammeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ programmeId: string }>;
  searchParams: Promise<{ organisation?: string }>;
}) {
  const { programmeId } = await params;
  const query = await searchParams;
  const context = await requireAnyCharityPage({
    permissions: ["scholarship_manage", "scholarship_review"],
    requestedOrganisation: query.organisation,
    redirectTo: `/dashboard/charity/scholarships/${programmeId}`,
  });

  const [detail, courses] = await Promise.all([
    getProgrammeDetail(context.workspace, programmeId),
    listCourseOptions(),
  ]);
  if (!detail) notFound();

  const programme = detail.programme;
  const canManage = await context.can("scholarship_manage");
  const canReview = await context.can("scholarship_review");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scholarship programme"
        title={programme.name}
        description={`${scholarshipCoverageLabels[programme.coverage]} award up to ${formatMoney(programme.maxAwardMinorUnits, programme.currency)} · ${formatDate(programme.opensOn)}${programme.closesOn ? ` – ${formatDate(programme.closesOn)}` : ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          {
            label: "Scholarships",
            href: `/dashboard/charity/scholarships?organisation=${context.workspace.organisationId}`,
          },
          { label: programme.name },
        ]}
        actions={
          <>
            <StatusBadge
              status={programme.status}
              label={scholarshipProgrammeStatusLabels[programme.status]}
            />
            {canManage ? (
              <ProgrammeDialogForm
                organisationId={context.workspace.organisationId}
                courses={courses}
                programme={programme}
              />
            ) : null}
          </>
        }
      />

      <CharityNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        active="/scholarships"
      />

      <Card className="space-y-3 p-5">
        <div>
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Eligibility
          </h2>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {programme.eligibility}
          </p>
        </div>
        {programme.description ? (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              About the programme
            </h3>
            <p className="mt-1 whitespace-pre-line text-sm text-brand-strong">
              {programme.description}
            </p>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Applications
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, shortlist and award. Applicants can only edit or withdraw
            before a decision is made.
          </p>
        </div>
        {detail.applications.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No applications yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {detail.applications.map((application) => (
              <div key={application.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-brand-strong">
                      {application.applicantName ?? "Applicant"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {application.applicantEmail ?? "No email"} · applied{" "}
                      {formatDateTime(application.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={application.status}
                      label={scholarshipApplicationStatusLabels[application.status]}
                    />
                    {application.award ? (
                      <StatusBadge
                        status={application.award.status}
                        label={scholarshipAwardStatusLabels[application.award.status]}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {application.statement}
                </p>
                {Array.isArray(application.evidenceReferences) &&
                application.evidenceReferences.length > 0 ? (
                  <ul className="list-disc pl-5 text-xs text-muted-foreground">
                    {(application.evidenceReferences as string[]).map((reference) => (
                      <li key={reference}>{reference}</li>
                    ))}
                  </ul>
                ) : null}
                {application.reviewedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Reviewed {formatDateTime(application.reviewedAt)}
                    {application.decisionNotes ? ` · ${application.decisionNotes}` : ""}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {canReview && !["approved", "rejected", "withdrawn"].includes(application.status) ? (
                    <div className="min-w-72 flex-1 rounded-md border border-border p-3">
                      <ScholarshipReviewForm
                        organisationId={context.workspace.organisationId}
                        applicationId={application.id}
                        status={application.status}
                      />
                    </div>
                  ) : null}
                  {canManage && !application.award ? (
                    <div className="min-w-72 flex-1 rounded-md border border-border p-3">
                      <AwardDialogForm
                        organisationId={context.workspace.organisationId}
                        applicationId={application.id}
                        courses={courses}
                        maxAwardMinorUnits={programme.maxAwardMinorUnits}
                        currency={programme.currency}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Awards
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Course access is granted only after the learner accepts the award.
          </p>
        </div>
        {detail.awards.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No awards yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Awarded</TableHead>
                <TableHead>Outcomes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.awards.map((award) => (
                <TableRow key={award.id}>
                  <TableCell className="text-sm font-medium text-brand-strong">
                    {award.applicantName ?? "Learner"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(award.amountMinorUnits, award.currency)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {scholarshipCoverageLabels[award.coverage]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={award.status}
                      label={scholarshipAwardStatusLabels[award.status]}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(award.awardedAt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {award.completionOutcome
                      ? "Completion recorded"
                      : award.internshipOutcome
                        ? "Internship recorded"
                        : award.employmentOutcome && award.outcomeShareable
                          ? "Employment outcome shared"
                          : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      {canManage ? (
                        <>
                          <AwardStatusButtons
                            organisationId={context.workspace.organisationId}
                            awardId={award.id}
                            status={award.status}
                          />
                          <OutcomeDialogForm
                            organisationId={context.workspace.organisationId}
                            awardId={award.id}
                          />
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Button asChild variant="ghost">
        <Link
          href={`/dashboard/charity/scholarships?organisation=${context.workspace.organisationId}`}
        >
          Back to scholarships
        </Link>
      </Button>
    </div>
  );
}
