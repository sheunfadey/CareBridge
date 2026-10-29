import type { Metadata } from "next";
import { HeartHandshakeIcon } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/module-placeholder";

export const metadata: Metadata = {
  title: "Charity",
};

export default function CharityPage() {
  return (
    <ModulePlaceholder
      eyebrow="Charity"
      title="Scholarships and donations"
      description="Sponsor caregiver training and support learners who cannot self-fund."
      icon={HeartHandshakeIcon}
      phase="Phase 9 (Charity)"
      planned={[
        "Scholarship applications and eligibility review",
        "Donation campaigns with transparent allocation",
        "Impact reporting for donors and partners",
      ]}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Charity" },
      ]}
    />
  );
}
