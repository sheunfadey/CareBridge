-- =============================================================================
-- CareBridge - Course cover images
-- Migration: 0047_course_cover_storage.sql
--
-- A public bucket for course cover images. Objects use the path
-- <course_id>/cover and are readable by anyone so the catalogue, course page
-- and studio can render them without signed URLs. Only course managers can
-- write or delete. The bucket restricts size and image type.
-- =============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'course-covers',
  'course-covers',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "course_covers_select" on storage.objects;
drop policy if exists "course_covers_insert" on storage.objects;
drop policy if exists "course_covers_update" on storage.objects;
drop policy if exists "course_covers_delete" on storage.objects;

create policy "course_covers_select" on storage.objects
  for select using (bucket_id = 'course-covers');

create policy "course_covers_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-covers'
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        then public.can_manage_course(((storage.foldername(name))[1])::uuid)
      else false
    end
  );

create policy "course_covers_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'course-covers'
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        then public.can_manage_course(((storage.foldername(name))[1])::uuid)
      else false
    end
  )
  with check (
    bucket_id = 'course-covers'
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        then public.can_manage_course(((storage.foldername(name))[1])::uuid)
      else false
    end
  );

create policy "course_covers_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-covers'
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        then public.can_manage_course(((storage.foldername(name))[1])::uuid)
      else false
    end
  );
