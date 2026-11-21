import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenIcon,
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  FileTextIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  PackageIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedHillCrestLogo } from "@/components/brand/animated-carebridge-logo";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import {
  FadeIn,
  Float,
  Glow,
  HoverLift,
  Stagger,
  StaggerItem,
} from "@/components/site/hero-motion";
import {
  homeFaqs,
  homepageSteps,
  organisationFeatures,
  trainingProgrammes,
} from "@/config/site-content";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Build a Career in Care",
  description:
    "HillCrest brings together caregiver training, supervised practical experience, employment pathways and care operations on one platform.",
};

const iconMap = {
  Users: UsersIcon,
  CalendarClock: CalendarClockIcon,
  ClipboardList: ClipboardListIcon,
  ShieldAlert: ShieldAlertIcon,
  Package: PackageIcon,
  FileText: FileTextIcon,
} as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <SiteSection className="relative overflow-hidden">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-portal-peach via-portal-cream to-portal-lavender p-5 shadow-[0_30px_80px_-60px_rgb(16_43_92/0.55)] sm:p-8 lg:p-12 dark:from-brand-dark dark:via-brand-dark-surface dark:to-brand-navy">
          <span
            aria-hidden="true"
            className="absolute -right-20 -top-24 size-72 rounded-full border-[24px] border-white/25 dark:border-white/10"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-white/15 dark:bg-white/5"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <FadeIn>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b4a2c] shadow-sm backdrop-blur-sm dark:bg-white/10 dark:text-white/80">
                  <SparklesIcon className="size-3.5" aria-hidden="true" />
                  Learn. Practise. Work.
                </span>
              </FadeIn>

              <FadeIn delay={0.08}>
                <h1 className="font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-brand-strong sm:text-4xl lg:text-5xl">
                  Build a career in care.
                  <span className="mt-1 block text-brand-navy/80 dark:text-white/85">
                    Help someone live better.
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.16}>
                <p className="max-w-xl text-base text-brand-navy/70 dark:text-foreground/75">
                  {brand.name} connects structured caregiver training, supervised
                  practical experience, employment opportunities and the
                  operations tools care providers need.
                </p>
              </FadeIn>

              <FadeIn delay={0.24} className="flex flex-wrap items-center gap-2">
                <Button
                  size="lg"
                  className="rounded-full bg-brand-navy text-white shadow-sm hover:bg-brand-navy/90 dark:bg-white dark:text-brand-navy dark:hover:bg-white/90"
                  asChild
                >
                  <Link href="/caregiver-training">Explore training</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-brand-navy/15 bg-white/60 backdrop-blur-sm hover:bg-white/80 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  asChild
                >
                  <Link href="/for-care-homes">For care providers</Link>
                </Button>
              </FadeIn>

              <FadeIn delay={0.3}>
                <p className="text-xs text-brand-navy/60 dark:text-foreground/60">
                  Verified records · Access-controlled data · Append-only finances
                </p>
              </FadeIn>
            </div>

            <div className="space-y-5">
              <FadeIn delay={0.18} className="relative flex justify-center lg:justify-start">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <Glow className="size-36 rounded-full bg-white/50 blur-3xl dark:bg-brand-teal/25" />
                </span>
                <Float className="relative">
                  <AnimatedHillCrestLogo size="md" showTagline />
                </Float>
              </FadeIn>

              <Stagger delay={0.28} className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: GraduationCapIcon, title: "Structured training", body: "Modules, lessons and assessments that record real progress." },
                  { icon: ClipboardListIcon, title: "Practical competency", body: "Supervised placements with competency recorded as you go." },
                  { icon: Building2Icon, title: "Care operations", body: "Residents, staff, shifts, care records and reporting." },
                  { icon: HeartHandshakeIcon, title: "Charity and access", body: "Scholarships and campaigns that widen access to training." },
                ].map((card) => (
                  <StaggerItem key={card.title} className="h-full">
                    <HoverLift className="group h-full rounded-[var(--radius-2xl)] bg-white/70 p-4 shadow-sm ring-1 ring-brand-navy/5 backdrop-blur-sm transition-colors hover:bg-white/90 dark:bg-white/[0.06] dark:ring-white/10 dark:hover:bg-white/[0.1]">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-white/80 text-brand-navy shadow-sm dark:bg-white/10 dark:text-white dark:shadow-none">
                        <card.icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <p className="mt-3 font-heading text-sm font-semibold text-brand-strong dark:text-white">
                        {card.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-brand-navy/65 dark:text-foreground/65">
                        {card.body}
                      </p>
                    </HoverLift>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </div>
      </SiteSection>

      {/* Trust and verification */}
      <SiteSection>
        <SectionHeading
          eyebrow="Trust and verification"
          title="Substantiated, verifiable, never exaggerated"
          description="We are deliberate about what we claim. These are the principles behind how HillCrest handles trust."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Verified records",
              body: "Training completion and competency records are stored against each learner and shown only once the relevant workflow has been completed.",
            },
            {
              title: "Access-controlled data",
              body: "Every organisation's data is isolated. Access is enforced on the server and at the database level, and sensitive actions are logged.",
            },
            {
              title: "Append-only finances",
              body: "Financial history is never silently rewritten. Changes to policies do not rewrite amounts that were already earned or completed.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-green to-brand-teal" />
              <span className="relative flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-green/20 to-brand-teal/20">
                <ShieldCheckIcon
                  className="size-6 text-brand-green"
                  aria-hidden="true"
                />
              </span>
              <p className="relative mt-4 font-heading font-semibold text-brand-strong">
                {item.title}
              </p>
              <p className="relative mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      {/* How it works */}
      <SiteSection tone="sky" className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-gradient-to-br from-brand-teal/15 to-brand-green/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gradient-to-tr from-brand-coral/15 to-brand-sky/30 blur-3xl" />
        <div className="relative">
          <SectionHeading
            eyebrow="How HillCrest works"
            title="A pathway from learning to earning"
            description="HillCrest is designed as a connected journey, so that what you learn, what you practise and the work you do all build on each other."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {homepageSteps.map((step) => (
              <div
                key={step.step}
                className="group relative overflow-hidden rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-teal via-brand-green to-brand-coral" />
                <span className="relative font-heading text-4xl font-semibold bg-gradient-to-br from-brand-teal to-brand-green bg-clip-text text-transparent">
                  {step.step}
                </span>
                <p className="relative mt-2 font-heading text-lg font-semibold text-brand-strong">
                  {step.title}
                </p>
                <p className="relative mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/how-it-works">See the full pathway</Link>
          </Button>
        </div>
      </SiteSection>

      {/* Featured programmes */}
      <SiteSection>
        <SectionHeading
          eyebrow="Featured training programmes"
          title="Programmes that build real capability"
          description="Each programme is made up of modules and lessons, with assessments and practical competency checks."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {trainingProgrammes.map((programme) => (
            <div
              key={programme.title}
              className="rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
              >
                <BookOpenIcon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {programme.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {programme.summary}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {programme.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-full bg-brand-sky px-2.5 py-1 text-xs font-medium text-brand-teal"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      </SiteSection>

      {/* Internship and employment pathway */}
      <SiteSection tone="ivory">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Internship and employment pathway"
            title="From supervised practice to real work"
            description="Supervised placements let learners apply what they have studied, while employers and recruiters can find candidates whose competency records are visible and verifiable."
          />
          <div className="grid gap-4">
            {[
              { icon: ClipboardListIcon, title: "Internships", body: "Supervised practical placements with evaluations recorded against each learner." },
              { icon: UsersIcon, title: "Employment marketplace", body: "Post vacancies, review verified candidates and manage applications and offers." },
              { icon: SparklesIcon, title: "Career growth", body: "Records that grow with you as you take on more responsibility." },
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
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" asChild>
              <Link href="/internships">See internship opportunities</Link>
            </Button>
          </div>
        </div>
      </SiteSection>

      {/* Care-home software showcase */}
      <SiteSection>
        <SectionHeading
          eyebrow="Care-home software"
          title="Operations built for real care settings"
          description="Run residential and home-care operations in one place, with the records and controls that regulators and families expect."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {organisationFeatures.map((feature) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <div
                key={feature.title}
                className="rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
                >
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 font-heading font-semibold text-brand-strong">
                  {feature.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/for-care-homes">Explore care-home software</Link>
          </Button>
        </div>
      </SiteSection>

      {/* Charity and scholarship */}
      <SiteSection tone="navy">
        <SectionHeading
          tone="onDark"
          eyebrow="Charity and scholarships"
          title="Widening access to quality care training"
          description="Charity campaigns fund scholarships so that capable people are not held back by cost. Donations, awards and fund allocation are recorded transparently."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/donate">Donate</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/charity">Learn about the charity</Link>
          </Button>
        </div>
      </SiteSection>

      {/* Referral programme */}
      <SiteSection tone="ivory">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Referral programme"
            title="Earn by introducing people to better care"
            description="Partners can refer learners and organisations to HillCrest. Eligible referrals are tracked against a published commission policy, and commissions become payable only when they qualify."
          />
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button size="lg" asChild>
              <Link href="/referral-programme">Join the programme</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/referral-terms">Read the terms</Link>
            </Button>
          </div>
        </div>
      </SiteSection>

      {/* FAQ */}
      <SiteSection>
        <SectionHeading
          eyebrow="Frequently asked questions"
          title="Answers to common questions"
          description="If you cannot find what you need, the Help Centre and our team are here to help."
        />
        <div className="mt-10 max-w-3xl">
          <FaqAccordion items={homeFaqs} />
        </div>
      </SiteSection>

      {/* Final CTA */}
      <SiteSection tone="sky">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            align="center"
            title="Ready to start building a career in care?"
            description="Create an account to begin training, or talk to us about bringing HillCrest to your organisation."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Create an account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </SiteSection>
    </>
  );
}
