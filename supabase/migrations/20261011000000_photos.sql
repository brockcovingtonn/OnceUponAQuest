-- Photos: spot hint photos + quest covers (founder content), and profile photos.
-- All buckets are private; signed-in users read through the authenticated
-- storage endpoint, so nothing is reachable by a public URL.

-- ---------------------------------------------------------------------------
-- Quest cover photos (path in the spot-photos bucket, like spots.photo_path)
-- ---------------------------------------------------------------------------
alter table public.quests add column cover_photo_path text;

-- ---------------------------------------------------------------------------
-- spot-photos: founder's own hint photos and quest covers.
-- Uploaded with the service role (no insert policy for users); any signed-in
-- user can view them.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spot-photos', 'spot-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy spot_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'spot-photos');

-- ---------------------------------------------------------------------------
-- avatars: "Use my own photo". Each user writes only <user id>/...; any
-- signed-in user can view (friends lists, requests, leaderboard).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- profiles.avatar_url holds a path in the avatars bucket, and only in the
-- user's own folder.
alter table public.profiles add constraint profiles_avatar_path_own
  check (avatar_url is null or split_part(avatar_url, '/', 1) = id::text);

-- ---------------------------------------------------------------------------
-- Check-in photos: enforce the 1 MB JPEG limit the app already compresses to.
-- ---------------------------------------------------------------------------
update storage.buckets
set file_size_limit = 1048576, allowed_mime_types = array['image/jpeg']
where id = 'checkin-photos';
