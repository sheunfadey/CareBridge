import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2Icon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCurrentUser,
  isOrganisationAdmin,
  userHasPermission,
} from "@/server/auth/current-user";
import { getOrganisationDetail } from "@/server/organisations/queries";
import type { RoleKey } from "@/types/database";

export const metadata: Metadata = { title: "People" };

const trainerRoles: RoleKey[] = ["instructor", "training_admin"];
const adminRoles: RoleKey[] = ["care_home_owner", "care_home_manager"];

const roleLabels: Partial<Record<RoleKey, string>> = {
  care_home_owner: "Organisation owner",
  care_home_manager: "Manager",
  instructor: "Trainer",
  training_admin: "Training admin",
  caregiver: "Caregiver",
  internship_supervisor: "Supervisor",
  employer: "Employer",
  charity_admin: "Charity admin",
  referral_partner: "Referral partner",
  platform_support: "Support",
  super_admin: "Super admin",
};

function roleLabel(role: RoleKey): string {
  return roleLabels[role] ?? role.replaceAll("_", " ");
}

export default async function OrganisationPeoplePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/dashboard/people");

  const primary =
    user.organisations.find((organisation) => organisation.isOwner) ??
    user.organisations[0];

  if (!primary) {
    redirect("/dashboard/organisation");
  }

  const canManagePeople =
    isOrganisationAdmin(user) ||
    primary.isOwner ||
    userHasPermission(user, "user_view");

  if (!canManagePeople) {
    redirect("/dashboard");
  }

  const detail = await getOrganisationDetail(primary.organisationId);
  if (!detail) {
    redirect("/dashboard/organisation");
  }

  const members = detail.members;
  const administrators = members.filter((member) =>
    member.roles.some((role) => adminRoles.includes(role)),
  );
  const trainers = members.filter(
    (member) =>
      member.roles.some((role) => trainerRoles.includes(role)) &&
      !administrators.includes(member),
  );
  const learners = members.filter(
    (member) =>
      !administrators.includes(member) &&
      !trainers.includes(member) &&
      (member.roles.length === 0 || member.roles.includes("caregiver")),
  );
  const others = members.filter(
    (member) =>
      !administrators.includes(member) &&
      !trainers.includes(member) &&
      !learners.includes(member),
  );
  const pendingInvitations = detail.invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const sections = [
    {
      title: "Administrators",
      description: "Owners and managers who run this workspace.",
      icon: UserCogIcon,
      members: administrators,
      tone: "bg-portal-lavender text-portal-lavender-strong",
    },
    {
      title: "Trainers",
      description: "Course authors, assessors and training administrators.",
      icon: GraduationCapIcon,
      members: trainers,
      tone: "bg-portal-sky text-portal-sky-strong",
    },
    {
      title: "Caregivers and learners",
      description: "People enrolled in training or providing care.",
      icon: HeartHandshakeIcon,
      members: learners,
      tone: "bg-portal-mint text-portal-mint-strong",
    },
    ...(others.length > 0
      ? [
          {
            title: "Other members",
            description: "Supervisors, employers and partners.",
            icon: UsersIcon,
            members: others,
            tone: "bg-portal-peach text-portal-peach-strong",
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <PageHeader
        eyebrow="Organisation admin"
        title="People"
        description={`Members of ${detail.summary.name}, grouped by what they do in the workspace.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "People" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/dashboard/organisation/${detail.summary.id}`}>
              <Building2Icon />
              Manage members & roles
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Administrators", value: administrators.length },
          { label: "Trainers", value: trainers.length },
          { label: "Caregivers & learners", value: learners.length },
          { label: "Pending invitations", value: pendingInvitations.length },
        ].map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
              {tile.value}
            </p>
          </Card>
        ))}
      </div>

      {sections.map((section) => (
        <Card key={section.title} className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex size-9 items-center justify-center rounded-xl ${section.tone}`}
              >
                <section.icon className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-base font-semibold text-brand-strong">
                  {section.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </div>
            <Badge variant="secondary">{section.members.length}</Badge>
          </div>

          {section.members.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No {section.title.toLowerCase()} yet.
            </p>
          ) : (
            <ul className="divide-y divide-brand-navy/5">
              {section.members.map((member) => (
                <li
                  key={member.membershipId}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-strong">
                      {member.fullName ?? member.email}
                      {member.isOwner ? (
                        <span className="ml-2 rounded-full bg-brand-sky px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                          Owner
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {member.roles.length === 0 ? (
                      <Badge variant="outline">No role assigned</Badge>
                    ) : (
                      member.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {roleLabel(role)}
                        </Badge>
                      ))
                    )}
                    <StatusBadge status={member.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      {pendingInvitations.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b p-4">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Pending invitations
            </h2>
            <p className="text-xs text-muted-foreground">
              People invited to this workspace who have not accepted yet.
            </p>
          </div>
          <ul className="divide-y divide-brand-navy/5">
            {pendingInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <p className="text-sm text-brand-strong">{invitation.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{roleLabel(invitation.roleKey)}</Badge>
                  <StatusBadge status={invitation.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
