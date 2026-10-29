import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import { adminService } from "@/server/admin/admin-service";

export const metadata: Metadata = {
  title: "Audit log",
};

export default async function AdminAuditPage() {
  await requireSuperAdminPage("/dashboard/admin/audit");
  const result = await adminService.listAuditLogs(100);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform administration"
        title="Audit log"
        description="A read-only record of administrative and security events. Audit records are append-only."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration", href: "/dashboard/admin" },
          { label: "Audit log" },
        ]}
      />

      {!result.ok ? (
        <Card className="p-5 text-sm text-muted-foreground">
          {result.message}
        </Card>
      ) : result.data.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No audit events yet"
            description="Administrative and security events will be recorded here as they happen."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((log) => {
                const metadata = (log.metadata ?? {}) as Record<string, unknown>;
                const reason =
                  typeof metadata.reason === "string"
                    ? metadata.reason
                    : typeof metadata.notes === "string"
                      ? metadata.notes
                      : null;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-brand-navy">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entity_type}
                      {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.actor_id ? log.actor_id.slice(0, 8) : "system"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {reason ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
