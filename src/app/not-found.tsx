import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";
import { brand } from "@/config/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <LogoMark size={44} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">
          Error 404
        </p>
        <h1 className="text-2xl font-semibold text-brand-strong">
          We could not find that page
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page may have been moved or removed. Return to the {brand.name}{" "}
          dashboard to continue.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
