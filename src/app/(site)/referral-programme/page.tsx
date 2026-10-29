import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircleIcon,
  FileTextIcon,
  HandCoinsIcon,
  UsersIcon,
  ShieldCheckIcon,
  ListOrderedIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";

export const metadata: Metadata = {
  title: "Referral Programme",
  description:
    "CareBridge referral programme: who can join, how referrals are tracked, commissions follow a published policy and become payable only when they qualify, financial history is append-only.",
};

const whoCanJoin = [
  {
    icon: UsersIcon,
    title: "Partners and organisations",
    body: "Care homes, training partners, agencies and organisations that can introduce learners or organisations to CareBridge.",
  },
  {
    icon: HandCoinsIcon,
    title: "Individuals",
    body: "Individuals who introduce qualified referrals in line with the published programme terms.",
  },
];

const howItWorksSteps = [
  {
    title: "Join",
    body: "Register for the referral programme and review the published referral terms before referring.",
  },
  {
    title: "Refer",
    body: "Introduce learners or organisations to CareBridge using your referral path as described in the programme.",
  },
  {
    title: "Track",
    body: "Eligible referrals are tracked against the published commission policy in an auditable ledger.",
  },
  {
    title: "Qualify",
    body: "Commissions become payable only when they qualify under the published policy. Not every referral earns commission.",
  },
];

export default function ReferralProgrammePage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Referral Programme"
              title="Refer partners and earn when it qualifies"
              description="The referral programme lets partners introduce learners and organisations to CareBridge. Commissions follow a published policy and become payable only when they qualify."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/dashboard/referrals">Join the programme</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/referral-terms">Read referral terms</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-navy">
              Key principles
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Published policy defines eligibility and commission rates",
                "Commissions become payable only when they qualify",
                "Referrals are tracked against the published policy",
                "Financial history is append-only and auditable",
                "No silent rewrites to already-earned amounts",
              ].map((point) => (
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
          eyebrow="Who it is for"
          title="Partners who can join"
          description="The programme is open to partners who can introduce qualified learners or organisations to CareBridge."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {whoCanJoin.map((item) => (
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
              <p className="mt-4 font-heading text-lg font-semibold text-brand-navy">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="How it works"
          title="Track referrals with clarity"
          description="Follow the published process from joining to when commissions qualify."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {howItWorksSteps.map((step, index) => (
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
                <ListOrderedIcon className="size-5" />
              </span>
              <p className="mt-4 font-heading font-semibold text-brand-navy">
                {step.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Financial transparency"
            title="Append-only, auditable, no silent rewrites"
            description="All referral financial history is recorded in an append-only ledger. Commissions follow a published policy and become payable only when they qualify. Changes are never applied silently to already-earned amounts."
          />
          <div className="grid gap-4">
            {[
              {
                icon: ShieldCheckIcon,
                title: "Published policy",
                body: "Eligibility and commission terms are published in the referral terms and applied consistently.",
              },
              {
                icon: FileTextIcon,
                title: "Append-only ledger",
                body: "Financial records are append-only and auditable, with a complete history of entries.",
              },
              {
                icon: CheckCircleIcon,
                title: "Payable only when qualified",
                body: "Commissions become payable only when they qualify under the published policy, not by default.",
              },
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
                  <p className="font-heading font-semibold text-brand-navy">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            title="Start referring with clear terms"
            description="Talk to our team to learn more or review the published referral terms."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/dashboard/referrals">Apply to refer</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/referral-terms">Referral terms</Link>
            </Button>
          </div>
        </div>
      </SiteSection>
    </>
  );
}
