import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseIcon,
  FileCheckIcon,
  SearchIcon,
  UserCheckIcon,
  UsersRoundIcon,
  ClipboardListIcon,
  CalendarCheckIcon,
  MessageSquareIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { SiteHero } from "@/components/site/site-hero";

export const metadata: Metadata = {
  title: "For Employers",
  description:
    "Market hiring verified caregivers. Post vacancies, review verified candidates, manage applications, interviews and offers with honest verification workflows.",
};

const employerActions = [
  {
    icon: BriefcaseIcon,
    title: "Post vacancies",
    body: "Create and publish job openings with clear requirements, location, schedule and support needs.",
  },
  {
    icon: UserCheckIcon,
    title: "Review verified candidates",
    body: "Review caregivers whose training and competency records are completed and confirmed through defined review workflows.",
  },
  {
    icon: ClipboardListIcon,
    title: "Manage applications",
    body: "Track applications in one place and keep a clear view of each candidate's status.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Interviews",
    body: "Coordinate interviews and document feedback as part of a structured hiring process.",
  },
  {
    icon: FileCheckIcon,
    title: "Offers",
    body: "Manage offers with a traceable record of decisions and communication.",
  },
] as const;

const verificationPoints = [
  {
    icon: FileCheckIcon,
    title: "Completed training records",
    body: "Training programmes, modules and assessments that the candidate has actually finished are visible on their profile.",
  },
  {
    icon: UsersRoundIcon,
    title: "Assessed practical competency",
    body: "Competency comes from supervised placements and supervisor evaluations, recorded as part of the candidate's history.",
  },
  {
    icon: SearchIcon,
    title: "Defined review workflows",
    body: "Verification status is shown clearly and only after the relevant review step has been completed. Nothing is inferred or assumed.",
  },
];

export default function ForEmployersPage() {
  return (
    <>
      <SiteSection>
        <SiteHero
          tone="sky"
          eyebrow="For employers"
          title="Hire verified caregivers"
          highlight="with confidence."
          description="Post vacancies, review verified candidates and manage applications, interviews and offers — backed by training and competency records you can actually check."
          actions={
            <>
              <Button
                size="lg"
                className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90"
                asChild
              >
                <Link href="/register">Get started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-brand-navy/15 bg-white/60"
                asChild
              >
                <Link href="/contact">Talk to our team</Link>
              </Button>
            </>
          }
          aside={
            <div className="rounded-[var(--radius-2xl)] bg-white/70 p-5 ring-1 ring-brand-navy/5 dark:bg-card/70">
              <p className="font-heading text-sm font-semibold text-brand-strong">
                Built for hiring teams
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  "Care homes and residential providers",
                  "Home care agencies",
                  "Recruiters placing caregivers",
                  "Organisations needing verified care staff",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-sm text-brand-navy/70 dark:text-foreground/70"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          }
        />
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="What employers can do"
          title="A structured hiring workflow"
          description="Keep every step of hiring traceable, from posting to offer."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {employerActions.map((item) => (
            <li
              key={item.title}
              className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <item.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </SiteSection>

      <SiteSection tone="sky">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Verification you can rely on"
            title="Honest explanation of review workflows"
            description="Verification on HillCrest means specific things. We describe them plainly so you can make informed decisions."
          />
          <div className="grid gap-4">
            {verificationPoints.map((point) => (
              <div
                key={point.title}
                className="flex gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <point.icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {point.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{point.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 rounded-xl border border-brand-teal/20 bg-card p-6 shadow-card">
          <p className="font-heading font-semibold text-brand-strong">
            What verification is not
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Verification is not a guarantee of performance or a substitute for your own interview process, references and safeguarding checks. It means the records shown have been completed and reviewed through defined workflows.
          </p>
        </div>
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="For recruiters and care agencies"
            title="Place verified caregivers efficiently"
            description="Care agencies and recruiters can manage placements with visibility into training and competency history, keeping records consistent across candidates and clients."
          />
          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <MessageSquareIcon className="size-5" />
              </span>
              <p className="font-heading text-lg font-semibold text-brand-strong">
                Talk to us about your needs
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Whether you are placing for one client or managing a roster, we can talk through how to structure your workflow on HillCrest.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            title="Hire with records you can trust"
            description="Start hiring on HillCrest or talk to our team about setting up your organisation."
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
