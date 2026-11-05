import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheckIcon,
  BookOpenCheckIcon,
  ClipboardPenLineIcon,
  FileCheckIcon,
  GraduationCapIcon,
  HandshakeIcon,
  PresentationIcon,
  SendIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Become a Training Partner",
  description:
    "Deliver caregiver training with CareBridge: run programmes, host supervised placements, contribute to the curriculum, and keep learner records and assessments in one system.",
};

const partnerRoles = [
  {
    icon: PresentationIcon,
    title: "Deliver programmes",
    body: "Run CareBridge training programmes for your own learners or cohorts, using the same structured modules, lessons and assessments that sit behind every programme on the platform.",
  },
  {
    icon: UsersRoundIcon,
    title: "Host practical placements",
    body: "Take learners into your setting for supervised placements. Each placement has a named supervisor, an agreed schedule, and a structured evaluation that is written back to the learner's record.",
  },
  {
    icon: ClipboardPenLineIcon,
    title: "Contribute to the curriculum",
    body: "Bring your organisation's experience into what is taught. Partner feedback on curriculum gaps and practice standards helps shape what learners are prepared for when they start work.",
  },
] as const;

const partnerProvides = [
  {
    icon: BookOpenCheckIcon,
    title: "A delivery platform",
    body: "Programmes, modules, lessons, assessments and learner progress live in one place, so you are not rebuilding training administration for every cohort you run.",
  },
  {
    icon: BadgeCheckIcon,
    title: "Learner records",
    body: "Each learner has a single record that follows them through training, placements and employment. Enrolment, progress, assessments and placement evaluations are attached to it rather than spread across separate files.",
  },
  {
    icon: FileCheckIcon,
    title: "Assessments and competency checks",
    body: "Assessments and practical competency checks are recorded against the learner, so completion reflects demonstrated understanding and practice rather than attendance alone.",
  },
] as const;

const applicationSteps = [
  {
    icon: SendIcon,
    title: "Introduce your organisation",
    body: "Tell us what your organisation does, who you would like to train, and which areas of care you cover.",
  },
  {
    icon: HandshakeIcon,
    title: "Talk through scope",
    body: "We discuss how programmes, placements and assessments would map onto your existing ways of working before anything is set up.",
  },
  {
    icon: GraduationCapIcon,
    title: "Get set up on the platform",
    body: "Your organisation, trainers and programmes are set up in CareBridge, and you are shown how learner records, reviews and placements are handled.",
  },
  {
    icon: UsersRoundIcon,
    title: "Run your first cohort",
    body: "You deliver the programme and host placements. Evaluations are recorded as you go, and your feedback shapes what is improved next.",
  },
] as const;

const partnerTypes = [
  "Care homes and home-care agencies that want to run their own induction and development pathway.",
  "Training providers and educators delivering care-related programmes.",
  "Community and faith-based organisations supporting people who want to enter care work.",
  "Employers building a pipeline of trained caregivers for their own services.",
];

export default function BecomeATrainingPartnerPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-sky px-3 py-1 text-xs font-medium text-brand-teal">
              <GraduationCapIcon className="size-3.5" aria-hidden="true" />
              Training partners
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
              Become a training partner
              <span className="text-gradient-care block">
                and train the next generation of caregivers
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Training partners work with {brand.name} to deliver caregiver
              programmes, host practical placements and help shape the
              curriculum. You bring the setting and the experience; we bring the
              platform, the learner records and the assessments.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact">Talk to our team</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create an account</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-strong">
              Who partners with us
            </p>
            <ul className="mt-4 space-y-3">
              {partnerTypes.map((point) => (
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
          eyebrow="What partners do"
          title="Three ways you contribute"
          description="Partners take on real parts of the pathway: teaching it, supervising it in practice, and keeping it relevant to the work ahead."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {partnerRoles.map((item) => (
            <div
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
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="What you get"
          title="What CareBridge provides"
          description="So you can focus on teaching and supervising, rather than on maintaining training administration."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {partnerProvides.map((item) => (
            <div
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
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/caregiver-training">See the training programmes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/internships">See how placements work</Link>
          </Button>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="How to apply"
          title="Four steps to becoming a partner"
          description="Applying starts with a conversation. There is no fee to apply and no obligation until the scope is agreed."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {applicationSteps.map((step, index) => (
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

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            eyebrow="Apply"
            title="Start a conversation about partnership"
            description="Tell us what you would like to deliver and we will talk through how it would work in your organisation."
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
              <Link href="/register">Create an account</Link>
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
