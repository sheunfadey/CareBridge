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

const dashboardHome: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: "LayoutDashboard",
};

const communicationGroup: NavGroup = {
  label: "Communication",
  items: [
    { label: "Notifications", href: "/dashboard/notifications", icon: "Bell" },
    { label: "Messages", href: "/dashboard/messages", icon: "MessageSquare" },
  ],
};

const communityGroup: NavGroup = {
  label: "Community",
  items: [
    { label: "Referrals", href: "/dashboard/referrals", icon: "Share2" },
    { label: "Charity", href: "/dashboard/charity", icon: "HeartHandshake" },
  ],
};

const accountGroup: NavGroup = {
  label: "Account",
  items: [
    { label: "Workspace overview", href: "/dashboard/overview", icon: "LayoutDashboard" },
    { label: "Organisation", href: "/dashboard/organisation", icon: "Building2" },
    { label: "Family portal", href: "/dashboard/family", icon: "HeartHandshake" },
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    { label: "Help Centre", href: "/dashboard/help", icon: "LifeBuoy" },
  ],
};


/** Learner-first navigation. */
export const studentNav: NavSection = {
  pinned: [dashboardHome],
  groups: [
    {
      label: "Academy",
      items: [
        { label: "Academy", href: "/dashboard/academy", icon: "GraduationCap" },
        { label: "My Classroom", href: "/dashboard/academy/learning", icon: "BookOpen" },
        { label: "Browse Courses", href: "/courses", icon: "BookOpenCheck" },
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
    communityGroup,
    communicationGroup,
    accountGroup,
  ],
};

/** Work-first navigation for caregivers. Academy catalogue and internship
 * browsing are learner features and are intentionally absent here. */
export const caregiverNav: NavSection = {
  pinned: [dashboardHome],
  groups: [
    {
      label: "Care work",
      items: [
        { label: "Care workspace", href: "/dashboard/care-homes", icon: "Building2", permissions: ["resident_view"] },
        { label: "Residents", href: "/dashboard/care-homes/residents", icon: "Users", permissions: ["resident_view"] },
        { label: "Roster", href: "/dashboard/care-homes/roster", icon: "CalendarClock", permissions: ["shift_view"] },
        { label: "Daily care", href: "/dashboard/care-homes/care", icon: "ClipboardCheck", permissions: ["care_record_manage"] },
        { label: "Care plans", href: "/dashboard/care-homes/plans", icon: "HeartHandshake", permissions: ["resident_view"] },
        { label: "Medication", href: "/dashboard/care-homes/medication", icon: "Pill", permissions: ["medication_manage"] },
        { label: "Incidents", href: "/dashboard/care-homes/incidents", icon: "ShieldAlert", permissions: ["incident_view", "incident_manage"] },
        { label: "Inventory", href: "/dashboard/care-homes/inventory", icon: "Package", permissions: ["inventory_view"] },
        { label: "Invoices", href: "/dashboard/care-homes/invoices", icon: "ReceiptText", permissions: ["invoice_view"] },
      ],
    },
    {
      label: "Work",
      items: [
        { label: "Placements", href: "/dashboard/internships/placements", icon: "ClipboardCheck" },
        { label: "Jobs", href: "/dashboard/jobs", icon: "Briefcase" },
        { label: "Job applications", href: "/dashboard/jobs/applications", icon: "FileText" },
      ],
    },
    {
      label: "Training",
      items: [
        { label: "My Learning", href: "/dashboard/academy/learning", icon: "BookOpen" },
        { label: "Certificates", href: "/dashboard/academy/certificates", icon: "ShieldCheck" },
      ],
    },
    communityGroup,
    communicationGroup,
    accountGroup,
  ],
};

/** Kept as the learner navigation for any legacy imports. */
export const primaryNav = studentNav;
