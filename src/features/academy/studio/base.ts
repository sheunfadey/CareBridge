/**
 * The course studio is rendered in two places: Academy administration inside the
 * dashboard, and the standalone trainer workspace. Every link, redirect and
 * breadcrumb is derived from this descriptor so the same screens work in both.
 */
export type StudioBase = {
  /** Root of the studio, e.g. /dashboard/academy/manage or /trainer/courses. */
  manageHref: string;
  /** The academy home the studio belongs to. */
  academyHref: string;
  /** The portal home used in breadcrumbs and login redirects. */
  homeHref: string;
  homeLabel: string;
  /** Badge above the studio heading. */
  eyebrow: string;
};

export const dashboardStudioBase: StudioBase = {
  manageHref: "/dashboard/academy/manage",
  academyHref: "/dashboard/academy",
  homeHref: "/dashboard",
  homeLabel: "Dashboard",
  eyebrow: "Academy management",
};

export const trainerStudioBase: StudioBase = {
  manageHref: "/trainer/courses",
  academyHref: "/trainer",
  homeHref: "/trainer",
  homeLabel: "Trainer home",
  eyebrow: "Trainer workspace",
};

export function studioCourseHref(base: StudioBase, courseId: string): string {
  return `${base.manageHref}/${courseId}`;
}

export function studioAssessmentHref(
  base: StudioBase,
  courseId: string,
  assessmentId: string,
): string {
  return `${base.manageHref}/${courseId}/assessments/${assessmentId}`;
}

/**
 * Server actions return dashboard-relative studio paths. Rewrite them for the
 * surface the action was submitted from so trainers stay in their workspace.
 */
export function rebaseStudioHref(
  href: string | undefined,
  manageHref: string,
): string | undefined {
  if (!href) return undefined;
  const dashboardStudio = "/dashboard/academy/manage";
  if (href === dashboardStudio || href.startsWith(`${dashboardStudio}/`)) {
    return `${manageHref}${href.slice(dashboardStudio.length)}`;
  }
  return href;
}
