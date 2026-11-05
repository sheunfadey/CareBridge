-- =============================================================================
-- CareBridge - Direct messaging
-- Migration: 0032_direct_messaging.sql
--
-- Organisation-scoped conversations. Only active members of the same
-- organisation can be added to a conversation. Messages are append-only and
-- readable only by conversation participants; there is no cross-tenant access.
-- Notifications are created by the security-definer RPCs so recipients are told
-- about new messages without exposing the notification insert policy.
-- =============================================================================

alter type notification_category add value if not exists 'message';

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  subject text not null
    check (char_length(btrim(subject)) between 3 and 160),
  created_by uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  last_message_sender_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_organisation_idx
  on public.conversations (organisation_id, last_message_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  is_muted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create index conversation_participants_user_idx
  on public.conversation_participants (user_id, conversation_id);
create index conversation_participants_conversation_idx
  on public.conversation_participants (conversation_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null
    check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx
  on public.messages (conversation_id, created_at);
create index messages_sender_idx
  on public.messages (sender_id, created_at desc);

-- Messages are history: corrections are new messages, never edits or deletes.
create or replace function public.guard_message_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Messages are append-only; send a new message instead';
end;
$$;

create trigger messages_guard_history
  before update or delete on public.messages
  for each row execute function public.guard_message_history();

-- Access helper ---------------------------------------------------------------

create or replace function public.is_conversation_participant(
  p_conversation uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants p
    where p.conversation_id = p_conversation
      and p.user_id = auth.uid()
  );
$$;

-- Start a conversation --------------------------------------------------------

create or replace function public.start_conversation(
  p_organisation uuid,
  p_participant_ids uuid[],
  p_subject text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ids uuid[];
  v_subject text := btrim(coalesce(p_subject, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_conversation uuid;
  v_sender_name text;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if not public.is_org_member(p_organisation) then
    raise exception 'You are not a member of this organisation'
      using errcode = '42501';
  end if;

  select array_agg(distinct pid) into v_ids
  from unnest(coalesce(p_participant_ids, '{}'::uuid[])) as pid
  where pid <> v_user;

  if v_ids is null or array_length(v_ids, 1) = 0 then
    raise exception 'Select at least one recipient' using errcode = '22023';
  end if;

  if array_length(v_ids, 1) > 20 then
    raise exception 'A conversation can include at most 20 recipients'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_ids) as pid
    where not exists (
      select 1
      from public.organisation_memberships m
      where m.organisation_id = p_organisation
        and m.user_id = pid
        and m.status = 'active'
    )
  ) then
    raise exception 'Every recipient must be an active member of this organisation'
      using errcode = '42501';
  end if;

  if char_length(v_subject) < 3 or char_length(v_subject) > 160 then
    raise exception 'Subject must be between 3 and 160 characters'
      using errcode = '22023';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception 'Message must be between 1 and 4000 characters'
      using errcode = '22023';
  end if;

  insert into public.conversations (
    organisation_id,
    subject,
    created_by,
    last_message_at,
    last_message_preview,
    last_message_sender_id
  )
  values (
    p_organisation,
    v_subject,
    v_user,
    now(),
    left(v_body, 140),
    v_user
  )
  returning id into v_conversation;

  insert into public.conversation_participants (
    conversation_id,
    user_id,
    last_read_at
  )
  values (v_conversation, v_user, now());

  insert into public.conversation_participants (conversation_id, user_id)
  select v_conversation, pid from unnest(v_ids) as pid;

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conversation, v_user, v_body);

  select coalesce(p.full_name, p.email, 'A colleague')
  into v_sender_name
  from public.profiles p
  where p.id = v_user;

  insert into public.notifications (
    user_id,
    organisation_id,
    category,
    priority,
    title,
    body,
    action_url,
    metadata
  )
  select
    pid,
    p_organisation,
    'message',
    'normal',
    'New message from ' || coalesce(v_sender_name, 'a colleague'),
    left(v_body, 140),
    '/dashboard/messages?conversation=' || v_conversation,
    jsonb_build_object(
      'conversationId', v_conversation,
      'senderId', v_user
    )
  from unnest(v_ids) as pid;

  return v_conversation;
end;
$$;

-- Send a message --------------------------------------------------------------

create or replace function public.send_message(
  p_conversation uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_conversation public.conversations%rowtype;
  v_message uuid;
  v_sender_name text;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_conversation
  from public.conversations
  where id = p_conversation
  for update;

  if not found or not public.is_conversation_participant(p_conversation) then
    raise exception 'Conversation not found' using errcode = 'P0002';
  end if;

  if char_length(v_body) < 1 or char_length(v_body) > 4000 then
    raise exception 'Message must be between 1 and 4000 characters'
      using errcode = '22023';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation, v_user, v_body)
  returning id into v_message;

  update public.conversations
  set last_message_at = now(),
      last_message_preview = left(v_body, 140),
      last_message_sender_id = v_user
  where id = p_conversation;

  select coalesce(p.full_name, p.email, 'A colleague')
  into v_sender_name
  from public.profiles p
  where p.id = v_user;

  insert into public.notifications (
    user_id,
    organisation_id,
    category,
    priority,
    title,
    body,
    action_url,
    metadata
  )
  select
    cp.user_id,
    v_conversation.organisation_id,
    'message',
    'normal',
    'New message from ' || coalesce(v_sender_name, 'a colleague'),
    left(v_body, 140),
    '/dashboard/messages?conversation=' || p_conversation,
    jsonb_build_object(
      'conversationId', p_conversation,
      'senderId', v_user
    )
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation
    and cp.user_id <> v_user;

  return v_message;
end;
$$;

-- Read receipts ---------------------------------------------------------------

create or replace function public.mark_conversation_read(p_conversation uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation
    and user_id = auth.uid();

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.start_conversation(uuid, uuid[], text, text)
  from public, anon;
revoke all on function public.send_message(uuid, text) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.start_conversation(uuid, uuid[], text, text)
  to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Row Level Security ----------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy conversations_select on public.conversations
  for select using (
    public.is_super_admin()
    or public.is_conversation_participant(id)
  );

create policy conversation_participants_select
  on public.conversation_participants
  for select using (
    public.is_super_admin()
    or public.is_conversation_participant(conversation_id)
  );

create policy messages_select on public.messages
  for select using (
    public.is_super_admin()
    or public.is_conversation_participant(conversation_id)
  );
