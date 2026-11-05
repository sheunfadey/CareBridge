-- =============================================================================
-- CareBridge - Course resource storage
-- Migration: 0036_course_resource_storage.sql
--
-- A private bucket for uploaded course resources. Objects use the path
-- course/<course_id>/<file>. Course managers can upload and delete; enrolled
-- learners can read. Non-private resources on published public courses are
-- readable by any signed-in user.
-- =============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'course-resources',
  'course-resources',
  false,
  52428800,
  null
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course_resources_select" on storage.objects;
drop policy if exists "course_resources_insert" on storage.objects;
drop policy if exists "course_resources_delete" on storage.objects;

create policy "course_resources_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'course-resources'
    and (
      public.can_manage_course(((storage.foldername(name))[2])::uuid)
      or public.is_enrolled(((storage.foldername(name))[2])::uuid)
      or exists (
        select 1
        from public.learning_resources lr
        join public.courses c on c.id = lr.course_id
        where lr.storage_path = storage.objects.name
          and not lr.is_private
          and c.status = 'published'
          and c.is_public
      )
    )
  );

create policy "course_resources_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-resources'
    and public.can_manage_course(((storage.foldername(name))[2])::uuid)
  );

create policy "course_resources_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-resources'
    and public.can_manage_course(((storage.foldername(name))[2])::uuid)
  );
