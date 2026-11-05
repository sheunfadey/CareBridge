import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileCogIcon, PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/server/auth/current-user";
import { listManagedCourses } from "@/server/academy/queries";

export const metadata: Metadata = {
  title: "Manage courses",
};

export default async function ManageCoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/manage");
  }

  const canCreate =
    user.isSuperAdmin || user.permissions.has("course_manage");
  const canManage =
    canCreate ||
    user.permissions.has("course_publish") ||
    user.permissions.has("learning_material_manage");

  if (!canManage) {
    redirect("/dashboard/academy");
  }

  const courses = await listManagedCourses(user);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Academy management"
        title="Manage courses"
        description="Create and edit courses, build modules and lessons, and publish when ready."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "Manage courses" },
        ]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/dashboard/academy/manage/new">
                <PlusIcon />
                New course
              </Link>
            </Button>
          ) : undefined
        }
      />

      {courses.length === 0 ? (
        <Card className="p-5 text-center">
          <FileCogIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-heading font-semibold text-brand-strong">
            No courses yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first course to build the syllabus.
          </p>
          {canCreate ? (
            <Button className="mt-4" asChild>
              <Link href="/dashboard/academy/manage/new">Create course</Link>
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Course</th>
                <th className="px-4 py-2 text-left font-medium">Programme</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Modules</th>
                <th className="px-4 py-2 text-left font-medium">Enrolments</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-strong">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.organisationName ?? "Platform"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.programmeTitle}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.moduleCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.enrolmentCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/academy/manage/${course.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
