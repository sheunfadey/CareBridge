import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/server/auth/current-user";
import { getMyLearning } from "@/server/academy/queries";

export const metadata: Metadata = {
  title: "My Learning",
};

type MyLearningPageProps = {
  searchParams: Promise<{ payment?: string; reference?: string }>;
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

export default async function MyLearningPage({
  searchParams,
}: MyLearningPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/learning");
  }

  const { payment } = await searchParams;
  const notice = payment ? paymentNotices[payment] : null;
  const learning = await getMyLearning(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academy"
        title="My Learning"
        description="Resume courses where you left off and review completed ones."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "My Learning" },
        ]}
        actions={
          <Button variant="outline" asChild>
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

      {learning.length === 0 ? (
        <Card className="p-6 text-center">
          <BookOpenIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-heading font-semibold text-brand-strong">
            You are not enrolled in any courses yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enrol in a published course to start learning.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {learning.map((course) => {
            const progress = course.totalLessons
              ? Math.round((course.completedLessons / course.totalLessons) * 100)
              : 0;
            return (
              <Card key={course.enrolmentId} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading font-semibold text-brand-strong">
                      {course.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.summary}
                    </p>
                  </div>
                  <StatusBadge status={course.status} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {course.completedLessons} / {course.totalLessons} lessons
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-brand-teal transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/dashboard/academy/learning/${course.courseId}`}>
                      {course.status === "completed"
                        ? "Review course"
                        : "Continue learning"}
                    </Link>
                  </Button>
                  {course.status === "completed" && course.certificateCode ? (
                    <Button variant="outline" asChild>
                      <Link href={`/verify-certificate/${course.certificateCode}`}>
                        View certificate
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
