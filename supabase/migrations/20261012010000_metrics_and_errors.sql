-- Success metrics (admin Insights screen), first-party error reports, and
-- accurate times for check-ins made offline.

-- ---------------------------------------------------------------------------
-- check_in: accept when the check-in actually happened (offline queue).
-- Clamped to the last 7 days and never in the future.
-- ---------------------------------------------------------------------------
drop function public.check_in(uuid, text, double precision, double precision, text, boolean);

create function public.check_in(
  p_spot_id     uuid,
  p_answer      text default null,
  p_lat         double precision default null,
  p_lng         double precision default null,
  p_photo_path  text default null,
  p_parade_mode boolean default false,
  p_found_at    timestamptz default null
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
  v_found_at  timestamptz := least(now(), greatest(coalesce(p_found_at, now()), now() - interval '7 days'));
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

  insert into public.checkins (user_id, spot_id, method, photo_path, created_at)
  values (v_uid, p_spot_id, v_spot.method, p_photo_path, v_found_at)
  on conflict (user_id, spot_id) do nothing;

  select count(*) into v_total from public.spots where quest_id = v_quest.id;
  select count(*) into v_found
  from public.checkins c join public.spots s on s.id = c.spot_id
  where c.user_id = v_uid and s.quest_id = v_quest.id;

  if v_found >= v_total and v_quest.badge_id is not null then
    insert into public.user_badges (user_id, badge_id, earned_at)
    values (v_uid, v_quest.badge_id, v_found_at)
    on conflict do nothing;
    select slug into v_badge from public.badges where id = v_quest.badge_id;
    return jsonb_build_object('ok', true, 'quest_complete', true, 'badge_slug', v_badge);
  end if;

  return jsonb_build_object('ok', true, 'quest_complete', false,
                            'found', v_found, 'total', v_total);
end;
$$;
revoke all on function public.check_in(uuid, text, double precision, double precision, text, boolean, timestamptz) from public, anon;
grant execute on function public.check_in(uuid, text, double precision, double precision, text, boolean, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Error reports from the app (first-party crash reporting).
-- Anyone may send one (errors can happen before sign-in); only admins read.
-- ---------------------------------------------------------------------------
create table public.client_errors (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid default auth.uid() references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  occurred_at      timestamptz not null default now(),
  message          text not null check (char_length(message) between 1 and 1000),
  stack            text check (char_length(stack) <= 6000),
  screen           text check (char_length(screen) <= 200),
  fatal            boolean not null default false,
  app_version      text check (char_length(app_version) <= 40),
  update_id        text check (char_length(update_id) <= 80),
  runtime_version  text check (char_length(runtime_version) <= 80),
  platform         text check (char_length(platform) <= 40)
);
create index client_errors_recent_idx on public.client_errors (created_at desc);
alter table public.client_errors enable row level security;
create policy client_errors_insert on public.client_errors for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy client_errors_admin_read on public.client_errors for select to authenticated
  using (private.is_admin());
grant insert on public.client_errors to anon;

-- Recent errors grouped by message (also prunes reports older than 90 days).
create or replace function public.admin_recent_errors(p_days int default 14)
returns table (message text, occurrences bigint, users bigint, fatal boolean, last_seen timestamptz,
               app_version text, update_id text, platform text, screen text, stack text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  delete from public.client_errors where created_at < now() - interval '90 days';
  return query
    select e.message,
           count(*),
           count(distinct e.user_id),
           bool_or(e.fatal),
           max(e.occurred_at),
           (array_agg(e.app_version order by e.occurred_at desc))[1],
           (array_agg(e.update_id order by e.occurred_at desc))[1],
           (array_agg(e.platform order by e.occurred_at desc))[1],
           (array_agg(e.screen order by e.occurred_at desc))[1],
           (array_agg(e.stack order by e.occurred_at desc))[1]
    from public.client_errors e
    where e.created_at > now() - make_interval(days => greatest(p_days, 1))
    group by e.message
    order by max(e.occurred_at) desc
    limit 50;
end;
$$;
revoke all on function public.admin_recent_errors(int) from public, anon;
grant execute on function public.admin_recent_errors(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Success metrics (PRODUCT_SPEC.md), in park time (Pacific). Admin accounts
-- are excluded so testing doesn't skew the numbers.
-- A "visit" is one explorer's check-ins on one park day.
-- ---------------------------------------------------------------------------
create or replace function public.admin_metrics()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_result jsonb;
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;

  with
  explorers as (
    select p.id, p.created_at from public.profiles p
    where not exists (select 1 from private.admins a where a.user_id = p.id)
  ),
  park_checkins as (
    select c.user_id, c.spot_id, s.quest_id,
           (c.created_at at time zone 'America/Los_Angeles')::date as day
    from public.checkins c
    join public.spots s on s.id = c.spot_id
    join explorers e on e.id = c.user_id
  ),
  visits as (
    select user_id, day, count(*) as checkins from park_checkins group by user_id, day
  ),
  first_visit as (
    select user_id, min(day) as day from visits group by user_id
  ),
  badge_days as (
    select ub.user_id, q.id as quest_id, (ub.earned_at at time zone 'America/Los_Angeles')::date as day
    from public.user_badges ub
    join public.quests q on q.badge_id = ub.badge_id
    join explorers e on e.id = ub.user_id
  ),
  first_finish as (
    select user_id, min(day) as day from badge_days group by user_id
  ),
  finished_on_first_visit as (
    select f.user_id from first_visit f
    where exists (select 1 from badge_days b where b.user_id = f.user_id and b.day = f.day)
  ),
  came_back as (
    -- After finishing a first quest, checked in on a later day at a quest
    -- they hadn't already finished by then.
    select ff.user_id from first_finish ff
    where exists (
      select 1 from park_checkins pc
      where pc.user_id = ff.user_id and pc.day > ff.day
        and pc.quest_id not in (select b.quest_id from badge_days b where b.user_id = ff.user_id and b.day <= ff.day)
    )
  ),
  today as (select (now() at time zone 'America/Los_Angeles')::date as day)
  select jsonb_build_object(
    'generated_at', now(),
    'explorers', (select count(*) from explorers),
    'new_explorers_7d', (select count(*) from explorers where created_at > now() - interval '7 days'),
    'active_today', (select count(distinct user_id) from visits, today where visits.day = today.day),
    'active_7d', (select count(distinct user_id) from visits, today where visits.day > today.day - 7),
    'first_visit_finish', jsonb_build_object(
      'finished', (select count(*) from finished_on_first_visit),
      'of', (select count(*) from first_visit)),
    'came_back', jsonb_build_object(
      'returned', (select count(*) from came_back),
      'of', (select count(*) from first_finish)),
    'checkins_per_visit', (select round(avg(checkins), 1) from visits),
    'visits', (select count(*) from visits),
    'funnel', jsonb_build_object(
      'signed_up', (select count(*) from auth.users u where not exists (select 1 from private.admins a where a.user_id = u.id)),
      'onboarded', (select count(*) from explorers),
      'first_checkin', (select count(*) from first_visit),
      'first_badge', (select count(*) from first_finish)),
    'quests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', q.title,
        'started', (select count(distinct pc.user_id) from park_checkins pc where pc.quest_id = q.id),
        'finished', (select count(*) from badge_days b where b.quest_id = q.id)
      ) order by q.sort_order)
      from public.quests q where q.status = 'live'), '[]'::jsonb),
    'spot_reports', coalesce((
      select jsonb_agg(r order by r.reports desc)
      from (
        select s.title, q.title as quest, count(*) as reports, max(sr.created_at) as latest
        from public.spot_reports sr
        join public.spots s on s.id = sr.spot_id
        join public.quests q on q.id = s.quest_id
        group by s.id, s.title, q.title
        order by count(*) desc
        limit 10
      ) r), '[]'::jsonb),
    'open_user_reports', (select count(*) from public.user_reports where status = 'open'),
    'errors_7d', (select count(*) from public.client_errors where created_at > now() - interval '7 days')
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;
