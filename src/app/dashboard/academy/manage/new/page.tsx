import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  listCourseCategories,
  listProgrammeOptions,
  managedOrganisationOptions,
} from "@/server/academy/queries";
import { CreateCourseForm } from "@/features/academy/components/create-course-form";

export const metadata: Metadata = {
  title: "New course",
};

export default async function NewCoursePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/manage/new");
  }

  if (!user.isSuperAdmin && !user.permissions.has("course_manage")) {
    redirect("/dashboard/academy");
  }

  const [programmes, categories] = await Promise.all([
    listProgrammeOptions(),
    listCourseCategories(user),
  ]);
  const organisations = managedOrganisationOptions(user);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Academy management"
        title="New course"
        description="Create a draft course. After creating it, add modules and lessons, then upload PDFs, documents, audio, video, images, ZIP archives or links from Learning resources."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "Manage courses", href: "/dashboard/academy/manage" },
          { label: "New course" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/academy/manage">Back to courses</Link>
          </Button>
        }
      />

      {programmes.length === 0 ? (
        <Alert tone="warning">
          <AlertTitle>No programme available</AlertTitle>
          <AlertDescription>
            A course must belong to an active programme. Apply the Academy
            migrations and seed, or ask a platform administrator to create a
            programme.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="p-5">
        <CreateCourseForm
          programmes={programmes}
          organisations={organisations}
          categories={categories}
        />
      </Card>
    </div>
  );
}
