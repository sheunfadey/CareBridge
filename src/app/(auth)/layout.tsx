import Link from "next/link";

import { HillCrestLogo } from "@/components/brand/carebridge-logo";
import { brand } from "@/config/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <main
        id="main-content"
        className="flex flex-col items-center justify-center px-4 py-10 sm:px-8"
      >
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HillCrestLogo size="md" />
          </Link>
          {children}
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-brand-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #087FE533 0%, transparent 45%), radial-gradient(circle at 85% 75%, #20C84033 0%, transparent 45%)",
          }}
        />
        <div className="relative">
          <HillCrestLogo size="md" tone="onDark" />
        </div>
        <div className="relative max-w-md space-y-4 text-white">
          <h2 className="font-heading text-3xl font-semibold leading-tight text-white">
            {brand.tagline}
          </h2>
          <p className="text-sm text-white/75">
            One platform for caregiver training, verified practical experience,
            employment pathways and care operations across Nigeria.
          </p>
        </div>
        <p className="relative text-xs text-white/70">
          {brand.name} · {brand.currency} · {brand.timeZone}
        </p>
      </aside>
    </div>
  );
}
