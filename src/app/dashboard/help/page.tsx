import type { Metadata } from "next";

import { HelpCentre } from "@/features/support/components/help-centre";

export const metadata: Metadata = {
  title: "Help centre",
};

export default function DashboardHelpPage() {
  return <HelpCentre />;
}
