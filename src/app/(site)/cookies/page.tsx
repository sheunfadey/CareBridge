import type { Metadata } from "next";
import Link from "next/link";
import { CookieIcon, InfoIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Cookie and Privacy Preferences",
  description:
    "What cookies and similar technologies CareBridge uses, the categories we apply, why some are required for sign-in, and how to control your preferences.",
};

export default function CookiesPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Cookie and Privacy Preferences"
            description={`How ${brand.name} uses cookies and similar technologies, and the choices available to you.`}
          />
          <div className="rounded-xl border border-brand-warning/30 bg-brand-sky p-5">
            <p className="flex items-start gap-2 font-heading text-sm font-semibold text-brand-strong">
              <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Working draft
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This document is a working draft. It has not yet been reviewed by
              legal counsel and it does not constitute legal advice. We will
              finalise it before general availability and publish the final
              version on this page.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        </div>
      </SiteSection>

      <SiteSection>
        <div className="max-w-3xl space-y-8">
          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              What cookies are
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A cookie is a small text file placed on your device by a website
              or application. Cookies and similar technologies, such as local
              storage, allow a service to remember you between visits and to
              work correctly. They can be set by us or, where we embed
              third-party content, by the provider of that content.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              The categories we use
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Strictly necessary.
              </span>{" "}
              These are used to keep the platform secure and working. They
              include session and authentication cookies that sign you in and
              keep you signed in, cookies that protect forms against
              cross-site request forgery, cookies that remember a security
              choice you have made, and cookies that help us balance traffic
              across our servers. They are set because the service cannot
              operate without them, and they are not used for advertising.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Functional and preference cookies.
              </span>{" "}
              These remember choices such as your colour theme, language and
              interface settings, so that the platform looks and behaves the
              same way when you return. They do not build a profile of you for
              advertising.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Analytics.</span>{" "}
              If, and only if, we configure analytics for the platform, these
              would help us understand which features are used and where the
              service is slow or difficult to use. Analytics are not switched
              on by default and no analytics cookies are set unless they have
              been configured and you have given consent where consent is
              required. We will list any analytics provider we introduce, and
              the categories it falls into, in this page.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Marketing and measurement.
              </span>{" "}
              {brand.name} does not currently run marketing cookies. If we
              introduce advertising or campaign measurement, it will be
              described here first, it will be consent-based where required,
              and you will be able to decline it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Cookies required for sign-in
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Some cookies are required for authentication to function. They
              identify your session and confirm that you are signed in, and
              they prevent another website from using your session without
              your knowledge. If you clear or block these cookies in your
              browser, you will be signed out, you may not be able to reach
              your dashboard, and parts of the platform will not work
              correctly. We will always ask before making an optional cookie
              optional, and we will never ask you to accept an authentication
              cookie as a condition of using the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Third-party content
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Some training materials are hosted by third parties, such as
              video platforms. Where we embed that content, the provider may
              set its own cookies or receive technical information such as
              your IP address under its own privacy policy. We use supported
              embedding methods and limit what is shared. Where a third party
              offers a privacy or cookie choice of its own, we will point you
              to it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              How to manage your preferences
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You can control cookies through your browser settings. Every
              modern browser lets you view and delete cookies, block cookies
              from particular sites, and clear cookies automatically when you
              close the browser. Blocking strictly necessary cookies will stop
              parts of {brand.name} from working.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              A preference control inside the platform, where you can see and
              change optional cookies without leaving the site, is being
              finalised and is not yet live. We will introduce it with a
              consent prompt and describe it on this page when it goes live.
              Until then, please use your browser controls, and contact us at{" "}
              {brand.supportEmail} if you have a question about a specific
              cookie.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              How we make decisions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Where a choice is required, we will ask you for consent before
              setting optional cookies, and you may change your mind at any
              time. We do not use consent to hide marketing, and we do not
              make the platform harder to use if you decline optional
              technologies. Our general approach to personal data is described
              in our{" "}
              <Link
                href="/privacy"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Changes to this page
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We will update this page whenever we add, remove or change a
              cookie or a similar technology, and whenever we introduce a new
              provider. The date at the top shows when it was last revised.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Questions about cookies, privacy preferences or any privacy
              request can be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              .
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CookieIcon className="size-4 shrink-0" aria-hidden="true" />
              {brand.name} is still being built, so this list of cookies is
              expected to grow and change before general availability.
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
