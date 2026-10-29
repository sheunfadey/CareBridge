"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InviteMemberDialog } from "@/features/organisations/components/invite-member-dialog";
import {
  assignRoleAction,
  removeMemberAction,
  revokeInvitationAction,
} from "@/features/organisations/actions";
import { ROLE_LABELS, PRIVILEGED_ROLES } from "@/lib/permissions/registry";
import type { OrganisationInvitation, OrganisationMember } from "@/server/organisations/queries";
import type { RoleKey } from "@/types/database";

const ASSIGNABLE_ROLES = (Object.keys(ROLE_LABELS) as RoleKey[]).filter(
  (role) => !PRIVILEGED_ROLES.includes(role),
);

export function MemberManager({
  organisationId,
  members,
  invitations,
  canManage,
  currentUserId,
}: {
  organisationId: string;
  members: OrganisationMember[];
  invitations: OrganisationInvitation[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrganisationMember | null>(null);

  const activeMembers = members.filter((m) => m.status === "active");

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.message) {
        setMessage(result.message);
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold text-brand-navy">
            Members ({activeMembers.length})
          </h2>
          {canManage ? (
            <InviteMemberDialog organisationId={organisationId}>
              <Button size="sm">
                <UserPlusIcon />
                Invite member
              </Button>
            </InviteMemberDialog>
          ) : null}
        </div>

        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.map((member) => (
                <TableRow key={member.membershipId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-brand-navy">
                        {member.fullName ?? member.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {member.isOwner ? (
                        <Badge variant="secondary">Owner</Badge>
                      ) : null}
                      {member.roles.length === 0 && !member.isOwner ? (
                        <span className="text-xs text-muted-foreground">
                          No roles
                        </span>
                      ) : null}
                      {member.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManage && member.userId !== currentUserId ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${member.email}`}
                            disabled={isPending}
                          >
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Assign role</DropdownMenuLabel>
                          {ASSIGNABLE_ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role}
                              disabled={member.roles.includes(role)}
                              onSelect={(event) => {
                                event.preventDefault();
                                run(() =>
                                  assignRoleAction({
                                    organisationId,
                                    userId: member.userId,
                                    roleKey: role,
                                  }),
                                );
                              }}
                            >
                              {ROLE_LABELS[role]}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(event) => {
                              event.preventDefault();
                              setRemoveTarget(member);
                            }}
                          >
                            Remove from organisation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {canManage && invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold text-brand-navy">
            Pending invitations ({invitations.length})
          </h2>
          <ul className="space-y-2">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-brand-navy">
                    {invitation.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[invitation.roleKey]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    run(() =>
                      revokeInvitationAction({
                        organisationId,
                        invitationId: invitation.id,
                      }),
                    )
                  }
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `${removeTarget.fullName ?? removeTarget.email} will lose access to this organisation and all assigned roles.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeTarget) {
                  run(() =>
                    removeMemberAction({
                      organisationId,
                      userId: removeTarget.userId,
                    }),
                  );
                }
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
