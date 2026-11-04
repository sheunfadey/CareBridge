import { NextResponse, type NextRequest } from "next/server";

import { userHasPermission } from "@/server/auth/current-user";
import { getCurrentUser } from "@/server/auth/current-user";
import { recordAudit } from "@/server/audit/record-audit";
import { runReport } from "@/server/reports/registry";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  if (!userHasPermission(user, "report_export")) {
    return NextResponse.json({ message: "Export permission required" }, { status: 403 });
  }

  const { report: reportKey } = await params;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const organisationId = searchParams.get("organisation") ?? undefined;

  const result = await runReport(reportKey, {
    from,
    to,
    organisationId,
    limit: 5000,
  });

  if (!result) {
    return NextResponse.json({ message: "Unknown report" }, { status: 404 });
  }

  const header = result.report.columns.map((column) => csvCell(column.label)).join(",");
  const body = result.rows
    .map((row) =>
      result.report.columns.map((column) => csvCell(row[column.key])).join(","),
    )
    .join("\r\n");

  await recordAudit({
    actorId: user.id,
    organisationId: organisationId ?? null,
    action: "report.exported",
    entityType: "report",
    entityId: result.report.key,
    metadata: {
      report: result.report.key,
      from: from ?? null,
      to: to ?? null,
      organisationId: organisationId ?? null,
      rowCount: result.rows.length,
      exportedAt: new Date().toISOString(),
    },
  });

  const filename = `carebridge-${result.report.key}-${to ?? new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`${header}\r\n${body}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
