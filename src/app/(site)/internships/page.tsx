import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  FileCheckIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { SiteHero, SiteHeroCard } from "@/components/site/site-hero";

export const metadata: Metadata = {
  title: "Internship Opportunities",
  description:
    "Supervised practical placements for caregivers: how placements are structured, what to expect during one, how they are evaluated, and how they connect to employment.",
};

const placementSteps = [
  {
    icon: ClipboardListIcon,
    title: "Apply for a placement",
    body: "Tell us where you are in your training and what you want to practise. Placements are matched to the stage you have reached.",
  },
  {
    icon: UsersRoundIcon,
    title: "Get placed with a host",
    body: "Your placement is arranged with a care home, agency or family, and a supervisor is named for the placement.",
  },
  {
    icon: UserCheckIcon,
    title: "Work under supervision",
    body: "You care for people under the guidance of a supervisor who reviews your practice and gives feedback as you go.",
  },
  {
    icon: FileCheckIcon,
    title: "Evaluation and sign-off",
    body: "The supervisor completes a structured evaluation, and your competency record is updated with what you demonstrated.",
  },
] as const;

const expectations = [
  {
    icon: CalendarCheckIcon,
    title: "An agreed schedule",
    body: "Your shifts and days are set with the host organisation and recorded so attendance and progress can be reviewed.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Clear supervision",
    body: "A named supervisor is responsible for your placement, and tasks are only assigned within what you are signed off to do.",
  },
  {
    icon: ClipboardListIcon,
    title: "Real care tasks",
    body: "You support people with daily living, personal care, mobility and wellbeing, following the host's care plans.",
  },
  {
    icon: FileCheckIcon,
    title: "Recorded learning",
    body: "Notes, observations and evaluations are stored against your record, so your placement leaves evidence behind.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Support and feedback",
    body: "You are part of a team. Supervision includes regular feedback, and concerns are raised through a defined route.",
  },
  {
    icon: BriefcaseIcon,
    title: "Time to reflect",
    body: "Time is set aside to review what you have learned and to prepare for your next assessment or placement.",
  },
] as const;

const pathwaySteps = [
  {
    icon: FileCheckIcon,
    title: "Your record is complete",
    body: "Your training history and placement evaluations are attached to your profile.",
  },
  {
    icon: UsersRoundIcon,
    title: "You appear to employers",
    body: "Employers and recruiters can review your completed training and competency records directly.",
  },
  {
    icon: BriefcaseIcon,
    title: "You apply and interview",
    body: "Applications, interviews and offers are managed in the platform, so your history travels with you.",
  },
] as const;

export default function InternshipsPage() {
  return (
    <>
            <SiteSection>
        <SiteHero
          tone="mint"
          eyebrow="Supervised practice"
          title="Internship opportunities."
          highlight="Learn on the job, with support."
          description="Placements are matched to your stage of training, supervised by a named professional and recorded as part of your competency history."
          actions={
            <>
              <Button
                size="lg"
                className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90"
                asChild
              >
                <Link href="/register">Find a placement</Link>
              </Button>
              <Button
                size="lg"
                variant="outline" className="rounded-full border-brand-navy/15 bg-white/60"
                asChild
              >
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </>
          }
          aside={
            <>
              <SiteHeroCard
                title="Apply for a placement"
                body="Tell us where you are in your training and what you want to practise."
              />
              <SiteHeroCard
                title="Work under supervision"
                body="A supervisor reviews your practice and gives feedback as you go."
              />
              <SiteHeroCard
                title="Evaluation and sign-off"
                body="A structured evaluation updates your competency record."
              />
            </>
          }
        />
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="How placements work"
          title="From application to signed evaluation"
          description="Every placement follows the same sequence, so you always know what is happening and what is expected of you."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {placementSteps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span className="absolute right-5 top-5 font-heading text-3xl font-semibold text-brand-teal/20">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
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

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="What to expect"
          title="What a placement day looks like"
          description="Placements are practical and structured. Here is what you can expect while you are on one."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {expectations.map((item) => (
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
              <p className="mt-4 font-heading font-semibold text-brand-strong">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Pathway to employment"
            title="Placements are designed to lead to work"
            description="A placement is not an end in itself. The evaluation it produces is what employers and families are able to see when they review your profile."
          />
          <div className="grid gap-4">
            {pathwaySteps.map((step) => (
              <div
                key={step.title}
                className="flex gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <step.icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/find-caregivers">Find caregivers</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/for-employers">For employers</Link>
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
            eyebrow="Apply"
            title="Request a placement"
            description="Create an account to apply for an internship placement, or contact our team to talk through the options for your stage of training."
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
