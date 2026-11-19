import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrainerDashboard } from "@/features/trainer/components/trainer-dashboard";
import {
  isTrainerAccount,
  getCurrentUser,
} from "@/server/auth/current-user";
import { getTrainerDashboardData } from "@/server/trainer/queries";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function TrainerHomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=%2Ftrainer");
  }

  if (!isTrainerAccount(user)) {
    redirect("/dashboard");
  }

  const name =
    user.fullName ??
    user.email.split("@")[0]?.replace(/[._-]+/g, " ") ??
    "there";

  return (
    <TrainerDashboard
      user={{ name }}
      data={await getTrainerDashboardData(user)}
    />
  );
}
