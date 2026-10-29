import type { Metadata } from "next";
import Link from "next/link";
import {
  GraduationCapIcon,
  HeartHandshakeIcon,
  FileTextIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  HandHeartIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";

export const metadata: Metadata = {
  title: "Charity and Scholarships",
  description:
    "Charity campaigns raise funds for training access and scholarships. Scholarship applications are reviewed through a defined process. Awards and fund allocation are recorded transparently. Charity funds are kept separate from commercial operations.",
};

const whatWeSupport = [
  {
    icon: GraduationCapIcon,
    title: "Training access",
    body: "Raising funds to help remove barriers to accessing structured caregiver training.",
  },
  {
    icon: HandHeartIcon,
    title: "Scholarships",
    body: "Providing scholarships so that more people can start and complete their training.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Community support",
    body: "Supporting initiatives that widen access to care careers in communities that need it most.",
  },
];

const howDonationsUsed = [
  {
    icon: FileTextIcon,
    title: "Recorded transparently",
    body: "Donations, awards and fund allocation are recorded so they can be reported on transparently.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Separate from commercial operations",
    body: "Charity funds are kept separate from commercial operations, with clear boundaries.",
  },
  {
    icon: CheckCircleIcon,
    title: "Used for stated purpose",
    body: "Funds raised through charity campaigns go towards training access and scholarships as stated.",
  },
];

export default function CharityPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Charity and Scholarships"
              title="Widening access to care careers"
              description="Charity campaigns raise funds for training access and scholarships. Scholarship applications are reviewed through a defined process, and awards and fund allocation are recorded transparently."
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/donate">Donate</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to our team</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-navy">
              Our commitments
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Scholarship applications reviewed through a defined process",
                "Awards and fund allocation recorded transparently",
                "Charity funds kept separate from commercial operations",
                "Clear reporting on how funds are used",
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
          eyebrow="What we support"
          title="Training access and scholarships"
          description="We focus on practical ways to help more people start a career in care."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {whatWeSupport.map((item) => (
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
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="How donations are used"
            title="Transparent allocation"
            description="Charity funds are managed separately from commercial operations. Donations, awards and fund allocation are recorded so they can be reported on transparently."
          />
          <div className="grid gap-4">
            {howDonationsUsed.map((item) => (
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

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Scholarships"
            title="A defined review process"
            description="Scholarship applications are reviewed through a defined process. Awards are made based on published criteria, and all decisions and allocations are recorded."
          />
          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <p className="font-heading text-lg font-semibold text-brand-navy">
              What to know
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Applications go through a defined review process",
                "Awards follow published criteria",
                "Decisions and fund allocation are recorded transparently",
                "Charity funds remain separate from commercial operations",
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
            <div className="mt-6">
              <Button asChild>
                <Link href="/contact">Enquire about scholarships</Link>
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
            title="Help widen access to care careers"
            description="Donate to support training access and scholarships, or contact us to learn more."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/donate">Donate</Link>
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
