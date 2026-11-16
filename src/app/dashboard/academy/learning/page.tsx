import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon, GraduationCapIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AcademyCourseCard } from "@/features/academy/components/academy-course-card";
import { PortalSection } from "@/features/portal/components/portal-ui";
import { getCurrentUser } from "@/server/auth/current-user";
import { getMyLearning } from "@/server/academy/queries";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  return {
    title: user?.activePortal === "caregiver" ? "My Learning" : "My Classroom",
  };
}

type MyLearningPageProps = {
  searchParams: Promise<{ payment?: string; reference?: string; status?: string }>;
};

const paymentNotices: Record<
  string,
  { tone: "success" | "warning" | "error" | "info"; title: string; body: string }
> = {
  success: {
    tone: "success",
    title: "Payment confirmed",
    body: "Your payment was verified and your enrolment is active.",
  },
  pending: {
    tone: "info",
    title: "Payment pending",
    body: "The provider has not confirmed this payment yet. Refresh in a moment or check your payment history.",
  },
  review: {
    tone: "warning",
    title: "Payment flagged for review",
    body: "The confirmed amount did not match the expected amount. Nothing was unlocked; support will review it.",
  },
  failed: {
    tone: "error",
    title: "Payment not completed",
    body: "The provider did not confirm a successful payment. You can try again from the course page.",
  },
  missing: {
    tone: "error",
    title: "Missing payment reference",
    body: "The payment return did not include a reference, so nothing could be verified.",
  },
};

const filters = [
  { key: "all", label: "All courses" },
  { key: "active", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;

export default async function MyLearningPage({
  searchParams,
}: MyLearningPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/learning");
  }

  const learningLabel =
    user.activePortal === "caregiver" ? "My Learning" : "My Classroom";
  const { payment, status } = await searchParams;
  const notice = payment ? paymentNotices[payment] : null;
  const learning = await getMyLearning(user.id);
  const filter =
    status === "active" || status === "completed" ? status : "all";
  const visible =
    filter === "all"
      ? learning
      : learning.filter((course) => course.status === filter);
  const activeCount = learning.filter((course) => course.status === "active").length;
  const completedCount = learning.filter(
    (course) => course.status === "completed",
  ).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Academy"
        title={learningLabel}
        description="Resume courses where you left off and review completed ones."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: learningLabel },
        ]}
        actions={
          <Button
            variant="outline"
            className="rounded-full border-brand-navy/15 bg-card/70"
            asChild
          >
            <Link href="/courses">Browse catalogue</Link>
          </Button>
        }
      />

      {notice ? (
        <Alert tone={notice.tone}>
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.body}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item.key === "all"
              ? learning.length
              : item.key === "active"
                ? activeCount
                : completedCount;
          const active = filter === item.key;
          return (
            <Link
              key={item.key}
              href={
                item.key === "all"
                  ? "/dashboard/academy/learning"
                  : `/dashboard/academy/learning?status=${item.key}`
              }
              className={
                active
                  ? "inline-flex items-center gap-1.5 rounded-full bg-brand-navy px-3.5 py-1.5 text-xs font-semibold text-white"
                  : "inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-brand-strong ring-1 ring-foreground/10 transition hover:bg-card"
              }
            >
              {item.label}
              <span
                className={
                  active
                    ? "rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]"
                    : "rounded-full bg-brand-navy/5 px-1.5 py-0.5 text-[10px]"
                }
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {learning.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
          <BookOpenIcon className="mx-auto size-9 text-portal-lavender-strong" />
          <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
            You are not enrolled in any courses yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Enrol in a published course to start learning.
          </p>
          <Button className="mt-4 rounded-full" asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
          <GraduationCapIcon className="mx-auto size-8 text-portal-mint-strong" />
          <p className="mt-2 font-heading font-semibold text-brand-strong">
            Nothing in this view yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "completed"
              ? "Completed courses will appear here."
              : "Courses you enrol in will appear here."}
          </p>
        </div>
      ) : (
        <PortalSection>
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((course, index) => (
              <AcademyCourseCard
                key={course.enrolmentId}
                course={course}
                index={index}
              />
            ))}
          </div>
        </PortalSection>
      )}
    </div>
  );
}
