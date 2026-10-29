-- =============================================================================
-- CareBridge — Phase 3: notifications foundation
-- Migration: 0006_notifications.sql
--
-- In-app notification centre. Notifications are always owned by a single user.
-- Reads and read-state changes happen under RLS as that user. Writes are made by
-- the server (service role) when platform events occur. Ordinary in-app
-- notifications are explicitly NOT an emergency channel; critical safeguarding
-- events have a separate escalation process.
-- =============================================================================

create type notification_category as enum (
  'account',
  'learning',
  'assessment',
  'internship',
  'employment',
  'referral',
  'payment',
  'charity',
  'care_operations',
  'platform'
);

create type notification_priority as enum (
  'low',
  'normal',
  'high'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete set null,
  category notification_category not null default 'platform',
  priority notification_priority not null default 'normal',
  title text not null,
  body text,
  -- Optional in-app destination for the notification, e.g. /dashboard/academy.
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- Notification events ---------------------------------------------------------

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete set null,
  event_type text not null,
  title text not null,
  body text,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  dedupe_key text unique
);

create index notification_events_user_idx
  on public.notification_events (user_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.notification_events enable row level security;

-- A user reads and updates only their own notifications. Inserts are created by
-- the server on the user's behalf (super admin or an explicit grant), never by
-- the user themselves.
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_insert_platform on public.notifications
  for insert with check (
    public.is_super_admin()
    or public.has_permission('user_view', organisation_id)
  );

create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid() or public.is_super_admin());

create policy notification_events_select_own on public.notification_events
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy notification_events_update_own on public.notification_events
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notification_events_insert_platform on public.notification_events
  for insert with check (
    public.is_super_admin()
    or public.has_permission('user_view', organisation_id)
  );

-- Unread count helper (respects RLS via security invoker semantics). ----------
create or replace function public.unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.notifications
  where user_id = auth.uid()
    and read_at is null;
$$;
