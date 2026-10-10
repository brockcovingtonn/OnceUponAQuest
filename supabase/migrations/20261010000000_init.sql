-- Once Upon a Quest — Phase 1 schema
-- Quests, spots, check-ins, badges, friends. Answer keys live in the `private`
-- schema, which is not exposed through the API; only check_in() reads them.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.quest_status as enum ('draft', 'live', 'retired');
create type public.checkin_method as enum ('answer', 'photo', 'listen', 'snack');
create type public.friendship_status as enum ('pending', 'accepted');
create type public.report_reason as enum ('spot_changed', 'unsafe', 'answer_wrong', 'other');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null unique
                    check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name      text check (char_length(display_name) <= 40),
  avatar_key        text,            -- one of the built-in stamp avatars
  avatar_url        text,            -- or a user-uploaded photo
  age_confirmed_13  boolean not null default false,
  terms_accepted_at timestamptz,
  created_at        timestamptz not null default now()
);
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- Places
-- ---------------------------------------------------------------------------
create table public.parks (
  id     text primary key,
  name   text not null,
  resort text not null
);

create table public.lands (
  id         text primary key,
  park_id    text not null references public.parks (id),
  name       text not null,
  sort_order int  not null default 0
);

-- ---------------------------------------------------------------------------
-- Quests, spots, badges
-- ---------------------------------------------------------------------------
create table public.badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  art_key     text not null            -- maps to a local original illustration
);

create table public.quests (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  land_id     text not null references public.lands (id),
  badge_id    uuid references public.badges (id),
  title       text not null,
  story       text,                    -- 2-3 line intro
  est_minutes int  not null default 15,
  sort_order  int  not null default 0,
  season      text,                    -- null = year-round
  is_premium  boolean not null default false,
  status      public.quest_status not null default 'draft',
  created_at  timestamptz not null default now()
);

create table public.spots (
  id                   uuid primary key default gen_random_uuid(),
  quest_id             uuid not null references public.quests (id) on delete cascade,
  sort_order           int  not null,
  teaser               text not null,  -- shown before the spot is found
  title                text not null,  -- shown after it's found
  where_to_stand       text not null,
  clue                 text not null,
  hint                 text,           -- revealed after 2 misses
  prompt               text not null,  -- what the check-in card asks
  method               public.checkin_method not null,
  lat                  double precision,
  lng                  double precision,
  radius_m             int not null default 40 check (radius_m between 10 and 200),
  pause_during_parades boolean not null default false,
  holiday_note         text,
  photo_path           text,           -- founder's own hint photo in storage
  verified_on_site     boolean not null default false,
  source_url           text,           -- internal research reference, never shown
  created_at           timestamptz not null default now(),
  unique (quest_id, sort_order),
  check ((lat is null) = (lng is null))
);
create index spots_quest_idx on public.spots (quest_id);

create table private.spot_answers (
  spot_id  uuid primary key references public.spots (id) on delete cascade,
  accepted text[] not null check (cardinality(accepted) > 0)
);

-- ---------------------------------------------------------------------------
-- Player progress
-- ---------------------------------------------------------------------------
create table public.checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  spot_id    uuid not null references public.spots (id) on delete cascade,
  method     public.checkin_method not null,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)
);
create index checkins_user_idx on public.checkins (user_id);

create table public.user_badges (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  badge_id  uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.friendships (
  requester  uuid not null references public.profiles (id) on delete cascade,
  addressee  uuid not null references public.profiles (id) on delete cascade,
  status     public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

create table public.spot_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_id    uuid not null references public.spots (id) on delete cascade,
  reason     public.report_reason not null,
  note       text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers (private)
-- ---------------------------------------------------------------------------
create or replace function private.normalize_answer(t text)
returns text language sql immutable as $$
  select regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]', '', 'g')
$$;

-- Great-circle distance in meters.
create or replace function private.distance_m(lat1 double precision, lng1 double precision,
                                              lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

create or replace function private.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a))
  )
$$;

-- ---------------------------------------------------------------------------
-- RPC: check_in
-- Returns: { ok, reason?, distance_m?, quest_complete, badge_slug? }
-- reasons: not_found | paused | too_far | location_required | wrong_answer | photo_required
-- ---------------------------------------------------------------------------
create or replace function public.check_in(
  p_spot_id    uuid,
  p_answer     text default null,
  p_lat        double precision default null,
  p_lng        double precision default null,
  p_photo_path text default null,
  p_parade_mode boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_spot      public.spots%rowtype;
  v_quest     public.quests%rowtype;
  v_dist      double precision;
  v_total     int;
  v_found     int;
  v_badge     text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select s.* into v_spot
  from public.spots s join public.quests q on q.id = s.quest_id
  where s.id = p_spot_id and q.status = 'live';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  select * into v_quest from public.quests where id = v_spot.quest_id;

  -- Already found: succeed quietly (idempotent).
  if exists (select 1 from public.checkins c where c.user_id = v_uid and c.spot_id = p_spot_id) then
    return jsonb_build_object('ok', true, 'already', true, 'quest_complete', false);
  end if;

  if p_parade_mode and v_spot.pause_during_parades then
    return jsonb_build_object('ok', false, 'reason', 'paused');
  end if;

  if v_spot.lat is not null then
    if p_lat is null or p_lng is null then
      return jsonb_build_object('ok', false, 'reason', 'location_required');
    end if;
    v_dist := private.distance_m(v_spot.lat, v_spot.lng, p_lat, p_lng);
    if v_dist > v_spot.radius_m + 25 then
      return jsonb_build_object('ok', false, 'reason', 'too_far', 'distance_m', round(v_dist));
    end if;
  end if;

  if v_spot.method = 'answer' then
    if not exists (
      select 1 from private.spot_answers a, unnest(a.accepted) acc
      where a.spot_id = p_spot_id
        and private.normalize_answer(acc) = private.normalize_answer(p_answer)
        and private.normalize_answer(p_answer) <> ''
    ) then
      return jsonb_build_object('ok', false, 'reason', 'wrong_answer');
    end if;
  elsif v_spot.method = 'photo' then
    if p_photo_path is null
       or split_part(p_photo_path, '/', 1) <> v_uid::text then
      return jsonb_build_object('ok', false, 'reason', 'photo_required');
    end if;
  end if;

  insert into public.checkins (user_id, spot_id, method, photo_path)
  values (v_uid, p_spot_id, v_spot.method, p_photo_path)
  on conflict (user_id, spot_id) do nothing;

  select count(*) into v_total from public.spots where quest_id = v_quest.id;
  select count(*) into v_found
  from public.checkins c join public.spots s on s.id = c.spot_id
  where c.user_id = v_uid and s.quest_id = v_quest.id;

  if v_found >= v_total and v_quest.badge_id is not null then
    insert into public.user_badges (user_id, badge_id)
    values (v_uid, v_quest.badge_id)
    on conflict do nothing;
    select slug into v_badge from public.badges where id = v_quest.badge_id;
    return jsonb_build_object('ok', true, 'quest_complete', true, 'badge_slug', v_badge);
  end if;

  return jsonb_build_object('ok', true, 'quest_complete', false,
                            'found', v_found, 'total', v_total);
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: friends_leaderboard — you + accepted friends
-- ---------------------------------------------------------------------------
create or replace function public.friends_leaderboard()
returns table (user_id uuid, username text, avatar_key text, avatar_url text,
               spots_found bigint, badges bigint, is_me boolean)
language sql stable security definer set search_path = ''
as $$
  with people as (
    select auth.uid() as id
    union
    select case when f.requester = auth.uid() then f.addressee else f.requester end
    from public.friendships f
    where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
  )
  select p.id, p.username, p.avatar_key, p.avatar_url,
         (select count(*) from public.checkins c where c.user_id = p.id),
         (select count(*) from public.user_badges b where b.user_id = p.id),
         p.id = auth.uid()
  from people x join public.profiles p on p.id = x.id
  order by 5 desc, 6 desc, p.username
$$;

-- ---------------------------------------------------------------------------
-- RPC: username_available
-- ---------------------------------------------------------------------------
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[A-Za-z0-9_]{3,24}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username))
$$;

-- ---------------------------------------------------------------------------
-- RPC: delete_my_account (required by the app stores)
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();   -- cascades to profiles and progress
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.parks        enable row level security;
alter table public.lands        enable row level security;
alter table public.badges       enable row level security;
alter table public.quests       enable row level security;
alter table public.spots        enable row level security;
alter table public.checkins     enable row level security;
alter table public.user_badges  enable row level security;
alter table public.friendships  enable row level security;
alter table public.spot_reports enable row level security;

-- Profiles: anyone signed in can see usernames/avatars; you edit only yours.
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = auth.uid() and age_confirmed_13);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Content: read-only for signed-in users; only live quests and their spots.
create policy parks_read  on public.parks  for select to authenticated using (true);
create policy lands_read  on public.lands  for select to authenticated using (true);
create policy badges_read on public.badges for select to authenticated using (true);
create policy quests_read on public.quests for select to authenticated using (status = 'live');
create policy spots_read  on public.spots  for select to authenticated
  using (exists (select 1 from public.quests q where q.id = quest_id and q.status = 'live'));

-- Progress: you see your own and your friends'; writes only through check_in().
create policy checkins_read on public.checkins for select to authenticated
  using (user_id = auth.uid() or private.are_friends(auth.uid(), user_id));
create policy user_badges_read on public.user_badges for select to authenticated
  using (user_id = auth.uid() or private.are_friends(auth.uid(), user_id));

-- Friendships: see your own; send as requester; addressee accepts; either side removes.
create policy friendships_read on public.friendships for select to authenticated
  using (auth.uid() in (requester, addressee));
create policy friendships_send on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');
create policy friendships_accept on public.friendships for update to authenticated
  using (addressee = auth.uid()) with check (addressee = auth.uid() and status = 'accepted');
create policy friendships_remove on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

-- Reports: insert only.
create policy reports_insert on public.spot_reports for insert to authenticated
  with check (user_id = auth.uid());

-- Private schema: signed-in users may call are_friends() (used by RLS policies)
-- but can never read answer keys.
grant usage on schema private to authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on function private.are_friends(uuid, uuid) from public;
grant execute on function private.are_friends(uuid, uuid) to authenticated;

-- Function access
revoke all on function public.check_in(uuid, text, double precision, double precision, text, boolean) from public, anon;
revoke all on function public.friends_leaderboard() from public, anon;
revoke all on function public.username_available(text) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.check_in(uuid, text, double precision, double precision, text, boolean) to authenticated;
grant execute on function public.friends_leaderboard() to authenticated;
grant execute on function public.username_available(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for check-in photos, one folder per user (<uid>/...)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

create policy checkin_photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy checkin_photos_read_own on storage.objects for select to authenticated
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy checkin_photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
