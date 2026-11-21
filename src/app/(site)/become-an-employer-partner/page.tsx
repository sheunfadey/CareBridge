import type { Metadata } from "next";
import Link from "next/link";
import {
  BuildingIcon,
  ClipboardListIcon,
  FileCheckIcon,
  HandshakeIcon,
  MessageSquareIcon,
  SendIcon,
  UserCheckIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { SiteHero, SiteHeroCard } from "@/components/site/site-hero";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Become an Employer Partner",
  description:
    "Employer partners hire verified caregivers, offer internships and placements, and give structured feedback. Learn what employer partnership involves and how to get started.",
};

const partnerRoles = [
  {
    icon: UserCheckIcon,
    title: "Hire verified caregivers",
    body: "Review candidates whose training and competency records are held in the platform, then manage applications, interviews and offers in one place instead of across scattered CVs and inboxes.",
  },
  {
    icon: UsersRoundIcon,
    title: "Offer internships and placements",
    body: "Host learners as interns on supervised placements, with a named supervisor, an agreed schedule and a structured evaluation that is written back to each learner's record.",
  },
  {
    icon: MessageSquareIcon,
    title: "Give structured feedback",
    body: "Placement and performance feedback is recorded in the platform, so what a supervisor observed during a placement informs what a learner is ready to do next.",
  },
] as const;

const partnerBenefits = [
  {
    icon: FileCheckIcon,
    title: "Evidence behind every candidate",
    body: "Training history, assessments and placement evaluations travel with the learner, so shortlisting is based on recorded capability rather than a claim on a CV.",
  },
  {
    icon: ClipboardListIcon,
    title: "A structured pipeline",
    body: "Vacancies, applications, interviews and offers are managed in the platform, which keeps the recruitment record in one place for everyone involved in the process.",
  },
  {
    icon: HandshakeIcon,
    title: "A route for new talent",
    body: "Placements give you a way to assess people in your own environment before you commit, and a way to give people starting in care a first step into employment.",
  },
] as const;

const gettingStartedSteps = [
  {
    icon: SendIcon,
    title: "Tell us what you need",
    body: "Describe the roles you are recruiting for, the services you deliver and the number of placements you could host.",
  },
  {
    icon: HandshakeIcon,
    title: "Agree the arrangement",
    body: "We talk through recruitment, placement and supervision, and what is expected from a supervisor on your side.",
  },
  {
    icon: BuildingIcon,
    title: "Get set up on the platform",
    body: "Your organisation and any vacancies are set up so you can review verified candidates and record decisions as you go.",
  },
  {
    icon: UsersRoundIcon,
    title: "Recruit and support",
    body: "Post vacancies, host placements and give feedback. Everything that happens stays attached to the learner's record.",
  },
] as const;

export default function BecomeAnEmployerPartnerPage() {
  return (
    <>
            <SiteSection>
        <SiteHero
          tone="sky"
          eyebrow="Employer partners"
          title="Become an employer partner."
          highlight="Hire from a verified pipeline."
          description="Post vacancies, review candidates whose training and competency records actually exist, and manage applications, interviews and offers in one place."
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
            <>
              <SiteHeroCard
                title="Verified candidates"
                body="Training, assessments and practical evaluations visible on profile."
              />
              <SiteHeroCard
                title="One hiring record"
                body="Applications, interviews and offers tracked together."
              />
              <SiteHeroCard
                title="Less guesswork"
                body="Review what has been demonstrated, not just claimed."
              />
            </>
          }
        />
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="What partners do"
          title="Three parts of recruitment you can own"
          description="Partnering covers hiring, the practical preparation before hiring, and the feedback loop that keeps training relevant to the work."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {partnerRoles.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
              >
                <item.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="Why partner"
          title="What employer partnership gives you"
          description="Recruiting in care is harder when evidence is hard to find. Partnership puts that evidence in the same system as the recruitment itself."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {partnerBenefits.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl bg-brand-sky/80 text-brand-teal ring-1 ring-brand-teal/10"
              >
                <item.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/find-caregivers">Find caregivers</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/internships">Internship placements</Link>
          </Button>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Get started"
          title="Four steps to getting started"
          description="We begin with what you actually need, so the arrangement fits your services and the people you need to recruit."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {gettingStartedSteps.map((step, index) => (
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
              <p className="mt-4 font-heading font-semibold text-brand-strong">
                {step.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            eyebrow="Get started"
            title="Talk to us about employer partnership"
            description="Tell us about the roles you need to fill and the placements you could host, and we will walk you through how it works."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/for-employers">For employers</Link>
            </Button>
          </div>
          <p className="text-sm text-white/70">
            Questions? Email{" "}
            <a
              href={`mailto:${brand.supportEmail}`}
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              {brand.supportEmail}
            </a>
            .
          </p>
        </div>
      </SiteSection>
    </>
  );
}
