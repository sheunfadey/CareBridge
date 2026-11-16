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
      label: "Academy",
      items: [
        { label: "Course Studio", href: "/dashboard/academy/manage", icon: "FileCog" },
        { label: "Categories", href: "/dashboard/academy/manage/categories", icon: "Tags" },
        { label: "Learners", href: "/dashboard/trainer/learners", icon: "Users" },
        { label: "Assessments", href: "/dashboard/trainer/assessments", icon: "ClipboardList" },
        { label: "Gradebook", href: "/dashboard/trainer/gradebook", icon: "ClipboardCheck" },
        { label: "Certificates", href: "/dashboard/trainer/certificates", icon: "Award" },
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

const studentAccountGroup: NavGroup = {
  label: "Account",
  items: [
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    { label: "Help Centre", href: "/dashboard/help", icon: "LifeBuoy" },
  ],
};

const caregiverAccountGroup: NavGroup = {
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
        { label: "My Courses", href: "/dashboard/academy/courses", icon: "BookOpenCheck" },
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
    studentAccountGroup,
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
      label: "Course Studio",
      items: [
        { label: "Manage courses", href: "/dashboard/academy/manage", icon: "FileCog", permissions: ["course_manage", "course_publish", "learning_material_manage"] },
        { label: "Categories", href: "/dashboard/academy/manage/categories", icon: "Tags", permissions: ["course_manage"] },
        { label: "Learners", href: "/dashboard/trainer/learners", icon: "Users", permissions: ["course_manage", "course_publish", "learning_material_manage"] },
        { label: "Assessments", href: "/dashboard/trainer/assessments", icon: "ClipboardList", permissions: ["assessment_manage", "assessment_grade", "course_manage"] },
        { label: "Gradebook", href: "/dashboard/trainer/gradebook", icon: "ClipboardCheck", permissions: ["assessment_grade", "assessment_manage", "course_manage"] },
        { label: "Certificates", href: "/dashboard/trainer/certificates", icon: "Award", permissions: ["course_manage", "course_publish"] },
      ],
    },
    communityGroup,
    communicationGroup,
    caregiverAccountGroup,
  ],
};

const trainerAccountGroup: NavGroup = {
  label: "Account",
  items: [
    { label: "Workspace overview", href: "/dashboard/overview", icon: "LayoutDashboard" },
    { label: "Organisation", href: "/dashboard/organisation", icon: "Building2" },
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    { label: "Help Centre", href: "/dashboard/help", icon: "LifeBuoy" },
  ],
};

/** Course creation, assessment and learner-performance navigation for trainers. */
export const trainerNav: NavSection = {
  pinned: [{ label: "Trainer studio", href: "/dashboard", icon: "Presentation" }],
  groups: [
    {
      label: "Course Studio",
      items: [
        { label: "Manage courses", href: "/dashboard/academy/manage", icon: "FileCog", permissions: ["course_manage", "course_publish", "learning_material_manage"] },
        { label: "New course", href: "/dashboard/academy/manage/new", icon: "PlusCircle", permissions: ["course_manage"] },
        { label: "Categories", href: "/dashboard/academy/manage/categories", icon: "Tags", permissions: ["course_manage"] },
      ],
    },
    {
      label: "Learner performance",
      items: [
        { label: "Learners", href: "/dashboard/trainer/learners", icon: "Users", permissions: ["course_manage", "course_publish", "learning_material_manage"] },
        { label: "Assessments", href: "/dashboard/trainer/assessments", icon: "ClipboardList", permissions: ["assessment_manage", "assessment_grade", "course_manage"] },
        { label: "Gradebook", href: "/dashboard/trainer/gradebook", icon: "ClipboardCheck", permissions: ["assessment_grade", "assessment_manage", "course_manage"] },
        { label: "Certificates", href: "/dashboard/trainer/certificates", icon: "Award", permissions: ["course_manage", "course_publish"] },
        { label: "Reports", href: "/dashboard/reports", icon: "BarChart3", permissions: ["report_view"] },
      ],
    },
    communicationGroup,
    trainerAccountGroup,
  ],
};

/** Kept as the learner navigation for any legacy imports. */
export const primaryNav = studentNav;
