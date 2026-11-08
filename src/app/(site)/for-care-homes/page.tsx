import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  FileTextIcon,
  PackageIcon,
  ShieldAlertIcon,
  UsersIcon,
  LockIcon,
  FileSearchIcon,
  CheckCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { organisationFeatures } from "@/config/site-content";

export const metadata: Metadata = {
  title: "For Care Homes",
  description:
    "Market caregiver operations software for care homes to manage residents, staff, shifts, care records, incidents, inventory and finances with accountability.",
};

const iconMap: Record<string, typeof UsersIcon> = {
  Users: UsersIcon,
  CalendarClock: CalendarClockIcon,
  ClipboardList: ClipboardListIcon,
  ShieldAlert: ShieldAlertIcon,
  Package: PackageIcon,
  FileText: FileTextIcon,
};

export default function ForCareHomesPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="For Care Homes"
              title="Caregiver operations software built for accountability"
              description="Manage residents, staff, shifts, care records, incidents, inventory, purchases and finances in one place — with clear access control and auditable history."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to our team</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-strong">
              What you can manage
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Residents and staff records with access control",
                "Shifts and scheduling",
                "Daily care and care plans",
                "Incidents and safeguarding",
                "Inventory, purchases and expenses",
                "Invoices and reporting with append-only history",
              ].map((point) => (
                <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to run day-to-day operations"
          description="Structured tools that keep records consistent, coverage visible and actions traceable."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {organisationFeatures.map((feature) => {
            const Icon = iconMap[feature.icon] ?? CircleIcon;
            return (
              <div
                key={feature.title}
                className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                  {feature.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Built for accountability"
            title="Access control, audit logging and append-only finances"
            description="Operations need to be traceable. HillCrest keeps permissions explicit, actions logged and financial history immutable."
          />
          <div className="grid gap-4">
            {[
              {
                icon: LockIcon,
                title: "Access control",
                body: "Role-based permissions define who can view, create or change records. Access is scoped to what each role needs.",
              },
              {
                icon: FileSearchIcon,
                title: "Audit logging",
                body: "Important actions are recorded so changes can be reviewed. Activity history is traceable across users and records.",
              },
              {
                icon: CheckCircleIcon,
                title: "Append-only finances",
                body: "Financial history for purchases, expenses and invoices is append-only and auditable. Changes are not silently rewritten.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            title="Run your care home with clarity and control"
            description="Get started with HillCrest for your organisation or talk to our team about your specific needs."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Create an account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </SiteSection>
    </>
  );
}
