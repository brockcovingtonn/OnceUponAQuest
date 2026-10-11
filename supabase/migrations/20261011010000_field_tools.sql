-- Field-walk tools: lets an admin (the founder) set a spot's GPS pin, upload
-- hint photos and quest covers, and mark spots verified from the app.
-- Admins are added by hand in SQL:
--   insert into private.admins (user_id)
--   select id from auth.users where email = 'you@example.com';

create table private.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
revoke all on private.admins from public, anon, authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admins a where a.user_id = auth.uid())
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Lets the app decide whether to show the field tools.
create or replace function public.am_i_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin()
$$;
revoke all on function public.am_i_admin() from public, anon;
grant execute on function public.am_i_admin() to authenticated;

-- Update a spot's pin, hint photo and/or verified flag. Null arguments leave
-- the current value unchanged; pass both p_lat and p_lng together.
create or replace function public.admin_update_spot(
  p_spot_id    uuid,
  p_lat        double precision default null,
  p_lng        double precision default null,
  p_photo_path text default null,
  p_verified   boolean default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception 'set lat and lng together' using errcode = '22023';
  end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> 'spots' then
    raise exception 'hint photos live under spots/' using errcode = '22023';
  end if;
  update public.spots
  set lat              = coalesce(p_lat, lat),
      lng              = coalesce(p_lng, lng),
      photo_path       = coalesce(p_photo_path, photo_path),
      verified_on_site = coalesce(p_verified, verified_on_site)
  where id = p_spot_id;
  if not found then
    raise exception 'spot not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_update_spot(uuid, double precision, double precision, text, boolean) from public, anon;
grant execute on function public.admin_update_spot(uuid, double precision, double precision, text, boolean) to authenticated;

create or replace function public.admin_set_quest_cover(p_quest_id uuid, p_photo_path text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if split_part(p_photo_path, '/', 1) <> 'quests' then
    raise exception 'quest covers live under quests/' using errcode = '22023';
  end if;
  update public.quests set cover_photo_path = p_photo_path where id = p_quest_id;
  if not found then
    raise exception 'quest not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_set_quest_cover(uuid, text) from public, anon;
grant execute on function public.admin_set_quest_cover(uuid, text) to authenticated;

-- Admins may upload and replace files in spot-photos.
create policy spot_photos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'spot-photos' and private.is_admin());
create policy spot_photos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'spot-photos' and private.is_admin())
  with check (bucket_id = 'spot-photos' and private.is_admin());
create policy spot_photos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'spot-photos' and private.is_admin());
