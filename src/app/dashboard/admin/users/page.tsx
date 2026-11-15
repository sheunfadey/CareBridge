import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { AccountActions } from "@/features/admin/components/account-actions";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import { adminService } from "@/server/admin/admin-service";

export const metadata: Metadata = {
  title: "User management",
};

export default async function AdminUsersPage() {
  const user = await requireSuperAdminPage("/dashboard/admin/users");
  const result = await adminService.listProfiles({ limit: 100 });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <AdminPageHeader
        eyebrow="Platform administration"
        title="User management"
        description="Review accounts and control account status. Every change is recorded in the audit log."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration", href: "/dashboard/admin" },
          { label: "Users" },
        ]}
      />

      {!result.ok ? (
        <Card className="p-4 text-sm text-muted-foreground">
          {result.message}
        </Card>
      ) : result.data.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No accounts yet"
            description="Accounts will appear here once users register."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Super admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <span className="block text-sm font-medium text-brand-strong">
                      {profile.full_name ?? "—"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {profile.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">
                    {profile.account_type?.replaceAll("_", " ") ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={profile.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {profile.is_super_admin ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AccountActions
                      userId={profile.id}
                      userName={profile.full_name ?? profile.email}
                      status={profile.status}
                      isSelf={profile.id === user.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
