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
      <SiteSection tone="ivory" className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-gradient-to-br from-brand-blue/10 to-brand-green/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-gradient-to-tr from-brand-bright-blue/10 to-brand-sky/20 blur-3xl" />
        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-gradient-to-r from-brand-sky/80 to-brand-green/10 px-3 py-1 text-xs font-medium text-brand-teal shadow-sm">
              <SparklesIcon className="size-3.5 animate-pulse" aria-hidden="true" />
              Learn. Practise. Work.
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl lg:text-6xl">
              Build a Career in Care.
              <span className="bg-gradient-to-r from-brand-blue via-brand-green to-brand-bright-blue bg-clip-text text-transparent block">
                Help Someone Live Better.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {brand.name} connects structured caregiver training, supervised
              practical experience and employment opportunities — while giving
              care homes and agencies the operations tools they need to deliver
              safe, dignified care.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="bg-gradient-to-r from-brand-blue to-brand-green shadow-lg transition hover:scale-[1.02] hover:shadow-xl" asChild>
                <Link href="/caregiver-training">Explore Training</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-brand-teal/40 hover:bg-brand-sky/60" asChild>
                <Link href="/become-an-employer-partner">Become a Care Partner</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No fabricated statistics, testimonials or accreditations — ever.
              We show only what has actually been verified.
            </p>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="absolute -right-10 -top-10 hidden h-40 w-40 animate-float rounded-full bg-gradient-to-br from-brand-bright-blue/20 to-brand-blue/10 blur-2xl lg:block" />
            <div className="mb-6 flex justify-center lg:justify-start">
              <AnimatedHillCrestLogo size="lg" showTagline />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: GraduationCapIcon, title: "Structured training", body: "Modules, lessons and assessments that record real progress.", gradient: "from-brand-blue/15 to-brand-sky/40" },
                { icon: ClipboardListIcon, title: "Practical competency", body: "Supervised placements with competency recorded as you go.", gradient: "from-brand-green/15 to-brand-light-green" },
                { icon: Building2Icon, title: "Care operations", body: "Residents, staff, shifts, care records and reporting.", gradient: "from-brand-navy/10 to-brand-sky/30" },
                { icon: HeartHandshakeIcon, title: "Charity and access", body: "Scholarships and campaigns that widen access to training.", gradient: "from-brand-bright-blue/15 to-brand-light-green" },
              ].map((card) => (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-xl bg-card p-5 shadow-lg ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                  <span
                    aria-hidden="true"
                    className="relative flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-white shadow-md transition-transform group-hover:scale-110"
                  >
                    <card.icon className="size-5" />
                  </span>
                  <p className="relative mt-4 font-heading font-semibold text-brand-strong">
                    {card.title}
                  </p>
                  <p className="relative mt-1.5 text-sm text-muted-foreground">{card.body}</p>
                </div>
              ))}
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
              className="group relative overflow-hidden rounded-xl bg-card p-6 shadow-lg ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-xl"
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
                className="group relative overflow-hidden rounded-xl bg-card p-6 shadow-lg ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-xl"
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
              className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
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
                className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
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
