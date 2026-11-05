import type { Metadata } from "next";
import Link from "next/link";
import {
  AwardIcon,
  BabyIcon,
  BadgeCheckIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  FileCheckIcon,
  HeartHandshakeIcon,
  HouseIcon,
  LayersIcon,
  MessageCircleIcon,
  PillIcon,
  ShieldCheckIcon,
  SyringeIcon,
  UserCheckIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Caregiver Training",
  description:
    "Structured caregiver training built from modules, lessons, assessments and supervised practical competency, with completion records and certificates held on the platform.",
};

const topics = [
  {
    icon: HeartHandshakeIcon,
    title: "Person-centred care",
    body: "Understanding the individual, working to their preferences and preserving dignity in every task.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Safeguarding",
    body: "Recognising risk, protecting those in your care and following the correct reporting route when something goes wrong.",
  },
  {
    icon: SyringeIcon,
    title: "Infection control",
    body: "Hand hygiene, safe handling of equipment and practical routines that reduce the spread of infection.",
  },
  {
    icon: MessageCircleIcon,
    title: "Communication",
    body: "Listening, clear handover, talking with families and recording information others can rely on.",
  },
  {
    icon: UsersRoundIcon,
    title: "Elderly care",
    body: "Supporting older adults with daily living, mobility, nutrition, wellbeing and dignity.",
  },
  {
    icon: HouseIcon,
    title: "Home and community care",
    body: "Delivering safe, respectful support in a person's own home and within their community.",
  },
  {
    icon: BabyIcon,
    title: "Child and family care",
    body: "Foundations for supporting children and families, with safeguarding built into every part of practice.",
  },
  {
    icon: PillIcon,
    title: "Medication support",
    body: "Assisting with medication safely, following instructions and recording what was given.",
  },
] as const;

const structure = [
  {
    icon: LayersIcon,
    title: "Modules",
    body: "Each programme is divided into modules that group related subjects so the learning stays organised and progressive.",
  },
  {
    icon: BookOpenIcon,
    title: "Lessons",
    body: "Modules contain lessons with written material and activities that you work through at your own pace.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Assessments",
    body: "Short assessments check your understanding as you go, and their results are recorded against your record.",
  },
  {
    icon: AwardIcon,
    title: "Practical competency",
    body: "Assessment is completed by demonstrating care in a supervised placement, with a signed evaluation.",
  },
] as const;

const placementPoints = [
  {
    icon: UserCheckIcon,
    title: "Matched placements",
    body: "Placements are matched to the stage of your training and the needs of the host organisation.",
  },
  {
    icon: ClipboardListIcon,
    title: "Supervised practice",
    body: "A named supervisor reviews your practice, gives feedback and confirms the tasks you are signed off to perform.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Recorded progress",
    body: "Attendance, tasks completed and supervisor notes are recorded so your practical record reflects real experience.",
  },
  {
    icon: FileCheckIcon,
    title: "Signed evaluation",
    body: "Your competency is confirmed by the supervisor at the end of the placement and stored on your profile.",
  },
] as const;

const recordPoints = [
  {
    title: "Training history",
    body: "Each programme you complete is recorded with its modules, lessons and assessment outcomes.",
  },
  {
    title: "Competency records",
    body: "Practical evaluations are attached to your profile so the work you have done can be reviewed.",
  },
  {
    title: "Completion status",
    body: "Your record shows what is in progress and what is complete, so you always know where you stand.",
  },
  {
    title: "Certificates",
    body: "A certificate is issued for programmes you complete, reflecting the modules and assessments you passed.",
  },
] as const;

export default function CaregiverTrainingPage() {
  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-sky px-3 py-1 text-xs font-medium text-brand-teal">
              <ClipboardCheckIcon className="size-3.5" aria-hidden="true" />
              Learn. Practise. Qualify.
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
              Caregiver training that ends in capability
              <span className="text-gradient-care block">
                You can show, not just claim.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {brand.name} delivers training as structured programmes — modules,
              lessons and assessments followed by supervised practical work — so
              that your record shows what you can actually do in a care setting.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create an account</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No prior experience is needed to begin foundation training. You
              start with core care principles and build towards more specialist
              practice.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: LayersIcon,
                title: "Structured programmes",
                body: "Organised modules and lessons that build on one another.",
              },
              {
                icon: ClipboardCheckIcon,
                title: "Assessment built in",
                body: "Understanding is checked as you learn, not only at the end.",
              },
              {
                icon: ClipboardListIcon,
                title: "Supervised placements",
                body: "Practical placements matched to your stage of training.",
              },
              {
                icon: BadgeCheckIcon,
                title: "Records and certificates",
                body: "Completion and competency recorded on your profile.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <card.icon className="size-5" />
                </span>
                <p className="mt-4 font-heading font-semibold text-brand-strong">
                  {card.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="What training covers"
          title="The knowledge and skills care work demands"
          description="Programmes are built around the responsibilities caregivers are actually asked to take on, in the settings they are likely to work in."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <topic.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading font-semibold text-brand-strong">
                {topic.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{topic.body}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="How training is structured"
          title="Modules, lessons, assessments and competency"
          description="Each stage feeds the next, so the course you study and the care you practise always describe the same set of skills."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {structure.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <span className="absolute right-5 top-5 font-heading text-3xl font-semibold text-brand-teal/20">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {step.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
          Assessments confirm understanding; practical competency confirms
          practice. A programme is only marked complete once both parts are
          recorded.
        </p>
      </SiteSection>

      <SiteSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Practical competency"
            title="Supervised placements where learning becomes practice"
            description="Classroom knowledge is not enough in care. Before your competency is signed off, you complete a supervised placement where a supervisor watches you work and records what you are able to do."
          />
          <div className="grid gap-4">
            {placementPoints.map((point) => (
              <div
                key={point.title}
                className="flex gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <point.icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {point.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{point.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="ivory">
        <SectionHeading
          eyebrow="Completion records and certificates"
          title="A record of your training that stays with you"
          description="Everything you complete is stored against your profile so you, and the organisations you work with, can see the full picture."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recordPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
            >
              <BadgeCheckIcon
                className="size-6 text-brand-green"
                aria-hidden="true"
              />
              <p className="mt-4 font-heading font-semibold text-brand-strong">
                {point.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            tone="onDark"
            align="center"
            eyebrow="Next step"
            title="Start with the programme that fits"
            description="Choose a programme from the catalogue, or create an account and begin the enrolment process."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      </SiteSection>
    </>
  );
}
