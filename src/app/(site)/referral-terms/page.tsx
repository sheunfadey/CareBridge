import type { Metadata } from "next";
import Link from "next/link";
import { InfoIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Referral Programme Terms",
  description:
    "How to join the CareBridge referral programme, how referrals are attributed, how commission is earned and paid out, and the rules for partners.",
};

export default function ReferralTermsPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Referral Programme Terms"
            description={`The rules for earning, tracking and receiving referral commission from ${brand.name}.`}
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
              1. About the referral programme
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The referral programme allows approved partners to introduce
              learners, trainees, employers or institutional customers to{" "}
              {brand.name} and to earn commission on qualifying purchases. It
              is a commercial arrangement between {brand.name} and the
              partner, and it sits alongside our{" "}
              <Link
                href="/terms"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>
              , which also apply to you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              2. Who can take part
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              To become a referral partner you must:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                be at least 18 years old and able to enter into a binding
                contract in Nigeria;
              </li>
              <li>
                apply to join and be approved by us, which may include checks
                on your identity, your organisation and the promotions you
                intend to run;
              </li>
              <li>
                have a registered account in good standing, with no unresolved
                refund, chargeback or policy breach;
              </li>
              <li>
                provide accurate information about who you are and who you
                refer, and keep it up to date.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              We may approve an individual, a training provider, an employer,
              a care organisation, a community group or an agency. Approval is
              at our discretion, may be subject to limits on the products you
              may refer, and may be suspended or withdrawn if the conditions
              of this programme are no longer met.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              3. How referrals are attributed and tracked
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You will be given referral codes and links to share. When
              someone uses your link or enters your code, we record the
              referral against your account. Attribution is handled as follows:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                An attribution is only created from a genuine visit or
                registration event, not from a browser redirect that has not
                been verified.
              </li>
              <li>
                An attribution window applies. A referral is only counted if
                the qualifying purchase happens within the window shown on the
                commission policy that applies to it.
              </li>
              <li>
                Where more than one partner could be credited, the published
                attribution model applies. We will not credit a partner
                retrospectively and then remove that credit to favour another
                partner.
              </li>
              <li>
                Duplicate attribution for the same customer is prevented, and
                you cannot transfer ownership of a referral to another
                partner.
              </li>
              <li>
                Referrals that later qualify for a refund, chargeback or
                dispute are handled under the refund and reversal rules of the
                applicable commission policy.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              You will be able to see attributed registrations, eligible
              purchases, pending, approved and paid commissions, and your
              payout history in your partner dashboard. Where click tracking
              is used, it is done in a way that respects our privacy notice
              and the preferences you have set.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              4. Commission policy
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Commission is calculated under the policy that applies to the
              qualifying transaction. Each commission record references the
              partner, the referred customer, the qualifying transaction, the
              commission policy applied, the calculation basis, the gross
              eligible amount, the commission amount, the currency, the status
              and the eligibility date.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Commission may be a percentage or a fixed amount, and may
                apply only to certain products. The current rates, eligible
                products and attribution window are published in your
                dashboard.
              </li>
              <li>
                Commission is calculated only from a verified payment event,
                never from an unverified browser payment redirect.
              </li>
              <li>
                A commission policy may change in future. A change applies to
                transactions that qualify after it takes effect. It never
                rewrites a commission that has already been earned, and it
                never reduces a commission that has already been paid.
              </li>
              <li>
                Every commission moves through a defined lifecycle: pending,
                eligible, approved, processing and paid. A commission may also
                be rejected, reversed, failed or placed on hold, for example
                while a payment is being reviewed.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              5. Qualifying conditions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A purchase qualifies for commission only when all of the
              following are met:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                the referred person has not previously registered with{" "}
                {brand.name} and is not an existing account;
              </li>
              <li>
                the referred person completes the qualifying event stated in
                the commission policy, normally a payment that has been
                confirmed by the payment provider;
              </li>
              <li>
                the purchase is for an eligible product and falls inside the
                attribution window;
              </li>
              <li>
                the account is in good standing and no refund, chargeback or
                dispute is raised against the transaction;
              </li>
              <li>
                the referral is not a self-referral and does not breach the
                fraud and abuse rules below.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Commission is not earned on products or events excluded from the
              applicable policy, which may include renewals, donations,
              scholarships, subscriptions paid by an organisation that is
              already a customer, and purchases by a member of your own
              household or organisation.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              6. Payout requests and approval
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Commission is held until it becomes eligible, then paid out on
              request. Outgoing referral payouts are handled as a separate
              workflow from incoming customer payments, so the two never
              affect each other.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                You can request a payout once you hold commission above the
                minimum payout threshold shown in your dashboard. A payout
                eligibility delay may apply, so that a transaction has settled
                before it is paid.
              </li>
              <li>
                Payout requests require payout details that you have
                verified and that belong to you. We may decline a request
                where details are incomplete, unverified or do not match the
                partner account.
              </li>
              <li>
                Every payout request is reviewed and approved or rejected by a
                member of our team. The decision and its reason are recorded
                against the request.
              </li>
              <li>
                Payments are made in {brand.currency} to the verified payout
                account. Fees charged by banks or transfer providers may
                reduce the amount received, and those fees are shown before
                approval.
              </li>
              <li>
                If a commission is reversed after a payout has been made, we
                may set it off against a later payout, and we will tell you
                why.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              7. Fraud, abuse and prohibited conduct
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The programme may only be used to promote {brand.name} honestly.
              The following are not permitted and will result in commission
              being withheld or reversed, and may lead to suspension or
              exclusion:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                self-referral, or referring an account that you control,
                including through a related account or a member of your
                household;
              </li>
              <li>
                creating duplicate accounts, sharing accounts, or using
                cookies, scripts or other automated means to claim
                attribution that is not yours;
              </li>
              <li>
                spam, bulk messaging, or any promotion that sends unwanted
                messages or content to people who have not asked for it;
              </li>
              <li>
                advertising that makes claims we have not made, including
                claims about accreditation, guaranteed employment outcomes,
                regulated qualifications or outcomes;
              </li>
              <li>
                bidding on our trade marks in a way that implies an official
                partnership, or misrepresenting your relationship with us;
              </li>
              <li>
                encouraging a customer to misstate their circumstances, or
                arranging a refund in order to be paid commission;
              </li>
              <li>
                charging a referred customer anything that they were not told
                about in advance, or misrepresenting the price of a product.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              8. Financial records
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Commission and payout records are kept in an append-only
              ledger. Entries are never edited to hide a change. Where
              something needs to be corrected, an adjustment or a reversal is
              recorded as a new entry that is linked to the original
              transaction, and the original entry stays visible. This keeps
              the history of what was earned, approved, paid and reversed
              intact and auditable.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              9. Taxes and your responsibilities as a partner
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You are responsible for your own tax position in relation to
              commission you receive. Unless we are required by law to do
              otherwise, commission is paid gross, and we do not deduct tax on
              your behalf. Where withholding is required, we will deduct it,
              report it and give you the information you need. We will provide
              a statement of commission earned and paid for the periods
              covered by this programme, and the applicable tax treatment
              will be confirmed in the final version of these terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              10. Changes to the programme
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We may change rates, eligible products, attribution windows,
              payout thresholds and other programme rules. Changes take effect
              going forward and are published in your dashboard and in the
              commission policy before they apply. We will not use a change to
              reduce commission that has already been earned, and we will not
              remove commission that has already been paid.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              11. Leaving the programme
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You may stop referring at any time. Commission already earned
              and approved remains payable, and we will continue to work
              through any payout request that was properly submitted. We may
              suspend or end a partnership where the eligibility conditions
              are no longer met or where the fraud and abuse rules have been
              breached, and we will give reasons for the decision. Support and
              payouts are handled in {brand.timeZone}.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              12. Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Questions about the referral programme, your commission records
              or a payout request can be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
