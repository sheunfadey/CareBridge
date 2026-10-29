import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateInternshipForm } from "@/features/employment/components/create-internship-form";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import { getEmploymentOrganisationOptions } from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "New placement",
};

export default async function NewInternshipPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/internships/manage/new");
  }
  if (!userHasPermission(user, "internship_manage")) {
    redirect("/dashboard/internships");
  }

  const organisations = await getEmploymentOrganisationOptions(
    user,
    "internship_manage",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Internships"
        title="Create a placement"
        description="Describe the supervised placement. You can save a draft and open it when ready."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          { label: "Manage", href: "/dashboard/internships/manage" },
          { label: "New" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/internships/manage">Cancel</Link>
          </Button>
        }
      />

      <Card className="p-5 sm:p-6">
        <CreateInternshipForm organisations={organisations} />
      </Card>
    </div>
  );
}
