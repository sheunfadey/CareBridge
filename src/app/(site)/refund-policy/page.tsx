import type { Metadata } from "next";
import Link from "next/link";
import { InfoIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "When a CareBridge purchase can be refunded, how to request a refund, how refunds are processed through our payment provider and what is not refundable.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Refund Policy"
            description={`What can be refunded on ${brand.name}, how to ask for a refund and how long it takes to get your money back.`}
          />
          <div className="rounded-xl border border-brand-warning/30 bg-brand-sky p-5">
            <p className="flex items-start gap-2 font-heading text-sm font-semibold text-brand-navy">
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
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              What this policy covers
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This policy applies to payments made to {brand.name} for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>paid training programmes and course purchases;</li>
              <li>
                organisation subscriptions and other paid features for care
                homes, agencies, employers and training providers;
              </li>
              <li>
                assessment, verification or certification fees charged as a
                separate item.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              It does not apply to referral commission payouts received by
              partners, which are governed by the{" "}
              <Link
                href="/referral-terms"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Referral Programme Terms
              </Link>
              . Donations and contributions to our charitable and scholarship
              programmes are covered by a separate section below, because they
              are not purchases of a service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              When a refund can be requested
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We assess refund requests case by case against the terms of the
              product you bought and the circumstances of the request. A
              request is more likely to be approved where:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                you made the purchase in error, for example by enrolling in the
                wrong programme or buying a duplicate place;
              </li>
              <li>
                you were charged twice for the same purchase, or a payment
                was taken for something you did not buy;
              </li>
              <li>
                the programme, course or feature you paid for was
                discontinued, materially changed, or could not be delivered;
              </li>
              <li>
                your placement or subscription was cancelled by us, for example
                because a host organisation was not approved or the service
                could not proceed;
              </li>
              <li>
                you have a recognised consumer protection right that applies to
                the purchase.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Where a request is approved but does not meet an automatic
              entitlement, we may offer a goodwill credit or a place on a
              future programme instead of a monetary refund. We will explain
              the options available in each case.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Request windows
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Refund windows differ by product, and the window that applies is
              the one in force when the purchase was made. In general terms:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Training and courses.
                </span>{" "}
                A request made before you begin the programme is assessed as a
                change of mind. After you begin, the position depends on how
                much of the programme has been completed and whether
                assessments or certification have been issued.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Subscriptions.
                </span>{" "}
                A subscription may be cancelled and not renewed; a refund of
                the current period is considered where the service was not
                used or was unavailable for a significant part of the period.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Placements and internships.
                </span>{" "}
                Requests are considered against the placement agreement, the
                attendance recorded and whether the placement took place.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              The exact windows, deadlines and any fees that apply will be
              published per product once the final version of this policy is
              approved. Until then, no specific number of days is a guarantee.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              How to request a refund
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Email {brand.supportEmail} from the address used for the
                purchase, or contact us from inside your account.
              </li>
              <li>
                Give us the email address of the account, a description of what
                you bought and the reason for the request.
              </li>
              <li>
                Include the payment reference or transaction identifier from
                your receipt if you have it. It helps us find the payment
                quickly.
              </li>
              <li>
                We will acknowledge the request, tell you what information we
                still need, and give you a decision with reasons.
              </li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">
              We will not process a refund on request to an organisation or
              agent who is not authorised to make it on your behalf. For an
              organisation subscription, the administrator of the workspace
              must make the request.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              How refunds are processed
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Refunds are returned through the payment provider that took the
              original payment, using the same method you paid with. We do not
              refund to a different account or to a third party, because we
              cannot verify the requester that way and it creates a risk of
              fraud.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Once a refund is approved, we instruct the payment provider to
                return the funds. The time the money takes to appear depends
                on the provider and on your bank or card issuer, and is
                outside our control.
              </li>
              <li>
                Some providers charge a processing fee, or do not return the
                original fee. Where that applies, we will say so before
                approving the refund.
              </li>
              <li>
                A partial refund may be issued where only part of the purchase
                can be returned. The amounts involved are shown on your
                refund record.
              </li>
              <li>
                Any referral commission earned on the refunded purchase is
                handled under the refund and reversal rules of the applicable
                commission policy, and may be reversed.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              What is not refundable
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The following are generally not refundable:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                assessments that have been completed and certificates or
                completion records that have already been issued;
              </li>
              <li>
                individual lessons, modules or placements that have already
                been attended, supervised or delivered;
              </li>
              <li>
                bookings that you fail to attend, or placements that begin
                without the required checks being completed, unless the
                request is caused by our error;
              </li>
              <li>
                add-on services such as one-to-one support, verification
                handling or certificate reissue that have already been
                carried out;
              </li>
              <li>
                amounts spent on products consumed outside {brand.name}, such
                as travel, accommodation or equipment bought through a
                third-party provider;
              </li>
              <li>
                payments made with a fraudulent or unauthorised card, which we
                handle with the payment provider and the issuing bank instead
                of a direct refund;
              </li>
              <li>
                referral commission payouts, which are dealt with under the{" "}
                <Link
                  href="/referral-terms"
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  Referral Programme Terms
                </Link>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Donations and charitable contributions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Donations made through {brand.name} are contributions to a
              charitable and scholarship programme, not purchases of a service.
              They are therefore not refundable as a matter of course, and
              they are not treated as consumer transactions under this
              policy.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If a donation was made in error, for example by entering the
              wrong amount, contact us promptly and we will look at it. Where
              a donation has already been allocated, disbursed or awarded to
              a scholarship, it cannot be reversed. Donations are recorded and
              reported in line with our charity programme and the donor
              preferences you selected, including whether you asked us to
              identify you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              How refund status is communicated
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We record every refund request and decision against the original
              transaction. You will be told, by email and in your account where
              applicable, whether your request was approved, partly approved,
              or declined, and why. Where a request is approved, the refund
              reference and the expected timeline are shown against the
              transaction. Requests that we cannot progress because we are
              waiting on information from you are marked as awaiting
              information, so that you always know where things stand.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Disputes
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              If you disagree with a decision, reply to the decision email and
              ask for a review. A different person will review the case. These
              terms are governed by the laws of Nigeria, and the courts of
              Nigeria have jurisdiction over any dispute that remains
              unresolved.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Refund requests and questions about this policy can be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              . Please include the transaction reference so that we can locate
              your payment.
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
