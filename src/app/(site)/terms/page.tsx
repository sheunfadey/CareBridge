import type { Metadata } from "next";
import Link from "next/link";
import { InfoIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of CareBridge: accounts, acceptable use, training, organisations, payments, referrals, donations, liability and governing law.",
};

export default function TermsPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Terms of Service"
            description={`These terms govern your use of ${brand.name} — the platform, the training, the marketplace, the care operations tools, the referral programme and the charity.`}
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
              version on this page. Until then, the platform is being built and
              some features described here may not yet be available.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        </div>
      </SiteSection>

      <SiteSection>
        <div className="max-w-3xl space-y-8">
          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              1. Agreement to these terms
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              These Terms of Service are a legal agreement between you and{" "}
              {brand.name} covering your access to and use of our website,
              applications, training, marketplace, referral programme and
              charitable giving services (together, the{" "}
              <span className="font-medium text-foreground">Services</span>).
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              By creating an account, purchasing a programme, subscribing to a
              service, donating, or otherwise using the Services, you agree to
              these terms and to our{" "}
              <Link
                href="/privacy"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and other policies referenced in these terms. If you do not agree
              with them, do not use the Services.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If you accept these terms on behalf of an organisation, you
              confirm that you are authorised to bind that organisation, and
              you must be at least 18 years old to do so.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              2. Accounts and eligibility
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You may use the Services if you are legally able to enter into a
              binding contract in Nigeria. If you are under 18, you may only
              use the Services with the involvement and consent of a parent or
              guardian, and you must have that person accept these terms on
              your behalf.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                You must provide accurate, current information when you
                register and keep it up to date.
              </li>
              <li>
                You are responsible for activity that happens under your
                account, including activity by a supervisor, employer or other
                person you give access to.
              </li>
              <li>
                You must keep your password confidential and tell us promptly
                if you think someone else has used your account.
              </li>
              <li>
                An organisation administrator manages the roles and
                permissions of members of their workspace. Roles determine what
                a member can see and do.
              </li>
              <li>
                We may ask you to verify your identity, your organisation or
                your right to work before we enable certain features.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              3. Acceptable use
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You must not use the Services to break the law, to infringe
              anyone&rsquo;s rights, or to put a person at risk. In
              particular, you must not:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Post or upload content that is false, misleading, unlawful,
                discriminatory, or infringes intellectual property or privacy
                rights.
              </li>
              <li>
                Attempt to access another person&rsquo;s account, records or
                organisation, or to test, probe or attack the platform or its
                security controls.
              </li>
              <li>
                Scrape, copy, reverse engineer or resell the Services, or
                attempt to extract training content for redistribution.
              </li>
              <li>
                Create accounts on behalf of others, or misrepresent your
                qualifications, employment history, references or identity.
              </li>
              <li>
                Use the Services to harass, abuse or harm another person, or
                to share content that identifies a resident, patient or child
                beyond what the appropriate organisation has authorised.
              </li>
              <li>
                Attempt to obtain a refund, credit, commission or scholarship
                through deception, duplicate accounts or multiple referrals in
                breach of the{" "}
                <Link
                  href="/referral-terms"
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  Referral Programme Terms
                </Link>
                .
              </li>
              <li>
                Interfere with the operation of the Services, including by
                introducing malicious code, probing for vulnerabilities without
                permission, or overloading the platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              4. Training, assessments and certificates
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Training on {brand.name} is delivered through structured
              programmes, lessons and assessments. By enrolling you agree to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Complete the learning activities and assessments honestly and
                as your own work.
              </li>
              <li>
                Meet the attendance, supervision and competency requirements
                that apply to your programme or placement.
              </li>
              <li>
                Accept that assessment results and competency records reflect
                what was actually demonstrated. Records may be reviewed and
                amended where a review identifies an error.
              </li>
              <li>
                Accept that a completion record issued by {brand.name}{" "}
                evidences completion of the programme on our platform. It is
                not a professional licence, registration, accreditation or
                guarantee that an employer will accept it.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Training providers are independent of {brand.name} where they
              are separately contracted, and we do not verify professional
              registrations on their behalf.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              5. Internships, placements and the employment marketplace
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Internships and placements are arranged with host organisations.
              A placement is a learning arrangement under supervision, and
              completing one does not make a participant a fully qualified
              caregiver. Host organisations are responsible for the supervision,
              safety and safeguarding arrangements at their site.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              The marketplace connects candidates with employers. Job listings
              are supplied by employers and are not endorsements or
              guarantees by {brand.name}. We do not guarantee that an
              application will receive a response, that a role will be filled,
              or that employment will follow. Unless a specific arrangement
              states otherwise, {brand.name} is not a party to any employment
              relationship between a candidate and an employer, and
              responsibility for employment obligations rests with the
              employer.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              6. Organisations, workspaces and subscriptions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Care homes, agencies, employers and training providers use{" "}
              {brand.name} as a multi-tenant workspace. Each organisation is
              responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                The accuracy and lawfulness of the data it enters about its
                staff, residents, clients and candidates.
              </li>
              <li>
                Managing its own membership, invitations, roles and
                permissions, and removing access when it should end.
              </li>
              <li>
                Complying with employment, care, record-keeping and
                safeguarding obligations that apply to it as an organisation.
              </li>
              <li>
                Paying subscription and setup fees for the plan it has chosen.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Subscriptions renew for the period selected at checkout and
              continue until cancelled. We will give reasonable notice of a
              renewal before it takes effect. A suspension for non-payment does
              not remove an organisation&rsquo;s right to export or read
              critical care and resident records where continuity of care
              requires it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              7. Content and intellectual property
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brand.name} and our licensors own the platform, its design, the
              training content we author, the assessment engine, the software,
              the trade marks and the documentation. These terms grant you a
              limited, revocable, non-exclusive licence to use the Services
              for their intended purpose while your account is active.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Your content.
                </span>{" "}
                You keep ownership of the content you upload. You grant us a
                limited licence to host, process, display and transmit it as
                needed to operate the Services for you and for the
                organisations you share it with.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Organisation content.
                </span>{" "}
                An organisation keeps ownership of the operational and care
                records it holds, subject to the rights of the individuals
                recorded in them.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Feedback.
                </span>{" "}
                If you send us suggestions, we may use them without
                restriction or obligation to you.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              We may remove content that breaches these terms or that we are
              required to remove by law.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              8. Payments, fees and taxes
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Fees for training, courses, subscriptions and other paid
              features are shown before you confirm a purchase and are charged
              in {brand.currency}. Payment is handled by a third-party payment
              provider on our behalf; the provider governs the payment method,
              the authorisations it requires and the timing of the funds
              reaching us. Prices may change, and we will show the current
              price before you pay.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Access to paid content begins once payment is confirmed, and
                a receipt is issued to the email address used for the
                purchase.
              </li>
              <li>
                Where a purchase attracts a referral commission, that
                commission is recorded separately from your payment and is
                governed by the{" "}
                <Link
                  href="/referral-terms"
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  Referral Programme Terms
                </Link>
                .
              </li>
              <li>
                If a purchase is refunded, any commission that was earned on it
                is handled under the published refund and reversal rules for
                the applicable commission policy.
              </li>
              <li>
                Fees exclude any taxes or deductions that the law requires us
                to collect or withhold.
              </li>
              <li>
                Refund requests are handled under our{" "}
                <Link
                  href="/refund-policy"
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  Refund Policy
                </Link>
                , which forms part of these terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              9. Referral programme
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Approved users may join the referral programme and earn
              commission on qualifying purchases. The referral programme is
              governed by the{" "}
              <Link
                href="/referral-terms"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Referral Programme Terms
              </Link>
              , which you must read and accept before taking part. Commission
              rates and policies are published and may change going forward,
              but a change never rewrites a commission that has already been
              earned.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              10. Charity, donations and scholarships
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Donations made through {brand.name} are voluntary contributions
              to our charitable and scholarship programmes. We handle
              donations separately from customer payments and from referral
              payouts, and we do not present donated funds as unrestricted
              company revenue.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                You can choose whether your donation is anonymous, and you can
                set your acknowledgement preferences.
              </li>
              <li>
                Donations are not refundable as a matter of course, and
                exceptions are handled under the{" "}
                <Link
                  href="/refund-policy"
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  Refund Policy
                </Link>
                .
              </li>
              <li>
                Scholarship awards are made against published eligibility
              criteria and are not guaranteed, and scholarship decisions are
                made without disclosing the identity of applicants.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              11. Suspension and termination
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You can close your account at any time by contacting us at{" "}
              {brand.supportEmail}. We may suspend or close an account, or
              limit access to part of the Services, where:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>you breach these terms or a policy referenced in them;</li>
              <li>
                we are required to do so by law, or to protect the safety of a
                person, a resident, a patient or a member of the public;
              </li>
              <li>
                your account has been compromised, or we reasonably suspect
                fraudulent, misleading or abusive activity;
              </li>
              <li>
                an organisation that administers your account suspends or
                removes your membership.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Where a suspension affects access to critical care or resident
              records, we will work with the organisation to preserve
              continuity of care. On termination, your access ends and your
              information is handled in line with the retention rules in our{" "}
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
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              12. Disclaimers
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The Services are provided on an as-is and as-available basis,
              for the purpose they are designed to serve. To the fullest
              extent permitted by law, we exclude implied warranties of
              merchantability, fitness for a particular purpose and
              non-infringement. In particular:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Training content is educational. It is not medical, legal or
                social-work advice, and it does not replace professional
                judgement or the requirements of your regulator, employer or
                supervising organisation.
              </li>
              <li>
                Nothing on {brand.name} is a guarantee of employment, income,
                sponsorship, immigration outcomes or a place on a course.
              </li>
              <li>
                Third-party content, including employer listings, training
                provider materials and organisation-generated records, is
                provided by those parties. We do not warrant that it is
                accurate, complete or current.
              </li>
              <li>
                We may change, suspend or discontinue features while the
                platform is being developed and operated.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              13. Liability
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing in these terms excludes or limits our liability for
              death or personal injury caused by our negligence, for fraud or
              fraudulent misrepresentation, or for any liability that cannot
              lawfully be excluded under Nigerian law.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Subject to that, and to the fullest extent permitted by law,{" "}
              {brand.name} is not liable for indirect or consequential loss,
              loss of profit, loss of opportunity, loss of anticipated
              savings, or loss or corruption of data, in each case arising
              from your use of the Services. Where we are liable for a
              failure to comply with these terms, our liability is limited to
              the amount you paid us for the specific Services affected in the
              twelve months before the event giving rise to the claim.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              You are responsible for keeping your own copies of important
              records. Where {brand.name} is used in a care setting, the
              organisation using it remains responsible for the care decisions
              it makes and for the accuracy of the records it enters.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              14. Indemnity
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              You agree to indemnify {brand.name} against claims, losses and
              reasonable costs arising from content you submit, your breach
              of these terms, your misuse of the Services, or your violation
              of the rights of another person.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              15. Governing law and disputes
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              These terms and any dispute arising out of or in connection with
              them are governed by the laws of Nigeria, and the courts of
              Nigeria have jurisdiction over them. Before starting formal
              proceedings, please raise the issue with us at{" "}
              {brand.supportEmail} so that we have a chance to resolve it. We
              will engage with the request in good faith and respond in
              writing.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              16. Changes to these terms
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We may revise these terms as the Services develop or as our legal
              obligations change. We will publish the revised version on this
              page with an updated date and, where a change is material, give
              you reasonable notice by email or an in-product notice before it
              takes effect. If you do not accept a material change, you may
              close your account before the change takes effect.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              17. Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Questions about these terms can be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              . Written notices to {brand.name} should be emailed to that
              address. Support is handled in {brand.timeZone}.
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
