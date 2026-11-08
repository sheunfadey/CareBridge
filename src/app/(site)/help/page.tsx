import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenIcon,
  BuildingIcon,
  GraduationCapIcon,
  LifeBuoyIcon,
  ReceiptIcon,
  UserRoundIcon,
} from "lucide-react";

import { FaqAccordion } from "@/components/site/faq-accordion";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import type { FaqItem } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Self-service guidance for HillCrest: training programmes, account help, organisation setup, billing and referrals, and how to reach support when you need it.",
};

const helpTopics = [
  {
    icon: GraduationCapIcon,
    title: "Training guidance",
    body: "How programmes, modules, lessons and assessments are structured, how progress is recorded, and how practical placements connect to the classroom content.",
    points: [
      "Choosing the programme that matches your experience",
      "Understanding assessments and competency checks",
      "How placement evaluations are recorded",
    ],
    href: "/caregiver-training",
    linkLabel: "Caregiver training",
  },
  {
    icon: UserRoundIcon,
    title: "Account help",
    body: "Creating your profile, signing in, keeping your details current, and what to do if your learner record does not look the way you expect.",
    points: [
      "Setting up and securing your account",
      "Understanding the record attached to your profile",
      "Keeping training and placement history complete",
    ],
    href: "/how-it-works",
    linkLabel: "How it works",
  },
  {
    icon: BuildingIcon,
    title: "Organisation setup",
    body: "Creating an organisation, inviting staff with the right roles, and setting up residents, shifts, care plans, incidents and inventory for a care home.",
    points: [
      "Adding staff and assigning roles",
      "Setting up residents and daily care records",
      "Keeping access and audit trails in order",
    ],
    href: "/for-care-homes",
    linkLabel: "For care homes",
  },
  {
    icon: ReceiptIcon,
    title: "Billing and referrals",
    body: "How prices are charged, how referrals are tracked, and how payments, expenses and refunds are recorded so the history stays auditable.",
    points: [
      `Prices are charged in ${brand.currency}`,
      "How the referral programme tracks eligible referrals",
      "How refunds and adjustments are recorded",
    ],
    href: "/referral-programme",
    linkLabel: "Referral programme",
  },
] as const;

const popularFaqs: FaqItem[] = [
  {
    question: "Where do I start if I am new to HillCrest?",
    answer:
      "Create an account, then browse the caregiver training programmes to find the one that matches your experience. Everything you complete is attached to your profile from the start.",
  },
  {
    question: "Where can I see my training record?",
    answer:
      "Your learner record sits on your profile in the platform. It holds the modules you have completed, your assessments and any placement evaluations, and it is the record employers and placement hosts review.",
  },
  {
    question: "Can my organisation manage everything for me?",
    answer:
      "Care homes and agencies can set up residents, staff, shifts, care plans, incidents, inventory and invoices on the platform. Roles determine what each member of staff can see and change.",
  },
  {
    question: "What if I cannot find the answer here?",
    answer:
      "Use the contact page and choose the route that matches your question. Support, general enquiries, partnerships, safeguarding and charity questions each have their own address.",
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-sky px-3 py-1 text-xs font-medium text-brand-teal">
              <BookOpenIcon className="size-3.5" aria-hidden="true" />
              Help centre
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
              Help centre
              <span className="text-gradient-care block">
                find your answer without waiting
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {brand.name} is designed to be understandable without help. This
              page covers the four areas people ask about most, and points you
              to the guidance for each one.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/faq">Read the FAQ</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-strong">
              How the help centre works
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                Each topic below explains how the area works and links to the part of the platform it refers to.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                Popular questions are answered further down this page.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                If the answer depends on your account or your organisation, write to us through the contact page.
              </li>
            </ul>
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Topics"
          title="Guidance by area"
          description="Four areas cover most questions about using HillCrest."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {helpTopics.map((topic) => (
            <div
              key={topic.title}
              className="flex flex-col rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <topic.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {topic.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{topic.body}</p>
              <ul className="mt-4 space-y-2">
                {topic.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-teal"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <Button variant="link" className="mt-4 self-start px-0" asChild>
                <Link href={topic.href}>{topic.linkLabel}</Link>
              </Button>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Popular questions"
              title="The questions we are asked most often"
              description="Short answers to the things people look up first."
            />
            <div className="mt-8">
              <FaqAccordion items={popularFaqs} />
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
            >
              <LifeBuoyIcon className="size-5" />
            </span>
            <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
              Support is available
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Self-service guidance covers most questions, but if yours depends
              on your account, your records or your organisation, we are the
              right people to ask. The contact page has a separate address for
              support, partnerships, safeguarding and charity questions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/faq">More questions answered</Link>
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
            eyebrow="Contact"
            title="Ask us when the answer depends on your account"
            description="We aim to respond during business hours in Africa/Lagos. If your question is urgent and relates to the safety of someone receiving care, raise it with the relevant emergency services as well."
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
              <Link href="/faq">Read the FAQ</Link>
            </Button>
          </div>
          <p className="text-sm text-white/70">
            Support email:{" "}
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
