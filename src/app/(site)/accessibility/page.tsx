import type { Metadata } from "next";
import Link from "next/link";
import { AccessibilityIcon, InfoIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "HillCrest's commitment to accessible design, the measures we have taken, the limitations we are still working on and how to report a barrier.",
};

export default function AccessibilityPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Accessibility Statement"
            description={`Our commitment to making ${brand.name} usable by everyone, what we have done so far, and what we are still working on.`}
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
              Our commitment
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brand.name} is used by people with very different needs, and
              some of our users are themselves working in care, often under
              time pressure and often on older devices. Accessibility is not a
              separate feature we add at the end. It is a requirement we
              apply to design, components and content from the point a screen
              is first drawn.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              We are working towards conformance with the Web Content
              Accessibility Guidelines (WCAG) 2.2 at Level AA. That is our aim
              and the standard we design and review against. We have not
              carried out a formal external audit, and we do not claim that
              the platform is fully conformant today. This statement describes
              what is in place, what is not yet right, and how to tell us
              about it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Measures we have taken
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Keyboard operation.
                </span>{" "}
                Interactive elements can be reached and operated with a
                keyboard, with a logical focus order, visible focus
                indicators and a skip link to move past repeated navigation.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Semantic structure.
                </span>{" "}
                Pages use headings, landmarks and lists so that assistive
                technology can understand the structure of the content, and
                the language of the page is declared.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Colour and contrast.
                </span>{" "}
                Text and interface colours are chosen to meet contrast
                requirements, and colour is not used on its own to convey
                meaning.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Text and layout.
                </span>{" "}
                Content reflows on small screens and remains usable when
                text is enlarged, and layouts do not depend on a fixed
                viewport.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Motion.
                </span>{" "}
                Animation is reduced for people who have asked their operating
                system to reduce motion, and no essential information is
                conveyed by animation alone.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Forms.
                </span>{" "}
                Form fields have visible labels, instructions where a field
                needs them, and error messages that identify the field and
                what to correct.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Images and media.
                </span>{" "}
                Meaningful images have alternative text, decorative images
                are marked as such, and video we host is captioned where we
                can provide it.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Responsive design.
                </span>{" "}
                The platform is built to work on mobile, tablet and desktop,
                including on modest mobile hardware and slower connections.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Known limitations
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The platform is still being built, and some areas are not yet
              where we want them to be. We would rather say so plainly than
              claim a standard we have not met. At the time of writing:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Some of the data visualisations in reporting are not yet fully
                described for screen reader users, and rely on a table
                alternative in some views.
              </li>
              <li>
                Some complex tables in the organisation area need further work
                on announcing row and column headers correctly.
              </li>
              <li>
                A small number of status indicators still rely on colour more
                than we would like, and are being converted to labelled
                text.
              </li>
              <li>
                Third-party embedded video, particularly material hosted
                outside {brand.name}, is not always fully captioned, and is
                controlled by the provider rather than by us.
              </li>
              <li>
                Printed and downloadable training materials are not yet
                produced in a fully tagged, accessible format.
              </li>
              <li>
                Parts of the platform have not yet been tested with a full
                range of assistive technologies, so some combinations of
                browser and screen reader may still behave inconsistently.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Reporting an accessibility issue
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              If you cannot do something on {brand.name}, or something is
              difficult to use with your assistive technology, please tell us.
              Email{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>{" "}
              with the subject line &ldquo;Accessibility issue&rdquo; and
              include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                the page or feature you were using, and the link if there is
                one;
              </li>
              <li>what you were trying to do, and what happened instead;</li>
              <li>
                the browser, device and assistive technology you were using,
                for example a screen reader version number;
              </li>
              <li>
                whether the issue stops you using the platform altogether, as
                this helps us prioritise.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              We will acknowledge your report and tell you what we intend to
              do about it. We cannot commit to a fixed resolution time until
              this policy is finalised, but accessibility issues that stop
              someone using the platform are treated as a priority.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Continuous improvement
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Accessibility is checked as part of how we build. New
              components are expected to meet the same standard as existing
              ones, and reusable patterns are used so that a fix applies
              across the platform rather than to a single page. We plan to
              test with keyboard-only use, with a screen reader, with
              increased text size and with reduced motion before a release
              goes out, and we intend to arrange an independent accessibility
              review before general availability.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              We will update this statement as the platform develops and as
              we close the limitations listed above. If you would like to
              know more about how we handle information in general, our{" "}
              <Link
                href="/privacy"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              explains that.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Accessibility questions and reports can be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              .
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <AccessibilityIcon className="size-4 shrink-0" aria-hidden="true" />
              If you need information from this page in a different format, ask
              us and we will provide it.
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
