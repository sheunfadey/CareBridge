import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Safeguarding Policy",
  description:
    "How CareBridge handles safeguarding concerns about children and vulnerable adults, how to report a concern, and how concerns are reviewed and escalated.",
};

export default function SafeguardingPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            eyebrow="Legal"
            title="Safeguarding Policy"
            description={`Our commitment to protecting children and vulnerable adults, how to raise a concern, and what happens when you do.`}
          />
          <div className="rounded-xl border border-brand-warning/30 bg-brand-sky p-5">
            <p className="flex items-start gap-2 font-heading text-sm font-semibold text-brand-navy">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
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
              Our commitment
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brand.name} exists to support people who care for others, and
              that work brings us into contact with children and with adults
              who are vulnerable because of age, disability, illness or
              circumstance. We are committed to designing the platform so that
              safeguarding is treated as a core requirement rather than an
              afterthought, and so that concerns are acted on promptly when
              they are raised.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              This policy sets out what we do, what we ask the organisations
              that use {brand.name} to do, and how anyone can raise a concern
              with us. It applies to every part of the platform, whether the
              person affected is a learner, a trainee, an intern, a caregiver,
              a resident, a client or a visitor.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Scope and our role
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {brand.name} is a platform provider. We are not a care
              provider, an employer, a training provider or a regulator, and
              this policy does not describe us as one. Care homes, agencies,
              host organisations and training providers that use the platform
              remain responsible for the safeguarding of the people in their
              care, for their own staff and volunteers, and for the records
              they hold.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Our role is to make safeguarding possible in practice: to
              provide documented processes for raising concerns, to control
              access to sensitive records, to record who did what and when, to
              support placements only where the required checks are in place,
              and to act on concerns that are raised with us.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              How to raise a concern
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              If you are worried about the safety or welfare of a child or a
              vulnerable adult, you can raise it with us directly:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                email{" "}
                <a
                  href={`mailto:${brand.supportEmail}`}
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  {brand.supportEmail}
                </a>{" "}
                with the subject line &ldquo;Safeguarding concern&rdquo;;
              </li>
              <li>
                contact us through the support route in your account, if you
                already have one.
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Please include, as far as you can: the name of the person or
              people involved, what happened, when and where it happened, what
              you have already done, and how we can reach you. You do not need
              to have proof, and you will not be expected to investigate the
              matter yourself. If you would rather not put it in writing,
              contact us and we will agree another way with you.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If you are worried that a child or vulnerable adult is in
              immediate danger or at risk of serious harm, contact the
              appropriate local emergency services or the relevant safeguarding
              authority in your area straight away, and then tell us. Do not
              wait for a platform response. Ordinary in-app notifications and
              support messages are not an emergency channel and should not be
              relied on where there is an urgent risk to life.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If the concern relates to someone working in a care home, agency
              or other organisation, tell that organisation as well. They hold
              the duty of care and the detailed records, and they may be able
              to act faster than we can.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              How concerns are reviewed and escalated
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Concerns are handled in the following way:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Acknowledgement.
                </span>{" "}
                We confirm that we have received the concern and tell you what
                will happen next.
              </li>
              <li>
                <span className="font-medium text-foreground">Triage.</span>{" "}
                A nominated safeguarding contact reviews the concern, decides
                whether it meets the threshold for action, and prioritises it
                according to seriousness and the risk to the person affected.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Immediate action.
                </span>{" "}
                Where there is a risk to life or serious harm, the escalation
                path for critical incidents is used. This is a separately
                configured process that runs alongside ordinary support
                handling, and it is triggered on the basis of the facts
                reported rather than on a routine queue.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Referral to authorities.
                </span>{" "}
                Where the law requires it, or where it is necessary to protect
                someone, we refer the matter to the appropriate safeguarding
                authority, the police or emergency services. We do not notify
                a family member, an employer or any other party in a way that
                could increase the risk to the person affected.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Investigation and decision.
                </span>{" "}
                We gather information, involve the relevant organisation, and
                decide what to do: no further action, conditions on continued
                participation, suspension, removal from a placement, or
                referral to a partner organisation.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Feedback to the reporter.
                </span>{" "}
                We tell the person who raised the concern what we have done,
                in a way that does not compromise anyone&rsquo;s safety or
                confidentiality.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Record keeping
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We record the concern, the actions taken, the decisions made and
              the reasons for them. Records are held separately from ordinary
              training and assessment records so that a safeguarding matter
              is not confused with a learner&rsquo;s academic progress, and
              access is limited to the people who need it. Where a concern
              relates to an organisation, we share with that organisation only
              what is necessary to act on it.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              We keep records of concerns in line with the retention rules
              that apply to safeguarding and incident records, which are
              reviewed periodically. Records are never deleted simply because
              a matter was closed; where information is no longer required it
              is archived or anonymised in a way that preserves the audit
              trail.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Anyone who raises a concern in good faith is protected from
              retaliation. We will not name a person who has made a good
              faith report or who has supported someone who has.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Roles and responsibilities
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {brand.name} is responsible for
              </span>{" "}
              operating a documented reporting route, maintaining access
              controls and audit logs for sensitive records, supporting
              placements only where the required checks have been completed,
              reviewing concerns that are raised with us, and escalating
              concerns to the right external body when that is required.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Host organisations, care homes and employers are responsible
                for
              </span>{" "}
              the safeguarding of the people in their care, having a written
              safeguarding policy of their own, checking the suitability of
              staff and volunteers who work with children or vulnerable
              adults, ensuring that the placements we support are properly
              supervised, and reporting concerns to the appropriate
              authority.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Supervisors and trainers are responsible for
              </span>{" "}
              following the code of conduct for the placement, recording
              attendance and competency accurately, raising any concern
              immediately, and not sharing information about a placement
              outside the people who need to know.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Learners, trainees and caregivers are responsible for
              </span>{" "}
              following the code of conduct, treating the people they care for
              with dignity, not sharing confidential information about them,
              reporting concerns immediately, and telling us if they are
              asked to act in a way that puts a person at risk.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Training and expectations
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Our training content covers the safeguarding expectations that
              apply to care work, including recognising and reporting
              concerns, the boundaries of the role, record keeping and
              confidentiality. We expect our own staff and anyone working with
              us in a supervisory or teaching capacity to complete the
              safeguarding training that applies to their role, and we keep
              records of that.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              We require host organisations and training partners to confirm
              that the people supervising a placement have completed
              safeguarding training that is appropriate to that placement,
              and that the organisation&rsquo;s own policy is in place. A
              placement is not accepted without that confirmation and the
              required approval.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              We do not describe ourselves as accredited, approved or
              inspected by any safeguarding or regulatory body. Where a check
              is required for a placement, it is carried out under the rules
              that the host organisation is responsible for applying.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Preventative measures
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Most safeguarding failures are prevented rather than responded
              to. We work on that basis:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                access to sensitive records is limited by role and enforced in
                the database, with audit logs of who viewed what;
              </li>
              <li>
                placements are only accepted where the host organisation and
                the supervisor have been approved and the necessary checks are
                in place;
              </li>
              <li>
                care records, shift records and incident records are kept
                within the organisation that has the duty of care for the
                person, rather than being copied across the platform
                unnecessarily;
              </li>
              <li>
                codes of conduct are covered in training, and breaches are
                handled through the suspension and termination process in our{" "}
                <Link
                  href="/terms"
                  className="font-medium text-brand-teal underline-offset-4 hover:underline"
                >
                  Terms of Service
                </Link>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Concerns about {brand.name} itself
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              If your concern is about the conduct of a member of our team, a
              contractor or the way we have handled a previous concern, use the
              same route and mark it clearly. Where the concern involves our
              own team, it is escalated to a reviewer who was not involved in
              the original decision, so that it is considered independently.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Reviewing this policy
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We review this policy regularly, and whenever there is a
              significant safeguarding incident, a change in the services we
              offer, or a change in the requirements that apply to us. The
              date at the top of this page shows the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-brand-navy">
              Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Safeguarding concerns should be sent to{" "}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-brand-teal underline-offset-4 hover:underline"
              >
                {brand.supportEmail}
              </a>{" "}
              with the subject line &ldquo;Safeguarding concern&rdquo;. Where
              there is an
              immediate risk to life, contact the appropriate local emergency
              services or safeguarding authority first.
            </p>
          </section>
        </div>
      </SiteSection>
    </>
  );
}
