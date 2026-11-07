"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { ChevronDownIcon, MenuIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { CareBridgeLogo } from "@/components/brand/carebridge-logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { primarySiteNav } from "@/config/site-navigation";
import { cn } from "cn";

function SiteHeaderContent() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.user));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CareBridgeLogo size="sm" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {primarySiteNav.map((group) => (
            <div key={group.label} className="group relative">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-haspopup="true"
              >
                {group.label}
                <ChevronDownIcon className="size-3.5" aria-hidden="true" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-72 translate-y-1 rounded-xl bg-popover p-2 opacity-0 shadow-lg ring-1 ring-foreground/10 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {link.label}
                    </span>
                    {link.description ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {link.description}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={signedIn ? "/dashboard" : "/login"}>
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
          </Button>
          {signedIn ? null : (
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] max-w-[85vw] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-4 px-4 pb-6">
              {primarySiteNav.map((group) => (
                <div key={group.label} className="flex flex-col gap-1">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.links.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                          pathname === link.href
                            ? "text-brand-teal"
                            : "text-foreground",
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setOpen(false);
                  }}
                  className="justify-start"
                >
                  {theme === "dark" ? (
                    <>
                      <SunIcon className="mr-2 size-4" /> Switch to light mode
                    </>
                  ) : (
                    <>
                      <MoonIcon className="mr-2 size-4" /> Switch to dark mode
                    </>
                  )}
                </Button>
                <SheetClose asChild>
                  <Button variant="outline" asChild>
                    <Link href={signedIn ? "/dashboard" : "/login"}>
                      {signedIn ? "Dashboard" : "Sign in"}
                    </Link>
                  </Button>
                </SheetClose>
                {signedIn ? null : (
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/register">Get started</Link>
                    </Button>
                  </SheetClose>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderFallback />}>
      <SiteHeaderContent />
    </Suspense>
  );
}

function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CareBridgeLogo size="sm" />
        </Link>
      </div>
    </header>
  );
}
