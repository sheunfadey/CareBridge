import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelpIcon, MessageCircleIcon } from "lucide-react";

import { FaqAccordion } from "@/components/site/faq-accordion";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { homeFaqs, type FaqItem } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about CareBridge caregiver training, placements, employment, care-home operations, referrals, payments and charity support.",
};

const groupedFaqs: { title: string; items: FaqItem[] }[] = [
  {
    title: "Training",
    items: [
      {
        question: "Do I need any prior experience to start a programme?",
        answer:
          "No. Foundation programmes start with core care principles and do not assume previous experience. If you already work in care, your existing knowledge can help you move more quickly through parts of the content.",
      },
      {
        question: "How are the programmes structured?",
        answer:
          "Each programme is broken into modules and lessons, followed by assessments and practical competency checks. You can see what a programme covers before you enrol, and your progress is tracked as you work through it.",
      },
      {
        question: "Can I pause my training and come back to it?",
        answer:
          "Your progress and records are stored against your account, so you can return to your lessons and assessments rather than starting again. If you need a longer break, contact us and we will talk it through.",
      },
      {
        question: "Is my training record something I can show an employer?",
        answer:
          "Yes. Your completed modules, assessments and placement evaluations are held on your profile, and employers reviewing your application can see the record that actually exists rather than a summary written by hand.",
      },
    ],
  },
  {
    title: "Careers and employment",
    items: [
      {
        question: "How do internships and placements work?",
        answer:
          "A placement is a supervised practical placement with a care home, agency or family. A named supervisor is responsible for your practice, and the placement ends with a structured evaluation that is added to your record.",
      },
      {
        question: "How do I find work as a caregiver?",
        answer:
          "Caregivers with completed training records appear to employers in the platform, where vacancies, applications, interviews and offers are managed. Your history travels with you through the process.",
      },
      {
        question: "How are caregivers verified?",
        answer:
          "Verification is carried out through defined review workflows over the training and competency records held in the platform. The status shown against a profile reflects verification that has actually been completed.",
      },
      {
        question: "Can families hire a caregiver through the platform?",
        answer:
          "Yes. People seeking support can use the caregiver directory, review the records that are available, and arrange care directly with caregivers they choose.",
      },
    ],
  },
  {
    title: "For organisations",
    items: [
      {
        question: "What does a care home use CareBridge for?",
        answer:
          "Residents and staff records, shift planning, daily care records, maintained care plans, incident logging with an escalation path, inventory and purchases, invoices and operational reporting.",
      },
      {
        question: "How does an organisation get set up?",
        answer:
          "Your organisation is created, staff are invited with the roles that match their responsibilities, and access is enforced so that each organisation's data stays separate from every other organisation's.",
      },
      {
        question: "Can we host placements as an organisation?",
        answer:
          "Yes. Host organisations agree a schedule and name a supervisor for each placement, and the supervisor completes the structured evaluation at the end of it.",
      },
      {
        question: "How do we become a training or employer partner?",
        answer:
          "Training partners deliver programmes and host placements. Employer partners hire verified caregivers and give feedback. In both cases you start with a conversation about what you need and how it would fit your organisation.",
      },
    ],
  },
  {
    title: "Payments and referrals",
    items: [
      {
        question: "What currency are prices charged in?",
        answer:
          "CareBridge launches in Nigeria, so pricing is in Nigerian Naira (NGN) and local payment methods are supported. The platform is built so that additional regions can be supported over time.",
      },
      {
        question: "How does the referral programme work?",
        answer:
          "Partners introduce learners and organisations to CareBridge. Eligible referrals are tracked against a published commission policy, and commissions become payable only when they qualify under that policy.",
      },
      {
        question: "Can a referral commission be changed once it has been recorded?",
        answer:
          "Financial records are append-only. Amounts that have already been recorded are not silently rewritten; changes are added as new entries so the history stays intact.",
      },
      {
        question: "How are refunds handled?",
        answer:
          "Refund decisions follow the published refund policy, and each decision is recorded as an entry against the relevant payment rather than by editing the original record.",
      },
    ],
  },
  {
    title: "Charity",
    items: [
      {
        question: "What does the charity fund?",
        answer:
          "Charity campaigns raise funds for training access and scholarships, so that people who could not otherwise fund their training are able to start it.",
      },
      {
        question: "How are scholarship applications reviewed?",
        answer:
          "Applications are reviewed through a defined process, and both awards and the allocation of funds are recorded, so that the use of donated money can be reported on transparently.",
      },
      {
        question: "Are charity funds separate from commercial operations?",
        answer:
          "Yes. Charity funds are kept separate from commercial operations, and the records for each are distinct.",
      },
      {
        question: "How do I ask about a scholarship?",
        answer:
          "Write to us through the contact page and choose the charity and scholarships route. Tell us which programme you are interested in and what you need support with, and we will point you to the next step.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-sky px-3 py-1 text-xs font-medium text-brand-teal">
              <CircleHelpIcon className="size-3.5" aria-hidden="true" />
              Frequently asked questions
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
              Frequently asked questions
              <span className="text-gradient-care block">
                about training, work and the platform
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              The questions people ask {brand.name} most often, grouped by the
              area they relate to. If your question is not answered here, the
              help centre and the contact page are the next places to look.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/help">Visit the help centre</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-strong">
              On this page
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {["About CareBridge", ...groupedFaqs.map((group) => group.title)].map(
                (heading) => (
                  <li key={heading} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-teal"
                    />
                    {heading}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="About CareBridge"
          title="General questions"
          description="The starting point: what the platform is, how training works, and how the different parts fit together."
        />
        <div className="mt-8">
          <FaqAccordion items={homeFaqs} />
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="More answers"
          title="Questions by topic"
          description="Each group below covers one area of the platform in more detail."
        />
        <div className="mt-10 space-y-12">
          {groupedFaqs.map((group) => (
            <div key={group.title}>
              <h3 className="font-heading text-xl font-semibold text-brand-strong">
                {group.title}
              </h3>
              <div className="mt-4">
                <FaqAccordion items={group.items} />
              </div>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            eyebrow="Still stuck"
            title="Ask us directly"
            description="If the answer you need is not here, write to us and we will point you to it or answer it ourselves."
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
              <Link href="/help">Help centre</Link>
            </Button>
          </div>
          <p className="text-sm text-white/70">
            <MessageCircleIcon
              className="mr-1.5 inline size-4 align-text-bottom"
              aria-hidden="true"
            />
            Support is available by email at{" "}
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
