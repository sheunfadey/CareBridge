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
  { label: "Overview", segment: "", permissions: [] },
  {
    label: "Campaigns",
    segment: "/campaigns",
    permissions: ["charity_campaign_manage", "charity_campaign_approve", "donor_report_view"],
  },
  {
    label: "Scholarships",
    segment: "/scholarships",
    permissions: ["scholarship_manage", "scholarship_review"],
  },
  { label: "My donations", segment: "/donations", permissions: [] },
  {
    label: "Impact",
    segment: "/impact",
    permissions: ["charity_campaign_manage", "charity_campaign_approve", "donor_report_view"],
  },
  {
    label: "Reports",
    segment: "/reports",
    permissions: ["charity_campaign_manage", "donor_report_view", "financial_report_view"],
  },
];

export function CharityNav({
  user,
  organisationId,
  active,
}: {
  user: CurrentUser;
  organisationId?: string;
  active: string;
}) {
  const visible = items.filter((item) => {
    if (item.permissions.length === 0) return true;
    if (!item.permissions.some((permission) => userHasPermission(user, permission))) {
      return false;
    }
    return true;
  });

  function href(segment: string) {
    const params = new URLSearchParams();
    if (organisationId) params.set("organisation", organisationId);
    const query = params.toString();
    return `/dashboard/charity${segment}${query ? `?${query}` : ""}`;
  }

  return (
    <nav aria-label="Charity workspace" className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <Link
          key={item.segment || "overview"}
          href={href(item.segment)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            active === item.segment
              ? "border-brand-teal bg-brand-teal/10 text-brand-strong"
              : "border-border text-muted-foreground hover:border-brand-teal/40 hover:text-brand-strong",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

