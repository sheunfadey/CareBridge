import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/current-user";
import { requirePermissionPage } from "@/server/auth/require-permission";
import { REPORTS, runReport } from "@/server/reports/registry";

export const metadata: Metadata = {
  title: "Reports",
};

function defaultFrom(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    report?: string;
    from?: string;
    to?: string;
    organisation?: string;
  }>;
}) {
  await requirePermissionPage("/dashboard/reports", "report_view");
  const user = await getCurrentUser();
  const params = await searchParams;

  const from = params.from ?? defaultFrom();
  const to = params.to ?? defaultTo();
  const organisationId = params.organisation;
  const selectedKey = REPORTS.some((report) => report.key === params.report)
    ? params.report!
    : REPORTS[0].key;

  const result = await runReport(selectedKey, {
    from,
    to,
    organisationId,
    limit: 50,
  });

  const organisations = user?.organisations ?? [];
  const categories = Array.from(new Set(REPORTS.map((report) => report.category)));
  const exportQuery = new URLSearchParams();
  exportQuery.set("from", from);
  exportQuery.set("to", to);
  if (organisationId) exportQuery.set("organisation", organisationId);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        description="Role-appropriate operational and financial reports. CSV exports require export permission and are recorded in the audit log."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/api/reports/${selectedKey}/export?${exportQuery.toString()}`}>
              Export current report (CSV)
            </Link>
          </Button>
        }
      />

      <Card className="p-3.5">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div>
            <label htmlFor="report" className="mb-1 block text-xs text-muted-foreground">
              Report
            </label>
            <select
              id="report"
              name="report"
              defaultValue={selectedKey}
              className="h-9 max-w-80 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            >
              {REPORTS.map((report) => (
                <option key={report.key} value={report.key}>
                  {report.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="from" className="mb-1 block text-xs text-muted-foreground">
              From
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={from}
              className="h-9 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-xs text-muted-foreground">
              To
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={to}
              className="h-9 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="organisation"
              className="mb-1 block text-xs text-muted-foreground"
            >
              Organisation
            </label>
            <select
              id="organisation"
              name="organisation"
              defaultValue={organisationId ?? ""}
              className="h-9 max-w-64 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            >
              <option value="">All my organisations</option>
              {organisations.map((organisation) => (
                <option
                  key={organisation.organisationId}
                  value={organisation.organisationId}
                >
                  {organisation.organisationName}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Apply filters
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[200px_1fr]">
        <Card className="p-3.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Report catalogue
          </h2>
          <div className="mt-3 space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <p className="text-xs font-medium text-brand-teal">{category}</p>
                <ul className="mt-1 space-y-0.5">
                  {REPORTS.filter((report) => report.category === category).map(
                    (report) => (
                      <li key={report.key}>
                        <Link
                          href={`/dashboard/reports?report=${report.key}&from=${from}&to=${to}${organisationId ? `&organisation=${organisationId}` : ""}`}
                          className={
                            report.key === selectedKey
                              ? "block rounded px-2 py-1 text-sm font-medium text-brand-strong bg-brand-sky/60"
                              : "block rounded px-2 py-1 text-sm text-muted-foreground hover:text-brand-strong"
                          }
                        >
                          {report.label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
              {result?.report.label ?? "Report"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {result?.report.description} · {formatDate(from)} to {formatDate(to)}
            </p>
          </div>
          {!result || result.rows.length === 0 ? (
            <EmptyState
              title="No rows"
              description="No records match these filters. Adjust the date range or organisation."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {result.report.columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row, index) => (
                  <TableRow key={index}>
                    {result.report.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className="max-w-80 text-sm text-muted-foreground"
                      >
                        {String(row[column.key] ?? "—")
                          .replaceAll("T00:00:00", "")
                          .slice(0, 160)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="border-t border-border p-4 text-xs text-muted-foreground">
            Showing up to 50 rows in the page. Exports are limited to 5,000 rows.
            Sensitive exports record the exporting user, filters and timestamp.
          </div>
        </Card>
      </div>
    </div>
  );
}
