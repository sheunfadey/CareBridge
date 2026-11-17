import type { Metadata } from "next";

import { AccountSettings } from "@/features/account/components/account-settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return <AccountSettings basePath="/dashboard" />;
}
