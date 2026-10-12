-- Metrics, error reports and offline check-in times.
--   supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local role postgres;

select plan(17);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function pg_temp.spot(p_quest text, p_order int) returns uuid language sql as $$
  select s.id from public.spots s join public.quests q on q.id = s.quest_id
  where q.slug = p_quest and s.sort_order = p_order
$$;
grant execute on all functions in schema pg_temp to authenticated, anon;

-- Treat everyone already in this database as staff so the counts below are exact.
insert into private.admins (user_id) select id from auth.users on conflict do nothing;

insert into auth.users (id, email) values
  ('a1000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('b1000000-0000-0000-0000-000000000002', 'bob@example.com'),
  ('c1000000-0000-0000-0000-000000000003', 'cat@example.com'),
  ('e1000000-0000-0000-0000-000000000005', 'eve@example.com');
insert into public.profiles (id, username, age_confirmed_13) values
  ('a1000000-0000-0000-0000-000000000001', 'ann', true),
  ('b1000000-0000-0000-0000-000000000002', 'bob', true),
  ('c1000000-0000-0000-0000-000000000003', 'cat', true),
  ('e1000000-0000-0000-0000-000000000005', 'eve', true);
insert into private.admins (user_id) values ('e1000000-0000-0000-0000-000000000005');

-- ---------------------------------------------------------------------------
-- Offline check-in times are honored, but clamped
-- ---------------------------------------------------------------------------
select pg_temp.act_as('a1000000-0000-0000-0000-000000000001');
select public.check_in(pg_temp.spot('ears-everywhere', o), p_photo_path => auth.uid()::text || '/p.jpg',
                       p_found_at => now() - interval '5 days')
from generate_series(1, 4) o;
select public.check_in(pg_temp.spot('windows-of-legends', 2), p_photo_path => auth.uid()::text || '/w.jpg',
                       p_found_at => now() - interval '3 days');
select ok(
  (select abs(extract(epoch from (created_at - (now() - interval '5 days')))) < 5
   from public.checkins where spot_id = pg_temp.spot('ears-everywhere', 1) and user_id = auth.uid()),
  'found_at from the offline queue is used for the check-in time');
select ok(
  (select abs(extract(epoch from (earned_at - (now() - interval '5 days')))) < 5
   from public.user_badges where user_id = auth.uid()),
  'badge is dated when the quest was actually finished');

select pg_temp.act_as('b1000000-0000-0000-0000-000000000002');
select public.check_in(pg_temp.spot('main-street-senses', 1), p_found_at => now() + interval '2 days');
select ok(
  (select created_at <= now() from public.checkins where user_id = auth.uid()),
  'a future time is clamped to now');
set local role postgres;
delete from public.checkins where user_id = 'b1000000-0000-0000-0000-000000000002';
select pg_temp.act_as('b1000000-0000-0000-0000-000000000002');
select public.check_in(pg_temp.spot('main-street-senses', 1), p_found_at => now() - interval '30 days');
select ok(
  (select created_at > now() - interval '7 days 1 minute' from public.checkins where user_id = auth.uid()),
  'a time more than 7 days old is clamped to 7 days');

-- Admin activity must not count
select pg_temp.act_as('e1000000-0000-0000-0000-000000000005');
select public.check_in(pg_temp.spot('main-street-senses', 1));

-- ---------------------------------------------------------------------------
-- Error reports
-- ---------------------------------------------------------------------------
set local role postgres;
select set_config('request.jwt.claims', '', true);
set local role anon;
select lives_ok(
  $$ insert into public.client_errors (message, fatal, platform) values ('Boom before sign-in', true, 'ios') $$,
  'signed-out app can send an error report');
select pg_temp.act_as('a1000000-0000-0000-0000-000000000001');
select lives_ok(
  $$ insert into public.client_errors (message, screen, platform) values ('Boom', '/spot/[id]', 'ios') $$,
  'signed-in app can send an error report');
select throws_ok(
  $$ insert into public.client_errors (user_id, message) values ('b1000000-0000-0000-0000-000000000002', 'spoof') $$,
  '42501', null, 'cannot send a report as someone else');
select is((select count(*) from public.client_errors), 0::bigint, 'explorers cannot read error reports');
select throws_ok($$ select public.admin_metrics() $$, '42501', null, 'explorers cannot read metrics');

-- ---------------------------------------------------------------------------
-- Metrics (as admin)
-- ---------------------------------------------------------------------------
select pg_temp.act_as('e1000000-0000-0000-0000-000000000005');
create temp table m as select public.admin_metrics() as j;
grant select on m to authenticated;
select is((select (j->>'explorers')::int from m), 3, 'explorers exclude admins');
select is((select j->'first_visit_finish' from m), '{"of": 2, "finished": 1}'::jsonb,
  '1 of 2 explorers finished a quest on their first visit');
select is((select j->'came_back' from m), '{"of": 1, "returned": 1}'::jsonb,
  'the finisher came back on a later day for another quest');
select is((select (j->>'visits')::int from m), 3, '3 visits (Ann x2, Bob x1)');
select is((select (j->>'checkins_per_visit')::numeric from m), 2.0, 'average 2 check-ins per visit');
select is((select j->'funnel' from m),
  '{"signed_up": 3, "onboarded": 3, "first_badge": 1, "first_checkin": 2}'::jsonb, 'funnel counts');
select is((select (j->>'errors_7d')::int from m), 2, 'error count in the last 7 days');
select is((select count(*) from public.admin_recent_errors(14)), 2::bigint, 'admin sees errors grouped by message');

select * from finish();
rollback;
