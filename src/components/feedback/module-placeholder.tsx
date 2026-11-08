import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
  planned: string[];
  breadcrumbs: { label: string; href?: string }[];
  children?: ReactNode;
};

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  phase,
  planned,
  breadcrumbs,
  children,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon />
              Dashboard
            </Link>
          </Button>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-sky text-brand-teal">
            <Icon className="size-6" />
          </span>
          <div className="space-y-3">
            <div>
              <p className="font-heading text-lg font-semibold text-brand-strong">
                Planned for {phase}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This module is part of the HillCrest roadmap and is not active
                yet. Nothing here is simulated.
              </p>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {planned.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {children}
          </div>
        </div>
      </Card>
    </div>
  );
}
