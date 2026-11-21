import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheckIcon,
  ClipboardListIcon,
  FileCheckIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { SiteHero } from "@/components/site/site-hero";

export const metadata: Metadata = {
  title: "Find Caregivers",
  description:
    "How HillCrest helps families and individuals find caregivers, what caregiver verification actually means, and how to get started with care support.",
};

const howItWorks = [
  {
    icon: SearchIcon,
    title: "Share your requirements",
    body: "Tell us the kind of support you need, the setting, the schedule and anything the caregiver should know before starting.",
  },
  {
    icon: UsersRoundIcon,
    title: "Review caregiver profiles",
    body: "Look through caregivers whose training and competency records have been completed and confirmed through our review workflows.",
  },
  {
    icon: FileCheckIcon,
    title: "Agree the details of care",
    body: "Discuss tasks, hours, rates and expectations directly, and document what has been agreed before care begins.",
  },
] as const;

const verificationPoints = [
  {
    icon: ClipboardListIcon,
    title: "Completed training records",
    body: "Programmes, modules and assessment results that the caregiver has actually finished are held against their profile.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Assessed practical competency",
    body: "Competency comes from supervised placements and supervisor evaluations, not from self-declared experience.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Documented review",
    body: "Verification status is shown clearly and only after the relevant review step has been completed.",
  },
] as const;

export default function FindCaregiversPage() {
  return (
    <>
            <SiteSection>
        <SiteHero
          tone="peach"
          eyebrow="For families and individuals"
          title="Find caregivers"
          highlight="you can actually check."
          description="Caregivers on HillCrest build a record of completed training, supervised practice and verified competency, so you can see what has genuinely been done."
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
                variant="outline" className="rounded-full border-brand-navy/15 bg-white/60"
                asChild
              >
                <Link href="/how-it-works">How verification works</Link>
              </Button>
            </>
          }
        />
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="How it works"
          title="From requirements to arranged care"
          description="Finding care is a three-stage process on HillCrest. You stay involved at each stage, and nothing is agreed on your behalf without your confirmation."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
            >
              <span className="absolute right-5 top-5 font-heading text-3xl font-semibold text-brand-teal/20">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
              >
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {step.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </SiteSection>

      <SiteSection tone="sky">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="What verification means"
            title="Honest verification, clearly explained"
            description="Verification on HillCrest means specific things, and we would rather describe them plainly than overstate them."
          />
          <div className="grid gap-4">
            {verificationPoints.map((point) => (
              <div
                key={point.title}
                className="flex gap-4 rounded-[var(--radius-2xl)] bg-card/85 p-5 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
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
            It is not a guarantee of care quality, a promise that nothing will
            ever go wrong, or a substitute for your own assessment and
            safeguarding checks. It means that the training and competency
            records shown have been completed and reviewed — nothing more is
            claimed.
          </p>
        </div>
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Getting started"
            title="Three things worth preparing"
            description="A short, clear brief makes it much easier to match you with a caregiver who is genuinely suited to the support you need."
          />
          <ul className="grid gap-4">
            {[
              {
                title: "The kind of care needed",
                body: "Personal care, mobility support, companionship, help with medication, overnight support or general daily living.",
              },
              {
                title: "The practical details",
                body: "Where the care takes place, the days and hours involved, and how quickly you need someone to start.",
              },
              {
                title: "Anything the caregiver should know",
                body: "Language preferences, pets, allergies, medical considerations, or how the person you care for likes to be supported.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-[var(--radius-2xl)] bg-card/85 p-5 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <p className="font-heading font-semibold text-brand-strong">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            eyebrow="Next step"
            title="Start the conversation about care"
            description="Create an account to share your requirements and review caregiver records, or contact our team if you would like guidance first."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Get started</Link>
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
