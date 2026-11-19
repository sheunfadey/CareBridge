import { redirect } from "next/navigation";

import {
  getCurrentUser,
  userHasPermission,
} from "@/server/auth/current-user";

/**
 * Shortcut to the primary organisation's billing page so organisation admins do
 * not have to go through the organisation list first.
 */
export default async function OrganisationBillingRedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/organisation/billing");
  }

  if (!user.isSuperAdmin && !userHasPermission(user, "subscription_view")) {
    redirect("/dashboard/organisation");
  }

  const primary =
    user.organisations.find((organisation) => organisation.isOwner) ??
    user.organisations[0];

  if (!primary) {
    redirect("/dashboard/organisation");
  }

  redirect(`/dashboard/organisation/${primary.organisationId}/billing`);
}
