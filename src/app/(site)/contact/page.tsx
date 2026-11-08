import type { Metadata } from "next";
import Link from "next/link";
import {
  HandshakeIcon,
  HeartHandshakeIcon,
  LifeBuoyIcon,
  MailIcon,
  MessageCircleIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to reach HillCrest: general enquiries, support, partnerships, safeguarding concerns and charity or scholarship questions, each with the right address to use.",
};

const supportDomain = brand.supportEmail.split("@").pop() ?? "carebridge.ng";

const contactRoutes = [
  {
    icon: MessageCircleIcon,
    title: "General enquiries",
    body: "Questions about HillCrest, what the platform covers, or which route to take for your situation.",
    email: `hello@${supportDomain}`,
  },
  {
    icon: LifeBuoyIcon,
    title: "Support",
    body: "Help with an existing account, a training record, a placement, an application or a payment.",
    email: brand.supportEmail,
  },
  {
    icon: HandshakeIcon,
    title: "Partnerships",
    body: "Training delivery, hosting placements, employer partnership and referral programme questions.",
    email: `partnerships@${supportDomain}`,
  },
  {
    icon: ShieldAlertIcon,
    title: "Safeguarding concerns",
    body: "Concerns about the safety or treatment of a person receiving care, or about a learner's conduct on placement.",
    email: `safeguarding@${supportDomain}`,
  },
  {
    icon: HeartHandshakeIcon,
    title: "Charity and scholarships",
    body: "Donations, scholarship applications, fundraising campaigns and fund allocation questions.",
    email: `charity@${supportDomain}`,
  },
] as const;

const beforeYouWrite = [
  "Most account and training questions are covered in the help centre, which explains how training, records, organisation setup and referrals work.",
  "The FAQ page groups the questions we are asked most often, including how caregivers are verified and how the referral programme operates.",
  "If you are asking about a specific learner record, please include the name of the learner and the organisation involved so we can find the right record.",
  "If you are writing about a safeguarding concern, please include what happened, when it happened and who was involved.",
];

export default function ContactPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-sky px-3 py-1 text-xs font-medium text-brand-teal">
              <MailIcon className="size-3.5" aria-hidden="true" />
              Contact
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
              Contact {brand.name}
              <span className="text-gradient-care block">
                and we will point you to the right place
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Every message comes to a real inbox, so using the route below
              means your question reaches the team that deals with it rather than
              a general queue. {brand.tagline}.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/help">Visit the help centre</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/faq">Read the FAQ</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-strong">
              What happens next
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                We aim to respond during business hours in {brand.timeZone}.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                Messages sent outside business hours are picked up on the next working day.
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                We do not operate a 24-hour support desk, so urgent safeguarding matters should be raised with the relevant emergency services as well.
              </li>
            </ul>
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Contact routes"
          title="Write to the right address"
          description="Each route has its own inbox and its own team. Choose the one that matches your question and you will avoid extra back and forth."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contactRoutes.map((route) => (
            <div
              key={route.title}
              className="flex flex-col rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <route.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {route.title}
              </p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {route.body}
              </p>
              <a
                href={`mailto:${route.email}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                <MailIcon className="size-4" aria-hidden="true" />
                {route.email}
              </a>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Before you write"
            title="Check these first"
            description="A large share of questions are already answered in the self-service material, and it is usually faster than waiting for a reply."
          />
          <ul className="grid gap-4">
            {beforeYouWrite.map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-teal"
                />
                <span className="text-sm text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/help">Help centre</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/faq">Frequently asked questions</Link>
          </Button>
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            eyebrow="Support"
            title="Need a hand?"
            description="Start with the help centre for guidance you can follow yourself, and write to us when the answer depends on your account or your organisation."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/help">Go to the help centre</Link>
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
          </p>
        </div>
      </SiteSection>
    </>
  );
}
