import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClipboardCheckIcon,
  HeartHandshakeIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { SiteHero } from "@/components/site/site-hero";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "The HillCrest pathway: learn, practise, get verified and work — with care operations and charity support alongside.",
};

const stages = [
  {
    icon: BookOpenIcon,
    title: "Learn",
    body: "Enrol in a structured programme. Work through modules and lessons, then complete assessments that record your understanding.",
    points: ["Structured modules", "Lesson materials", "Assessments"],
  },
  {
    icon: ClipboardCheckIcon,
    title: "Practise",
    body: "Apply what you have learned through supervised internships and placements, with competency recorded as you go.",
    points: ["Supervised placements", "Evaluations", "Practical competency"],
  },
  {
    icon: BadgeCheckIcon,
    title: "Get verified",
    body: "Your training and competency records are held against your profile, and verification is carried out through defined review workflows.",
    points: ["Verified records", "Review workflows", "Transparent status"],
  },
  {
    icon: BriefcaseIcon,
    title: "Work",
    body: "Connect with employers and care homes. Post or apply for roles, and manage applications, interviews and offers in one place.",
    points: ["Job marketplace", "Applications", "Interviews and offers"],
  },
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <SiteSection>
        <SiteHero
          eyebrow="How it works"
          title="A pathway from learning"
          highlight="to working."
          description="HillCrest is built as a sequence of connected stages, so that each step builds on the last and nothing is left to chance."
          actions={
            <>
              <Button
                size="lg"
                className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90"
                asChild
              >
                <Link href="/courses">Browse courses</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-brand-navy/15 bg-white/60"
                asChild
              >
                <Link href="/register">Create an account</Link>
              </Button>
            </>
          }
        />
      </SiteSection>

      <SiteSection>
        <ol className="grid gap-6 md:grid-cols-4">
          {stages.map((stage, index) => (
            <li
              key={stage.title}
              className="relative rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
            >
              <span className="absolute right-5 top-5 font-heading text-3xl font-semibold text-brand-teal/20">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
              >
                <stage.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {stage.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stage.body}</p>
              <ul className="mt-4 space-y-1.5">
                {stage.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-brand-green" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </SiteSection>

      <SiteSection tone="sky">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Alongside the pathway"
            title="Operations and support that hold it together"
            description="Care homes run their operations on HillCrest, and the charity widens access so that cost is not a barrier to starting."
          />
          <div className="grid gap-4">
            {[
              { icon: HeartHandshakeIcon, title: "Charity and scholarships", body: "Funded places and scholarships for those who need them.", href: "/charity" },
              { icon: BriefcaseIcon, title: "Care-home operations", body: "Residents, staff, shifts, care plans, incidents and reporting.", href: "/for-care-homes" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-[var(--radius-2xl)] bg-card/85 p-5 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
                >
                  <item.icon className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-heading font-semibold text-brand-strong">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-block text-sm font-medium text-brand-teal underline-offset-4 hover:underline"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            align="center"
            title="Start your pathway today"
            description="Begin with training, or reach out to partner with HillCrest."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/caregiver-training">Explore Training</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/for-employers">For Employers</Link>
            </Button>
          </div>
        </div>
      </SiteSection>
    </>
  );
}
