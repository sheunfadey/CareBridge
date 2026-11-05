import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export type StatusTone =
  | "neutral"
  | "info"
  | "progress"
  | "success"
  | "warning"
  | "error";

const toneStyles: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-brand-slate",
  info: "border-brand-sky bg-brand-sky text-brand-strong",
  progress: "border-brand-teal/20 bg-brand-teal/10 text-brand-teal",
  success: "border-brand-success/20 bg-brand-success/10 text-brand-success",
  warning: "border-brand-warning/25 bg-brand-warning/10 text-brand-warning",
  error: "border-brand-error/20 bg-brand-error/10 text-brand-error",
};

const dotStyles: Record<StatusTone, string> = {
  neutral: "bg-brand-slate",
  info: "bg-brand-teal",
  progress: "bg-brand-teal",
  success: "bg-brand-success",
  warning: "bg-brand-warning",
  error: "bg-brand-error",
};

export const statusToneMap: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  pending_review: { label: "Pending review", tone: "warning" },
  in_progress: { label: "In progress", tone: "progress" },
  processing: { label: "Processing", tone: "progress" },
  eligible: { label: "Eligible", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  verified: { label: "Verified", tone: "success" },
  active: { label: "Active", tone: "success" },
  published: { label: "Published", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  competent: { label: "Competent", tone: "success" },
  unverified: { label: "Unverified", tone: "neutral" },
  paused: { label: "Paused", tone: "neutral" },
  inactive: { label: "Inactive", tone: "neutral" },
  deactivated: { label: "Deactivated", tone: "error" },
  suspended: { label: "Suspended", tone: "error" },
  disabled: { label: "Disabled", tone: "error" },
  on_hold: { label: "On hold", tone: "warning" },
  awaiting_review: { label: "Awaiting review", tone: "warning" },
  remediation: { label: "Further practice required", tone: "warning" },
  overdue: { label: "Overdue", tone: "error" },
  rejected: { label: "Rejected", tone: "error" },
  failed: { label: "Failed", tone: "error" },
  reversed: { label: "Reversed", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "info" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  shortlisted: { label: "Shortlisted", tone: "progress" },
  interview: { label: "Interview", tone: "progress" },
  offered: { label: "Offer made", tone: "success" },
  hired: { label: "Hired", tone: "success" },
  accepted: { label: "Accepted", tone: "success" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  open: { label: "Open", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
  pending_approval: { label: "Pending approval", tone: "warning" },
  pending_agreement: { label: "Pending agreement", tone: "warning" },
  needs_improvement: { label: "Needs improvement", tone: "warning" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "info" },
  sent: { label: "Awaiting response", tone: "info" },
  present: { label: "Present", tone: "success" },
  absent: { label: "Absent", tone: "error" },
  late: { label: "Late", tone: "warning" },
  excused: { label: "Excused", tone: "neutral" },
  investigating: { label: "Investigating", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
  no_show: { label: "No show", tone: "error" },
  expired: { label: "Expired", tone: "neutral" },
  terminated: { label: "Terminated", tone: "error" },
  pass: { label: "Pass", tone: "success" },
  fail: { label: "Fail", tone: "error" },
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "error" },
  critical: { label: "Critical", tone: "error" },
};

type StatusBadgeProps = {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
  showDot?: boolean;
};

export function StatusBadge({
  status,
  label,
  tone,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const preset = statusToneMap[status];
  const resolvedTone = tone ?? preset?.tone ?? "neutral";
  const resolvedLabel = label ?? preset?.label ?? status.replaceAll("_", " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-full border px-2.5 font-medium capitalize",
        toneStyles[resolvedTone],
        className,
      )}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", dotStyles[resolvedTone])}
        />
      ) : null}
      {resolvedLabel}
    </Badge>
  );
}
