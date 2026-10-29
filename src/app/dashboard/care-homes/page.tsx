import type { Metadata } from "next";
import { Building2Icon } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/module-placeholder";

export const metadata: Metadata = {
  title: "Care homes",
};

export default function CareHomesPage() {
  return (
    <ModulePlaceholder
      eyebrow="Operations"
      title="Care homes"
      description="Manage care home profiles, teams, shifts and care operations."
      icon={Building2Icon}
      phase="Phase 6 (Care Operations)"
      planned={[
        "Care home profiles, rooms and occupancy",
        "Team rosters, shift handovers and care plans",
        "Incident reporting and compliance reviews",
      ]}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Care homes" },
      ]}
    />
  );
}
