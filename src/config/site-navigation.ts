export type SiteNavLink = {
  label: string;
  href: string;
  description?: string;
};

export type SiteNavGroup = {
  label: string;
  links: SiteNavLink[];
};

export const primarySiteNav: SiteNavGroup[] = [
  {
    label: "Training",
    links: [
      {
        label: "Caregiver Training",
        href: "/caregiver-training",
        description: "Structured programmes from foundations to specialist care.",
      },
      {
        label: "Courses",
        href: "/courses",
        description: "Browse programme categories and what each covers.",
      },
      {
        label: "How It Works",
        href: "/how-it-works",
        description: "The full Learn → Practise → Work pathway.",
      },
    ],
  },
  {
    label: "Careers",
    links: [
      {
        label: "Internship Opportunities",
        href: "/internships",
        description: "Supervised practical placements.",
      },
      {
        label: "Find Caregivers",
        href: "/find-caregivers",
        description: "For families and individuals seeking support.",
      },
      {
        label: "For Employers",
        href: "/for-employers",
        description: "Hire verified caregivers.",
      },
    ],
  },
  {
    label: "Organisations",
    links: [
      {
        label: "For Care Homes",
        href: "/for-care-homes",
        description: "Operations software for residential and home care.",
      },
      { label: "Referral Programme", href: "/referral-programme" },
      { label: "Charity and Scholarships", href: "/charity" },
    ],
  },
];

export const footerColumns: SiteNavGroup[] = [
  {
    label: "Platform",
    links: [
      { label: "About CareBridge", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Caregiver Training", href: "/caregiver-training" },
      { label: "Courses", href: "/courses" },
      { label: "Internships", href: "/internships" },
      { label: "Find Caregivers", href: "/find-caregivers" },
    ],
  },
  {
    label: "For Organisations",
    links: [
      { label: "For Care Homes", href: "/for-care-homes" },
      { label: "For Employers", href: "/for-employers" },
      { label: "Become a Training Partner", href: "/become-a-training-partner" },
      { label: "Become an Employer Partner", href: "/become-an-employer-partner" },
      { label: "Referral Programme", href: "/referral-programme" },
    ],
  },
  {
    label: "Give and Support",
    links: [
      { label: "Charity and Scholarships", href: "/charity" },
      { label: "Donate", href: "/donate" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Help Centre", href: "/help" },
    ],
  },
  {
    label: "Legal and Policies",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie and Privacy Preferences", href: "/cookies" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Referral Programme Terms", href: "/referral-terms" },
      { label: "Safeguarding Policy", href: "/safeguarding" },
      { label: "Accessibility Statement", href: "/accessibility" },
    ],
  },
];
