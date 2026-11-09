import type { PermissionKey } from "@/lib/permissions/registry";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  /** Only shown to platform super administrators. */
  superAdminOnly?: boolean;
  /** Visible to super administrators or users holding any of these permissions. */
  permissions?: PermissionKey[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavSection = {
  /** Always visible at the top of the sidebar, outside the collapsible groups. */
  pinned: NavItem[];
  groups: NavGroup[];
};

export const superAdminNav: NavSection = {
  pinned: [
    {
      label: "Platform overview",
      href: "/dashboard/admin",
      icon: "LayoutDashboard",
    },
  ],
  groups: [
    {
      label: "Communication",
      items: [
        { label: "Notifications", href: "/dashboard/notifications", icon: "Bell" },
        {
          label: "Support inbox",
          href: "/dashboard/messages",
          icon: "MessageSquare",
        },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Organisations", href: "/dashboard/admin/organisations", icon: "Building2" },
        { label: "Users", href: "/dashboard/admin/users", icon: "Users" },
        { label: "Subscriptions & plans", href: "/dashboard/admin/subscriptions", icon: "CreditCard" },
        { label: "Payments", href: "/dashboard/admin/payments", icon: "Wallet" },
        { label: "Payment gateway", href: "/dashboard/admin/payments/gateway", icon: "PlugZap" },
        { label: "Reconciliation", href: "/dashboard/admin/reconciliation", icon: "Scale" },
        { label: "System & APIs", href: "/dashboard/admin/system", icon: "Activity" },
        { label: "Audit log", href: "/dashboard/admin/audit", icon: "ScrollText" },
        { label: "Platform settings", href: "/dashboard/admin/settings", icon: "Settings" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
        { label: "Help Centre", href: "/dashboard/help", icon: "LifeBuoy" },
      ],
    },
  ],
};

export const primaryNav: NavSection = {
  pinned: [{ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }],
  groups: [
    {
      label: "Communication",
      items: [
        { label: "Notifications", href: "/dashboard/notifications", icon: "Bell" },
        { label: "Messages", href: "/dashboard/messages", icon: "MessageSquare" },
      ],
    },
    {
      label: "Academy",
      items: [
        { label: "Academy", href: "/dashboard/academy", icon: "GraduationCap" },
        { label: "My Learning", href: "/dashboard/academy/learning", icon: "BookOpen" },
        { label: "Browse Courses", href: "/courses", icon: "BookOpenCheck" },
        { label: "Manage Courses", href: "/dashboard/academy/manage", icon: "FileCog", permissions: ["course_manage"] },
        { label: "Categories", href: "/dashboard/academy/manage/categories", icon: "Tags", permissions: ["course_manage"] },
        { label: "Certificates", href: "/dashboard/academy/certificates", icon: "ShieldCheck" },
      ],
    },
    {
      label: "Career",
      items: [
        { label: "Internships", href: "/dashboard/internships", icon: "BriefcaseBusiness" },
        { label: "Jobs", href: "/dashboard/jobs", icon: "Briefcase" },
        { label: "Internship applications", href: "/dashboard/internships/applications", icon: "ClipboardList" },
        { label: "Job applications", href: "/dashboard/jobs/applications", icon: "FileText" },
        { label: "Placements", href: "/dashboard/internships/placements", icon: "ClipboardCheck" },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Care Homes", href: "/dashboard/care-homes", icon: "Building2" },
        { label: "Referrals", href: "/dashboard/referrals", icon: "Share2" },
        { label: "Charity", href: "/dashboard/charity", icon: "HeartHandshake" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Organisation", href: "/dashboard/organisation", icon: "Building2" },
        { label: "Family portal", href: "/dashboard/family", icon: "HeartHandshake" },
        { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
        { label: "Help Centre", href: "/dashboard/help", icon: "LifeBuoy" },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          label: "Payments",
          href: "/dashboard/admin/payments",
          icon: "CreditCard",
          permissions: ["payment_review"],
        },
        {
          label: "Reconciliation",
          href: "/dashboard/admin/reconciliation",
          icon: "Scale",
          permissions: ["payment_review"],
        },
        {
          label: "Referral administration",
          href: "/dashboard/admin/referrals",
          icon: "BadgeDollarSign",
          permissions: [
            "referral_rules_manage",
            "commission_approve",
            "payout_approve",
          ],
        },
        {
          label: "Subscriptions",
          href: "/dashboard/admin/subscriptions",
          icon: "CreditCard",
          permissions: ["billing_manage"],
        },
        {
          label: "Reports",
          href: "/dashboard/reports",
          icon: "BarChart3",
          permissions: ["report_view"],
        },
      ],
    },
    {
      label: "Platform",
      items: [
        {
          label: "Administration",
          href: "/dashboard/admin",
          icon: "ShieldCheck",
          superAdminOnly: true,
        },
      ],
    },
  ],
};
