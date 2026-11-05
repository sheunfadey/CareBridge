import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoyIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Help centre",
};

const helpLinks = [
  {
    title: "Frequently asked questions",
    description: "Answers about accounts, courses, placements and payments.",
    href: "/faq",
  },
  {
    title: "How CareBridge works",
    description: "The pathway from training through to employment.",
    href: "/how-it-works",
  },
  {
    title: "Safeguarding",
    description: "How we protect learners, caregivers and the people in their care.",
    href: "/safeguarding",
  },
  {
    title: "Verify a certificate",
    description: "Check that a CareBridge certificate is valid and unrevoked.",
    href: "/verify-certificate",
  },
];

export default function DashboardHelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Help centre"
        description="Find guidance on using CareBridge, or get in touch with the platform team."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help centre" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/help">Public help centre</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {helpLinks.map((link) => (
          <Card key={link.href} className="flex flex-col p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-sky text-brand-teal">
              <LifeBuoyIcon className="size-5" />
            </span>
            <h2 className="mt-3 font-heading font-semibold text-brand-strong">
              {link.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {link.description}
            </p>
            <Button variant="link" className="mt-2 h-auto px-0" asChild>
              <Link href={link.href}>Open</Link>
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
          Need more help?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Email support and we will respond during working hours. Include your
          account email and a short description of the issue.
        </p>
        <Button className="mt-3" asChild>
          <Link href="/contact">Contact support</Link>
        </Button>
      </Card>
    </div>
  );
}
