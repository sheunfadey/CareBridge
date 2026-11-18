import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  listCourseCategories,
  managedOrganisationOptions,
} from "@/server/academy/queries";
import { CourseCategoryDialog } from "@/features/academy/components/course-category-dialog";
import { CourseCategoryToggle } from "@/features/academy/components/course-category-toggle";
import type { StudioBase } from "@/features/academy/studio/base";

export async function CourseCategoriesPage({ base }: { base: StudioBase }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(`${base.manageHref}/categories`)}`,
    );
  }

  if (!user.isSuperAdmin && !user.permissions.has("course_manage")) {
    redirect(base.academyHref);
  }

  const [categories, organisations] = await Promise.all([
    listCourseCategories(user),
    Promise.resolve(managedOrganisationOptions(user)),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-6">
      <PageHeader
        eyebrow={base.eyebrow}
        title="Course categories"
        description="Group courses for the catalogue. Platform categories are shared; organisation categories are scoped to your workspace."
        breadcrumbs={[
          { label: base.homeLabel, href: base.homeHref },
          { label: "Course Studio", href: base.manageHref },
          { label: "Categories" },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={base.manageHref}>
                <ArrowLeftIcon />
                Back to courses
              </Link>
            </Button>
            <CourseCategoryDialog
              organisations={organisations}
              isSuperAdmin={user.isSuperAdmin}
            >
              <Button>
                <PlusIcon />
                New category
              </Button>
            </CourseCategoryDialog>
          </>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="border-b p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}{" "}
            available. Archived categories stay attached to existing courses but
            cannot be selected for new ones.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No categories yet. Create one to start grouping courses.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-brand-strong">
                      {category.name}
                    </p>
                    <Badge variant="outline">
                      {category.organisationName ?? "Platform"}
                    </Badge>
                    <StatusBadge
                      status={category.isActive ? "active" : "archived"}
                      label={category.isActive ? "Active" : "Archived"}
                    />
                  </div>
                  {category.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Order {category.sortOrder} · {category.slug}
                  </p>
                </div>
                {category.canManage ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <CourseCategoryDialog
                      organisations={organisations}
                      isSuperAdmin={user.isSuperAdmin}
                      category={category}
                    >
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </CourseCategoryDialog>
                    <CourseCategoryToggle
                      categoryId={category.id}
                      active={category.isActive}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
