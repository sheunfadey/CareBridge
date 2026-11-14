import Link from "next/link";

import { cn } from "cn";
import type { PermissionKey } from "@/lib/permissions/registry";
import { userHasPermission } from "@/server/auth/current-user";
import type { CurrentUser } from "@/server/auth/current-user";

const items: {
  label: string;
  segment: string;
  permissions: PermissionKey[];
}[] = [
  { label: "Overview", segment: "", permissions: ["resident_view"] },
  { label: "Residents", segment: "/residents", permissions: ["resident_view"] },
  { label: "Staff", segment: "/staff", permissions: ["staff_manage"] },
  { label: "Roster", segment: "/roster", permissions: ["shift_view", "shift_manage"] },
  { label: "Daily care", segment: "/care", permissions: ["care_record_manage"] },
  { label: "Care plans", segment: "/plans", permissions: ["resident_view"] },
  { label: "Medication", segment: "/medication", permissions: ["medication_manage"] },
  { label: "Incidents", segment: "/incidents", permissions: ["incident_view", "incident_manage"] },
  { label: "Inventory", segment: "/inventory", permissions: ["inventory_view", "inventory_manage"] },
  { label: "Expenses", segment: "/expenses", permissions: ["expense_manage", "expense_approve"] },
  { label: "Invoices", segment: "/invoices", permissions: ["invoice_view", "invoice_manage"] },
  { label: "Reports", segment: "/reports", permissions: ["care_report_view"] },
];

export function CareNav({
  user,
  organisationId,
  facilityId,
  active,
}: {
  user: CurrentUser;
  organisationId: string;
  facilityId?: string | null;
  active: string;
}) {
  const visible = items.filter((item) =>
    item.permissions.some((permission) => userHasPermission(user, permission)),
  );

  function href(segment: string) {
    const params = new URLSearchParams();
    params.set("organisation", organisationId);
    if (facilityId) params.set("facility", facilityId);
    const query = params.toString();
    return `/dashboard/care-homes${segment}${query ? `?${query}` : ""}`;
  }

  return (
    <nav
      aria-label="Care workspace"
      className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible"
    >
      {visible.map((item) => (
        <Link
          key={item.segment || "overview"}
          href={href(item.segment)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === item.segment
              ? "bg-brand-navy text-white"
              : "bg-card/70 text-muted-foreground ring-1 ring-foreground/10 hover:text-brand-strong hover:ring-brand-navy/20",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
