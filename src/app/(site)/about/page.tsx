import type { Metadata } from "next";
import Link from "next/link";
import {
  HeartHandshakeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "About HillCrest",
  description:
    "Why HillCrest exists and the principles behind how we build caregiver training, employment and care operations.",
};

export default function AboutPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <SectionHeading
          eyebrow="About HillCrest"
          title="Careers in care, built on real capability"
          description={`${brand.name} exists to make it easier for people to build a career in care — and for the people receiving care to be supported by capable, verified professionals.`}
        />
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-3">
          {[
            {
              icon: TargetIcon,
              title: "Our mission",
              body: "To connect training, supervised practice and employment so that competence — not connections — decides who gets to care.",
            },
            {
              icon: HeartHandshakeIcon,
              title: "Who we serve",
              body: "Aspiring and working caregivers, care homes and agencies, employers and recruiters, training partners, donors and the families who rely on quality care.",
            },
            {
              icon: ShieldCheckIcon,
              title: "How we work",
              body: "We build in defined phases and only claim what has been verified. We do not fabricate metrics, testimonials, accreditations or outcomes.",
            },
          ].map((item) => (
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
          eyebrow="What we are building"
          title="One connected platform"
          description="Rather than separate tools that do not talk to each other, HillCrest is a single platform where learning, practical experience, employment and care operations reinforce each other."
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            "Structured caregiver training with assessments and practical competency.",
            "Internships and placements with supervised evaluation.",
            "An employment marketplace with verification workflows.",
            "Care-home operations: residents, staff, shifts, care records and reporting.",
            "A referral programme with an auditable commission ledger.",
            "A charity with transparent scholarships and fund allocation.",
          ].map((point) => (
            <li
              key={point}
              className="flex gap-3 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
            >
              <SparklesIcon
                className="mt-0.5 size-5 shrink-0 text-brand-green"
                aria-hidden="true"
              />
              <span className="text-sm text-foreground">{point}</span>
            </li>
          ))}
        </ul>
      </SiteSection>

      <SiteSection>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            align="center"
            title="Build a career in care with us"
            description="Whether you are starting out, hiring, or supporting the mission, there is a place for you on HillCrest."
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
