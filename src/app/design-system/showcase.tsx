"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BriefcaseIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  HeartHandshakeIcon,
  UsersIcon,
} from "lucide-react";

import { HillCrestLogo } from "@/components/brand/carebridge-logo";
import { LogoMark } from "@/components/brand/logo-mark";
import { AnimatedHillCrestLogo } from "@/components/brand/animated-carebridge-logo";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, statusToneMap } from "@/components/ui/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/dashboard/alert-card";
import { ActionCard } from "@/components/dashboard/action-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { PageLoadingSkeleton } from "@/components/feedback/page-loading-skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineLoadingIndicator } from "@/components/feedback/inline-loading-indicator";
import { brand } from "@/config/brand";

const paletteTokens = [
  ["Primary navy", "brand-navy", brand.colors.navy],
  ["Primary blue", "brand-blue", brand.colors.blue],
  ["Bright blue", "brand-bright-blue", brand.colors.brightBlue],
  ["Care green", "brand-green", brand.colors.green],
  ["Deep green", "brand-deep-green", brand.colors.deepGreen],
  ["Light green", "brand-light-green", brand.colors.lightGreen],
  ["Light background", "brand-ivory", brand.colors.ivory],
  ["Primary text", "brand-ink", brand.colors.ink],
  ["Secondary text", "brand-slate", brand.colors.slate],
  ["Warning", "brand-warning", brand.colors.warning],
  ["Error", "brand-error", brand.colors.error],
  ["Success", "brand-success", brand.colors.success],
  ["Deep navy", "brand-dark-surface", brand.colors.darkSurface],
] as const;

const typeScale = [
  { name: "Display", className: "text-4xl font-semibold", sample: "Build a career in care" },
  { name: "Page title", className: "text-2xl font-semibold", sample: "Dashboard overview" },
  { name: "Section", className: "text-lg font-semibold", sample: "Featured programmes" },
  { name: "Card heading", className: "text-base font-medium", sample: "Active learners" },
  { name: "Body", className: "text-sm", sample: "Courses combine theory with supervised practical experience." },
  { name: "Caption", className: "text-xs text-muted-foreground", sample: "Updated 4 minutes ago" },
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Phase 1"
        title="HillCrest design system"
        description="Central design tokens, brand assets and reusable components. Every surface in the platform draws from these primitives instead of hard-coded values."
        breadcrumbs={[{ label: "Design system" }]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        }
      />

      <Section
        title="Brand identity"
        description="Logo variants across light, dark and monochrome contexts."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex items-center justify-center p-8">
            <HillCrestLogo variant="full" size="lg" showTagline />
          </Card>
          <Card className="flex items-center justify-center bg-brand-navy p-8">
            <HillCrestLogo variant="full" size="lg" tone="onDark" />
          </Card>
          <Card className="flex items-center justify-center p-8 text-brand-strong">
            <HillCrestLogo variant="stacked" size="md" tone="mono" />
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
          <Card className="flex flex-col items-center justify-center gap-4 p-8">
            <div className="flex items-end gap-6 text-brand-strong">
              <LogoMark size={20} />
              <LogoMark size={28} />
              <LogoMark size={40} />
              <LogoMark size={56} />
            </div>
            <p className="text-xs text-muted-foreground">
              Icon-only mark at multiple sizes
            </p>
          </Card>
          <Card className="flex items-center justify-center bg-brand-dark p-8">
            <AnimatedHillCrestLogo size="lg" tone="onDark" />
          </Card>
        </div>
      </Section>

      <Section
        title="Colour palette"
        description="Official design tokens. Colour is never the only signal for status."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paletteTokens.map(([label, token, hex]) => (
            <div
              key={token}
              className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="size-11 shrink-0 rounded-lg ring-1 ring-foreground/10"
                style={{ backgroundColor: hex }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-strong">{label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {hex} · {token}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography" description="Inter for interface text, with a clear scale.">
        <Card className="divide-y divide-border p-0">
          {typeScale.map((row) => (
            <div
              key={row.name}
              className="flex flex-col gap-1 p-5 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {row.name}
              </span>
              <span className={`${row.className} text-brand-strong`}>
                {row.sample}
              </span>
            </div>
          ))}
        </Card>
      </Section>

      <Section
        title="Buttons, forms and badges"
        description="Accessible primitives with visible focus states."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Icon button">
                <HeartHandshakeIcon />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" />
              <StatusBadge status="pending" />
              <StatusBadge status="processing" />
              <StatusBadge status="approved" />
              <StatusBadge status="overdue" />
              <StatusBadge status="reversed" />
              <StatusBadge status="draft" />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="ds-email">Email address</Label>
              <Input id="ds-email" type="email" placeholder="name@example.com" />
              <p className="text-xs text-muted-foreground">
                We never expose secret keys to the browser.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-disabled">Disabled input</Label>
              <Input id="ds-disabled" placeholder="Unavailable" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-invalid">Invalid input</Label>
              <Input id="ds-invalid" aria-invalid defaultValue="not-an-email" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Progress</Label>
              <Progress value={68} aria-label="Sample progress: 68 percent" />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Feedback and states" description="Loading, empty, error and inline indicators.">
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            icon={BriefcaseIcon}
            title="No placements yet"
            description="Internship placements will appear here once approved."
            action={
              <Button size="sm" variant="outline">
                Find placements
              </Button>
            }
          />
          <ErrorState
            title="Could not load records"
            description="Check your connection and try again."
            action={
              <Button size="sm" variant="outline">
                Retry
              </Button>
            }
          />
          <Card className="flex flex-col items-center justify-center gap-4 p-6">
            <InlineLoadingIndicator label="Saving changes" />
            <div className="w-full space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        </div>
        <Card className="p-5">
          <p className="mb-4 text-sm font-medium text-brand-strong">
            Page loading skeleton
          </p>
          <PageLoadingSkeleton cards={4} rows={3} />
        </Card>
      </Section>

      <Section title="Dashboard cards" description="Shared metric, progress, status and action cards.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active learners"
            value="1,284"
            icon={<UsersIcon />}
            trend={{ value: 12 }}
            hint="Compared with last month"
          />
          <MetricCard
            label="Pending payouts"
            value="—"
            icon={<BriefcaseIcon />}
            empty
            hint="No payout requests awaiting review"
          />
          <MetricCard
            label="Reconciliation"
            value="3"
            icon={<CalendarClockIcon />}
            loading
          />
          <MetricCard
            label="Compliance"
            value="98%"
            icon={<CircleCheckIcon />}
            status={{ status: "verified" }}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ProgressCard
            title="Course completion"
            value={72}
            caption="Across published programmes"
          />
          <ProgressCard title="Staff training compliance" value={45} loading />
          <StatusCard
            title="Placement summary"
            status={{ status: "in_progress" }}
            records={[
              { label: "Active placements", value: "18" },
              { label: "Awaiting evaluation", value: "4" },
              { label: "Completed this month", value: "9" },
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Review organisation"
            description="Verify a training provider or care home."
            icon={HeartHandshakeIcon}
            actionLabel="Open queue"
          />
          <ActionCard
            title="Approve payout"
            description="Requires finance privileges and separation of duties."
            icon={BriefcaseIcon}
            actionLabel="Review"
            disabled
          />
          <AlertCard
            tone="warning"
            title="Finance approval required"
            description="A payout request cannot be approved by the same user who requested it."
          />
        </div>
      </Section>

      <Section title="Alerts" description="Four semantic tones with icon and text.">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert variant="info">
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Design tokens are the single source of truth for colour.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Verified</AlertTitle>
            <AlertDescription>This organisation passed verification.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Document expiring</AlertTitle>
            <AlertDescription>A staff document expires in 14 days.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Payment failed</AlertTitle>
            <AlertDescription>
              The transfer was not completed. No retry attempted.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Statuses" description="Every lifecycle status maps to a tone and label.">
        <Card className="flex flex-wrap gap-2 p-5">
          {Object.keys(statusToneMap).map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </Card>
      </Section>

      <Section title="Toasts" description="Sonner mounted root-level for consistent feedback.">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => toast.success("Saved successfully")}>
            Show success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Something went wrong")}
          >
            Show error toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("This action is wired up in a later phase.")}
          >
            Show info toast
          </Button>
        </div>
      </Section>
    </div>
  );
}
