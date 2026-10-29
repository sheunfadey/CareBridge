-- =============================================================================
-- CareBridge - Phase 7: care operations permissions
-- Migration: 0016_care_permissions.sql
--
-- Adds the permissions used by the care-home workspace (shifts, daily care,
-- medication, staff records, inventory, expenses, billing and reporting) and
-- the least-privilege role that may record medication administration.
--
-- Security correction: `family_member` no longer receives `resident_view`.
-- That permission is organisation-wide, so it exposed every resident to any
-- linked family account. Family access is now granted only through an explicit
-- resident relationship row (see 0017_care_residents_staff.sql).
-- =============================================================================

insert into public.permissions (key, category, description) values
  ('shift_view', 'shift_management', 'Read rosters and shift coverage'),
  ('shift_manage', 'shift_management', 'Create shifts and assign staff'),
  ('care_record_manage', 'care_records', 'Record daily care and review records'),
  ('medication_manage', 'medication', 'Record medication administration'),
  ('staff_manage', 'staff_management', 'Manage care staff records and compliance'),
  ('inventory_view', 'inventory', 'Read stock levels and movements'),
  ('inventory_manage', 'inventory', 'Record stock movements and reorder levels'),
  ('expense_manage', 'expenses', 'Create purchase requests and expenses'),
  ('expense_approve', 'expenses', 'Approve purchase requests and expenses'),
  ('invoice_view', 'billing', 'Read resident invoices and balances'),
  ('invoice_manage', 'billing', 'Issue invoices and record payments'),
  ('care_report_view', 'resident_records', 'View operational care reports')
on conflict (key) do nothing;

insert into public.roles (key, name, description, is_system) values
  ('care_medication_staff', 'Senior care staff (medication)',
   'Delivers care and records medication administration', true)
on conflict (key) do nothing;

-- Super administrator holds every permission for reporting completeness; the
-- is_super_admin() check remains the authoritative bypass.
insert into public.role_permissions (role_key, permission_key)
select 'super_admin', key
from public.permissions
where key in (
  'shift_view', 'shift_manage', 'care_record_manage', 'medication_manage',
  'staff_manage', 'inventory_view', 'inventory_manage', 'expense_manage',
  'expense_approve', 'invoice_view', 'invoice_manage', 'care_report_view'
)
on conflict do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('care_home_owner', 'shift_view'),
  ('care_home_owner', 'shift_manage'),
  ('care_home_owner', 'care_record_manage'),
  ('care_home_owner', 'medication_manage'),
  ('care_home_owner', 'staff_manage'),
  ('care_home_owner', 'inventory_view'),
  ('care_home_owner', 'inventory_manage'),
  ('care_home_owner', 'expense_manage'),
  ('care_home_owner', 'expense_approve'),
  ('care_home_owner', 'invoice_view'),
  ('care_home_owner', 'invoice_manage'),
  ('care_home_owner', 'care_report_view'),

  ('care_home_manager', 'shift_view'),
  ('care_home_manager', 'shift_manage'),
  ('care_home_manager', 'care_record_manage'),
  ('care_home_manager', 'medication_manage'),
  ('care_home_manager', 'staff_manage'),
  ('care_home_manager', 'inventory_view'),
  ('care_home_manager', 'inventory_manage'),
  ('care_home_manager', 'expense_manage'),
  ('care_home_manager', 'invoice_view'),
  ('care_home_manager', 'invoice_manage'),
  ('care_home_manager', 'care_report_view'),

  ('care_staff', 'shift_view'),
  ('care_staff', 'care_record_manage'),

  ('care_medication_staff', 'shift_view'),
  ('care_medication_staff', 'care_record_manage'),
  ('care_medication_staff', 'medication_manage'),

  ('finance_officer', 'invoice_view'),
  ('finance_officer', 'expense_approve'),
  ('finance_officer', 'care_report_view'),

  ('compliance_officer', 'care_report_view')
on conflict do nothing;

-- Family members must never inherit organisation-wide resident access.
delete from public.role_permissions
where role_key = 'family_member'
  and permission_key = 'resident_view';
