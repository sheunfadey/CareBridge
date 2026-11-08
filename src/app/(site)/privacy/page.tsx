import type { Metadata } from "next";
import Link from "next/link";
import { InfoIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How HillCrest collects, uses, shares and protects personal data across training, employment, care operations, referrals and charitable giving.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Privacy Policy"
            description={`This policy explains what personal data ${brand.name} collects, why we collect it, who we share it with, how long we keep it and the choices available to you.`}
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
              Who we are and what this policy covers
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brand.name} provides caregiver training, supervised placements,
              an employment marketplace, care operations software for care
              organisations, a referral programme and a charity and scholarship
              programme. This policy describes how we handle personal data
              across all of those services, including our public website and
              your account.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              It applies to learners, caregivers, applicants, trainees,
              interns, supervisors, organisation members, referral partners,
              donors, scholarship applicants, visitors to this website and
              anyone who contacts us. Where an organisation uses {brand.name}{" "}
              to manage its own workforce or residents, that organisation
              controls the personal data it collects and its own privacy
              notices apply to you as well.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Information we collect
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We collect only what the services reasonably require. Depending on
              how you use {brand.name}, that may include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Account and profile information.
                </span>{" "}
                Your name, email address, phone number, password (stored in a
                hashed form), profile photo, job title, location area and
                communication preferences.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Training, assessment and competency records.
                </span>{" "}
                Course enrolments, module completion, assessment attempts and
                results, observed competency during supervised placements,
                certificates issued, document expiry dates and verification
                status.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Placement and employment information.
                </span>{" "}
                Applications, interviews, offers, supervision records,
                attendance, verification checks and employment status.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Organisation and workspace information.
                </span>{" "}
                Your role, permissions and membership within an organisation,
                invitations you receive, and the operational records an
                organisation holds about you.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Payment and transaction information.
                </span>{" "}
                Transaction references, amounts, currency ({brand.currency}),
                status and invoices. Payments are processed by a third-party
                payment provider, so we receive a payment confirmation rather
                than your full card details.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Referral, donation and scholarship information.
                </span>{" "}
                Referral codes and attributed registrations, commission
                entries, payout requests, donation records, acknowledgement
                preferences and scholarship applications.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Communications and support.
                </span>{" "}
                Messages you send us, support tickets, feedback and survey
                responses.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Technical information.
                </span>{" "}
                IP address, device and browser type, pages viewed, approximate
                  location derived from your IP address, and diagnostic
                information generated when you interact with the platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Why we use your information and on what grounds
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We process personal data for the following purposes:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                To provide the services you ask for, including delivering
                training, recording competency, supporting placements and
                managing applications.
              </li>
              <li>
                To operate your account, authenticate you, maintain sessions
                and provide support.
              </li>
              <li>
                To process payments, issue receipts, calculate commissions and
                payouts, and keep accurate financial records.
              </li>
              <li>
                To verify records, run safeguarding checks where a placement
                requires them, and protect people in our care.
              </li>
              <li>
                To improve the platform, investigate errors and understand how
                features are used.
              </li>
              <li>
                To send service messages about your account, training,
                placements and transactions, and marketing messages where you
                have asked to receive them.
              </li>
              <li>
                To meet legal, regulatory, accounting and safeguarding
                obligations that apply to us and to our customers.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              In general terms, we rely on one or more of the following
              grounds: performing the contract you have entered into with us;
              complying with a legal obligation; protecting vital interests
              where there is a serious risk to life or health; carrying out
              tasks in the public interest; pursuing legitimate business
              interests that are not outweighed by your rights and freedoms;
              and, where you have given consent, your consent. We apply these
              grounds in line with the Nigeria Data Protection Act and related
              requirements, and we ask for consent where consent is the
              appropriate ground. You can withdraw consent at any time without
              affecting the lawfulness of processing carried out before the
              withdrawal.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Cookies and similar technologies
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We use cookies and similar storage technologies that are needed
              to keep you signed in and to protect the security of the
              platform. Where optional storage is used, such as remembering
              your interface preferences, we explain it and give you a way to
              control it. The full picture is set out in our{" "}
              <Link
                href="/cookies"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Cookie and Privacy Preferences
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Who we share information with
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We do not sell personal data. We share it only with the
              following categories of recipient, and only to the extent needed
              to deliver the service:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Organisations you belong to.
                </span>{" "}
                Care homes, agencies, employers and training providers can see
                the profile, training, competency and operational information
                that falls within their permissions and their legitimate
                interest in assessing and supporting you.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Placement and training partners.
                </span>{" "}
                Host organisations and supervisors who host a placement receive
                the supervision, attendance and competency information needed
                to run it.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Service providers.
                </span>{" "}
                Our hosting, payment, email, storage and monitoring suppliers
                process data on our instructions under written terms.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Professional advisers and authorities.
                </span>{" "}
                Where we are required or permitted by law, we may disclose
                information to regulators, auditors, courts or emergency
                services.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Your connections.
                </span>{" "}
                Other users see the parts of your profile you choose to
                publish, such as your availability, experience and verified
                status.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Some information you see in {brand.name} is provided by
              organisations rather than by you. For example, a care home may
              record shift information, and a supervisor may record a
              competency observation. That organisation decides what it
              collects and how long it keeps it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              How long we keep information
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We keep personal data for as long as we need it for the purpose
              it was collected, which normally means for the life of your
              account and for as long afterwards as we need to evidence the
              training, competency and work history we hold. We also keep
              records for the period required to meet legal, accounting,
              regulatory and safeguarding obligations, to resolve disputes and
              to enforce our agreements.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              When information is no longer needed, we delete it or anonymise
              it so that it can no longer be linked back to you. A record
              retention schedule, listing how long each category of record is
              kept, will be published with the final version of this policy.
              If you ask us to delete your account, we will remove or
              anonymise your personal information, except where we are
              required to retain it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Your rights
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Depending on the circumstances, you have the right to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Ask what personal data we hold about you, request a copy and
                ask us to correct anything that is inaccurate or incomplete.
              </li>
              <li>
                Ask us to delete your personal data where we are not required
                or permitted to keep it.
              </li>
              <li>
                Object to or restrict certain uses of your data, and withdraw
                consent where we are relying on consent.
              </li>
              <li>
                Receive your data in a portable, machine-readable format.
              </li>
              <li>
                Not be subject to an automated decision that produces legal or
                similarly significant effects. {brand.name} does not use
                automated profiling to make decisions about you.
              </li>
              <li>
                Lodge a complaint with the Nigeria Data Protection Commission,
                the supervisory authority for data protection in Nigeria.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              To exercise a right, contact us at {brand.supportEmail} from the
              email address registered to your account. We may ask you to
              confirm your identity before we act. We aim to respond within a
              reasonable period, and our final response times will be stated
              once this policy is finalised.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              How we protect information
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Security is treated as a core requirement of the platform. The
              measures we apply include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Access control.
                </span>{" "}
                Role-based permissions, so that people see only the information
                their role requires, with administrators holding the broadest
                access.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Database-level isolation.
                </span>{" "}
                Row-level security in the database, so that organisation
                membership is enforced by the data store itself and not only
                by the interface.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Audit logging.
                </span>{" "}
                Records of access to sensitive records and of administrative
                actions, so that activity can be reviewed after the fact.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Secure development.
                </span>{" "}
                Input validation, output encoding, least-privilege database
                permissions, secure session cookies, secret management and
                dependency vulnerability checks.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Payment isolation.
                </span>{" "}
                Card details are handled by our payment provider and are not
                stored on our systems.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Incident response.
                </span>{" "}
                A process for investigating suspected breaches, limiting
                harm and meeting any notification obligations.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              No system is perfectly secure. If you believe your account has
              been accessed improperly, contact {brand.supportEmail} straight
              away and change your password.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Children and safeguarding-related data
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brand.name} is a professional platform and is not directed at
              children. Training and placement participants are expected to be
              adults, or to hold the consent of a parent or guardian where
              that is required for the activity they are taking part in.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Where a placement, internship or employment arrangement
              involves a child or a vulnerable adult, the host organisation
              holds the detailed personal and care information and is
              responsible for that data. We apply additional safeguards to
              those records, including stricter access control, and we treat
              safeguarding concerns as a priority. Our approach is set out in
              the{" "}
              <Link
                href="/safeguarding"
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                Safeguarding Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Transfers and service providers outside Nigeria
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We and some of our suppliers operate outside Nigeria. Where
              personal data is transferred, we take steps to protect it, for
              example by using contractual safeguards with the recipient and
              by minimising what is transferred. The arrangements we rely on
              will be described in the final version of this policy.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Changes to this policy
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We update this policy when our services or our legal
              obligations change. Where a change materially affects how we use
              your data, we will tell you before it takes effect, by email or
              by an in-product notice. The date at the top of this page
              always shows when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-strong">
              Contact us
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Questions, requests and complaints about this policy or about
              the way we handle personal data can be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>
              . Please describe your request clearly and use the email address
              registered to your account where the request concerns your own
              records.
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
