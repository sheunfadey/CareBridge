import type { Metadata } from "next";

import { AccountSettings } from "@/features/account/components/account-settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default function TrainerSettingsPage() {
  return (
    <AccountSettings
      basePath="/trainer"
      homeLabel="Trainer home"
      showOrganisations={false}
    />
  );
}
