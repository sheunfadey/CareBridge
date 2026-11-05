import type { Metadata } from "next";
import Link from "next/link";
import {
  HeartHandshakeIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  ReceiptTextIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { FaqAccordion } from "@/components/site/faq-accordion";
import type { FaqItem } from "@/config/site-content";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support CareBridge scholarships and campaigns that widen access to quality caregiver training.",
};

const donationFaqs: FaqItem[] = [
  {
    question: "Is online giving available yet?",
    answer:
      "Not yet. Secure online donations are being implemented as part of a later phase, together with transparent receipts and campaign reporting. We will not present a payment flow until it is genuinely live and verified.",
  },
  {
    question: "How can I support CareBridge now?",
    answer:
      "You can register your interest through our contact page. If you represent an organisation that would like to sponsor scholarships or partner with a campaign, we would be glad to talk.",
  },
  {
    question: "How are charity funds kept separate?",
    answer:
      "Charity funds are kept separate from commercial operations. Awards and fund allocation are recorded so that donations can be reported on transparently, and financial history is never silently rewritten.",
  },
  {
    question: "Will I receive a receipt?",
    answer:
      "Receipts and donation history will be provided once online giving launches. We will only issue receipts for payments that have actually been processed.",
  },
];

export default function DonatePage() {
  return (
    <>
      <SiteSection tone="ivory">
        <SectionHeading
          eyebrow="Donate"
          title="Help widen access to quality care training"
          description="Your support funds scholarships so that capable people are not held back by the cost of training — and so that more people can receive safe, dignified care."
        />
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="What your support does"
              title="Transparent, recorded, and kept separate"
              description="Charity funds are separate from commercial operations. Scholarships are awarded through a defined review process, and awards and allocation are recorded so donations can be reported on."
            />
            <ul className="grid gap-4">
              {[
                {
                  icon: GraduationCapIcon,
                  title: "Training access",
                  body: "Funded places on caregiver programmes for people who could not otherwise afford them.",
                },
                {
                  icon: HeartHandshakeIcon,
                  title: "Scholarships",
                  body: "Support through a defined application and review process, not discretionary hand-outs.",
                },
                {
                  icon: ReceiptTextIcon,
                  title: "Recorded allocation",
                  body: "Awards and fund allocation are recorded, so campaigns can be reported on with real figures.",
                },
                {
                  icon: ShieldCheckIcon,
                  title: "Separation of funds",
                  body: "Charity funds are kept separate from commercial operations and are auditable.",
                },
              ].map((item) => (
                <li
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
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-strong">
              Give today
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Online giving is not yet live. We are building secure payments,
              receipts and campaign reporting first, and we will not present a
              payment option until it is genuinely working.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              To register your interest or discuss sponsoring scholarships,
              contact us at{" "}
              <a
                href={`mailto:${brand.supportEmail}?subject=Charity%20and%20scholarships`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/charity">About the charity</Link>
              </Button>
            </div>
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="Questions"
          title="About giving to CareBridge"
        />
        <div className="mt-8 max-w-3xl">
          <FaqAccordion items={donationFaqs} />
        </div>
      </SiteSection>
    </>
  );
}
