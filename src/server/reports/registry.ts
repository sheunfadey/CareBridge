import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ReportFilters = {
  from?: string;
  to?: string;
  organisationId?: string;
  limit?: number;
};

export type ReportColumn = { key: string; label: string };

export type ReportDefinition = {
  key: string;
  label: string;
  description: string;
  category: "Academy" | "Employment" | "Referrals & finance" | "Charity" | "Care operations";
  columns: ReportColumn[];
  run: (filters: ReportFilters) => Promise<Record<string, unknown>[]>;
};

function dateBounds(filters: ReportFilters) {
  const to = filters.to
    ? new Date(`${filters.to}T23:59:59.999`)
    : new Date();
  const from = filters.from
    ? new Date(`${filters.from}T00:00:00`)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}

function limitOf(filters: ReportFilters): number {
  return Math.min(filters.limit ?? 1000, 5000);
}

export const REPORTS: ReportDefinition[] = [
  {
    key: "enrolments",
    label: "Enrolment report",
    description: "Course enrolments by source and status.",
    category: "Academy",
    columns: [
      { key: "course", label: "Course" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "enrolled_at", label: "Enrolled" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("course_enrolments")
        .select("id, status, source, enrolled_at, organisation_id, courses(title)")
        .gte("enrolled_at", fromIso)
        .lte("enrolled_at", toIso)
        .order("enrolled_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        course:
          (row.courses as { title?: string } | null)?.title ?? "Course",
        status: row.status,
        source: row.source,
        enrolled_at: row.enrolled_at,
      }));
    },
  },
  {
    key: "course_completions",
    label: "Course completion report",
    description: "Completed courses and certificate eligibility.",
    category: "Academy",
    columns: [
      { key: "course", label: "Course" },
      { key: "organisation", label: "Organisation" },
      { key: "completed_at", label: "Completed" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("completion_records")
        .select("id, completed_at, courses(title, organisation_id, organisations(name))")
        .gte("completed_at", fromIso)
        .lte("completed_at", toIso)
        .order("completed_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("courses.organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => {
        const course = row.courses as
          | { title?: string; organisations?: { name?: string } | null }
          | null;
        return {
          course: course?.title ?? "Course",
          organisation: course?.organisations?.name ?? "—",
          completed_at: row.completed_at,
        };
      });
    },
  },
  {
    key: "internship_placements",
    label: "Internship completion",
    description: "Placements, agreement state and completion.",
    category: "Employment",
    columns: [
      { key: "listing", label: "Placement" },
      { key: "status", label: "Status" },
      { key: "agreement_status", label: "Agreement" },
      { key: "start_date", label: "Start" },
      { key: "end_date", label: "End" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("internship_placements")
        .select(
          "id, status, agreement_status, start_date, end_date, organisation_id, internship_listings(title)",
        )
        .gte("start_date", fromIso.slice(0, 10))
        .lte("start_date", toIso.slice(0, 10))
        .order("start_date", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        listing:
          (row.internship_listings as { title?: string } | null)?.title ??
          "Placement",
        status: row.status,
        agreement_status: row.agreement_status,
        start_date: row.start_date,
        end_date: row.end_date,
      }));
    },
  },
  {
    key: "employment_outcomes",
    label: "Employment outcomes",
    description: "Job applications that reached offer or hire.",
    category: "Employment",
    columns: [
      { key: "job", label: "Job" },
      { key: "organisation", label: "Employer" },
      { key: "status", label: "Outcome" },
      { key: "updated_at", label: "Updated" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("job_applications")
        .select(
          "id, status, updated_at, job_postings(title, organisation_id, organisations(name))",
        )
        .in("status", ["offered", "hired"])
        .gte("updated_at", fromIso)
        .lte("updated_at", toIso)
        .order("updated_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("job_postings.organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => {
        const job = row.job_postings as
          | { title?: string; organisations?: { name?: string } | null }
          | null;
        return {
          job: job?.title ?? "Job",
          organisation: job?.organisations?.name ?? "—",
          status: row.status,
          updated_at: row.updated_at,
        };
      });
    },
  },
  {
    key: "employer_activity",
    label: "Employer activity",
    description: "Job postings, publication state and dates.",
    category: "Employment",
    columns: [
      { key: "title", label: "Job" },
      { key: "status", label: "Status" },
      { key: "employment_type", label: "Type" },
      { key: "published_at", label: "Published" },
      { key: "created_at", label: "Created" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("job_postings")
        .select("id, title, status, employment_type, published_at, created_at, organisation_id")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return data ?? [];
    },
  },
  {
    key: "referral_performance",
    label: "Referral performance",
    description: "Commission ledger entries by partner and status.",
    category: "Referrals & finance",
    columns: [
      { key: "partner", label: "Partner" },
      { key: "entry_type", label: "Entry" },
      { key: "gross", label: "Gross (minor units)" },
      { key: "commission", label: "Commission (minor units)" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      const { data } = await supabase
        .from("referral_commissions")
        .select(
          "id, entry_type, gross_amount_minor_units, commission_amount_minor_units, status, created_at, referral_partners(display_name, code)",
        )
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(limitOf(filters));
      return (data ?? []).map((row) => {
        const partner = row.referral_partners as
          | { display_name?: string; code?: string }
          | null;
        return {
          partner: partner?.display_name ?? partner?.code ?? "Partner",
          entry_type: row.entry_type,
          gross: row.gross_amount_minor_units,
          commission: row.commission_amount_minor_units,
          status: row.status,
          created_at: row.created_at,
        };
      });
    },
  },
  {
    key: "commission_liabilities",
    label: "Commission liabilities",
    description: "Commissions not yet paid, including payable and in-payout.",
    category: "Referrals & finance",
    columns: [
      { key: "partner", label: "Partner" },
      { key: "commission", label: "Amount (minor units)" },
      { key: "status", label: "Status" },
      { key: "eligible_at", label: "Eligible" },
      { key: "created_at", label: "Created" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      const { data } = await supabase
        .from("referral_commissions")
        .select(
          "id, commission_amount_minor_units, status, eligible_at, created_at, referral_partners(display_name, code)",
        )
        .in("status", ["pending", "eligible", "approved", "on_hold", "processing"])
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(limitOf(filters));
      return (data ?? []).map((row) => {
        const partner = row.referral_partners as
          | { display_name?: string; code?: string }
          | null;
        return {
          partner: partner?.display_name ?? partner?.code ?? "Partner",
          commission: row.commission_amount_minor_units,
          status: row.status,
          eligible_at: row.eligible_at,
          created_at: row.created_at,
        };
      });
    },
  },
  {
    key: "payment_reconciliation",
    label: "Payment reconciliation",
    description: "Provider payments and reconciliation status.",
    category: "Referrals & finance",
    columns: [
      { key: "reference", label: "Reference" },
      { key: "status", label: "Status" },
      { key: "reconciliation", label: "Reconciliation" },
      { key: "amount", label: "Amount (minor units)" },
      { key: "currency", label: "Currency" },
      { key: "created_at", label: "Created" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("payment_transactions")
        .select(
          "reference, status, reconciliation_status, amount_minor_units, currency, created_at, organisation_id",
        )
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        reference: row.reference,
        status: row.status,
        reconciliation: row.reconciliation_status,
        amount: row.amount_minor_units,
        currency: row.currency,
        created_at: row.created_at,
      }));
    },
  },
  {
    key: "refunds",
    label: "Refunds",
    description: "Refund records and their provider status.",
    category: "Referrals & finance",
    columns: [
      { key: "reference", label: "Payment reference" },
      { key: "amount", label: "Amount (minor units)" },
      { key: "status", label: "Status" },
      { key: "reason", label: "Reason" },
      { key: "created_at", label: "Created" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("payment_refunds")
        .select(
          "id, amount_minor_units, status, reason, created_at, payment_transactions(reference, organisation_id)",
        )
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .order("created_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq(
          "payment_transactions.organisation_id",
          filters.organisationId,
        );
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        reference:
          (row.payment_transactions as { reference?: string } | null)?.reference ??
          "—",
        amount: row.amount_minor_units,
        status: row.status,
        reason: row.reason,
        created_at: row.created_at,
      }));
    },
  },
  {
    key: "charity_campaign_performance",
    label: "Charity campaign performance",
    description: "Received, committed and disbursed funds by campaign.",
    category: "Charity",
    columns: [
      { key: "campaign", label: "Campaign" },
      { key: "target", label: "Target (minor units)" },
      { key: "received", label: "Received (minor units)" },
      { key: "committed", label: "Committed (minor units)" },
      { key: "disbursed", label: "Disbursed (minor units)" },
      { key: "currency", label: "Currency" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      let query = supabase
        .from("charity_campaign_finance")
        .select(
          "title, currency, funding_target_minor_units, received_minor_units, committed_minor_units, disbursed_minor_units, organisation_id",
        )
        .order("title")
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        campaign: row.title ?? "Campaign",
        target: row.funding_target_minor_units ?? 0,
        received: row.received_minor_units ?? 0,
        committed: row.committed_minor_units ?? 0,
        disbursed: row.disbursed_minor_units ?? 0,
        currency: row.currency ?? "NGN",
      }));
    },
  },
  {
    key: "scholarship_allocation",
    label: "Scholarship allocation",
    description: "Awards, coverage and recorded outcomes.",
    category: "Charity",
    columns: [
      { key: "programme", label: "Programme" },
      { key: "amount", label: "Amount (minor units)" },
      { key: "coverage", label: "Coverage" },
      { key: "status", label: "Status" },
      { key: "awarded_at", label: "Awarded" },
      { key: "completion", label: "Completion outcome" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("scholarship_awards")
        .select(
          "id, amount_minor_units, coverage, status, awarded_at, completion_outcome, organisation_id, scholarship_programmes(name)",
        )
        .gte("awarded_at", fromIso)
        .lte("awarded_at", toIso)
        .order("awarded_at", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        programme:
          (row.scholarship_programmes as { name?: string } | null)?.name ??
          "Programme",
        amount: row.amount_minor_units,
        coverage: row.coverage,
        status: row.status,
        awarded_at: row.awarded_at,
        completion: row.completion_outcome ?? "",
      }));
    },
  },
  {
    key: "care_occupancy",
    label: "Care occupancy",
    description: "Active residents and occupancy by facility.",
    category: "Care operations",
    columns: [
      { key: "facility", label: "Facility" },
      { key: "active_residents", label: "Active residents" },
      { key: "capacity", label: "Capacity" },
      { key: "occupancy_percent", label: "Occupancy %" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      let query = supabase
        .from("care_occupancy")
        .select("facility_name, active_residents, capacity, occupancy_percent, organisation_id")
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        facility: row.facility_name ?? "Facility",
        active_residents: row.active_residents ?? 0,
        capacity: row.capacity ?? "",
        occupancy_percent: row.occupancy_percent ?? "",
      }));
    },
  },
  {
    key: "care_incidents",
    label: "Incident trends",
    description: "Incident counts by category, severity and status.",
    category: "Care operations",
    columns: [
      { key: "category", label: "Category" },
      { key: "severity", label: "Severity" },
      { key: "status", label: "Status" },
      { key: "count", label: "Count" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      let query = supabase
        .from("care_incident_summary")
        .select("category, severity, status, incident_count, organisation_id")
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        category: row.category,
        severity: row.severity,
        status: row.status,
        count: row.incident_count ?? 0,
      }));
    },
  },
  {
    key: "care_inventory",
    label: "Inventory movements",
    description: "Stock levels and reorder state by item.",
    category: "Care operations",
    columns: [
      { key: "item", label: "Item" },
      { key: "quantity", label: "Current quantity" },
      { key: "reorder_level", label: "Reorder level" },
      { key: "unit", label: "Unit" },
      { key: "below_reorder", label: "Below reorder" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      let query = supabase
        .from("care_inventory_status")
        .select("name, current_quantity, reorder_level, unit, below_reorder, organisation_id")
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        item: row.name ?? "Item",
        quantity: row.current_quantity ?? 0,
        reorder_level: row.reorder_level ?? 0,
        unit: row.unit ?? "unit",
        below_reorder: row.below_reorder ? "yes" : "no",
      }));
    },
  },
  {
    key: "care_invoices",
    label: "Outstanding invoices",
    description: "Care invoices, balances and ageing.",
    category: "Care operations",
    columns: [
      { key: "invoice", label: "Invoice" },
      { key: "payer", label: "Payer" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total (minor units)" },
      { key: "outstanding", label: "Outstanding (minor units)" },
      { key: "days_overdue", label: "Days overdue" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      let query = supabase
        .from("care_invoice_ageing")
        .select(
          "invoice_number, payer_name, status, total_minor_units, outstanding_minor_units, days_overdue, organisation_id",
        )
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        invoice: row.invoice_number ?? "",
        payer: row.payer_name ?? "",
        status: row.status,
        total: row.total_minor_units ?? 0,
        outstanding: row.outstanding_minor_units ?? 0,
        days_overdue: row.days_overdue ?? 0,
      }));
    },
  },
  {
    key: "care_expenses",
    label: "Expense summaries",
    description: "Care expense records by category and date.",
    category: "Care operations",
    columns: [
      { key: "category", label: "Category" },
      { key: "amount", label: "Amount (minor units)" },
      { key: "currency", label: "Currency" },
      { key: "incurred_on", label: "Incurred" },
      { key: "payment_status", label: "Payment status" },
    ],
    run: async (filters) => {
      const supabase = await createClient();
      const { fromIso, toIso } = dateBounds(filters);
      let query = supabase
        .from("expense_records")
        .select("category, amount_minor_units, currency, incurred_on, payment_status, organisation_id")
        .gte("incurred_on", fromIso.slice(0, 10))
        .lte("incurred_on", toIso.slice(0, 10))
        .order("incurred_on", { ascending: false })
        .limit(limitOf(filters));
      if (filters.organisationId) {
        query = query.eq("organisation_id", filters.organisationId);
      }
      const { data } = await query;
      return (data ?? []).map((row) => ({
        category: row.category,
        amount: row.amount_minor_units,
        currency: row.currency,
        incurred_on: row.incurred_on,
        payment_status: row.payment_status,
      }));
    },
  },
];

export function getReportDefinition(key: string): ReportDefinition | undefined {
  return REPORTS.find((report) => report.key === key);
}

export async function runReport(
  key: string,
  filters: ReportFilters,
): Promise<{
  report: ReportDefinition;
  rows: Record<string, unknown>[];
} | null> {
  const report = getReportDefinition(key);
  if (!report) return null;
  const rows = await report.run(filters);
  return { report, rows };
}
