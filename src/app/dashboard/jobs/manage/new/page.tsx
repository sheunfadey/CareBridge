import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateJobForm } from "@/features/employment/components/create-job-form";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import { getEmploymentOrganisationOptions } from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "New job posting",
};

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/jobs/manage/new");
  }
  if (!userHasPermission(user, "job_manage")) {
    redirect("/dashboard/jobs");
  }

  const organisations = await getEmploymentOrganisationOptions(
    user,
    "job_manage",
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader
        eyebrow="Employment"
        title="Create a job posting"
        description="Describe the role clearly. You can save a draft and publish when it is ready."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: "Manage", href: "/dashboard/jobs/manage" },
          { label: "New" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/jobs/manage">Cancel</Link>
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <CreateJobForm organisations={organisations} />
      </Card>
    </div>
  );
}
