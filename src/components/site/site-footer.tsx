import Link from "next/link";
import { cacheLife } from "next/cache";

import { HillCrestLogo } from "@/components/brand/carebridge-logo";
import { brand } from "@/config/brand";
import { footerColumns } from "@/config/site-navigation";

async function getCopyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const year = await getCopyrightYear();

  return (
    <footer className="border-t border-border bg-brand-navy text-white/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_3fr]">
          <div className="space-y-4">
            <HillCrestLogo size="md" tone="onDark" />
            <p className="max-w-xs text-sm text-white/70">
              {brand.shortDescription}
            </p>
            <p className="text-sm text-white/75">
              <a
                href={`mailto:${brand.supportEmail}`}
                className="underline-offset-4 hover:text-white hover:underline"
              >
                {brand.supportEmail}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.label} className="space-y-3">
                <p className="font-heading text-sm font-semibold text-white">
                  {column.label}
                </p>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center">
          <p>
            © {year} {brand.name}. {brand.tagline}
          </p>
          <p>
            Nigeria · {brand.currency} · {brand.timeZone}
          </p>
        </div>
      </div>
    </footer>
  );
}
