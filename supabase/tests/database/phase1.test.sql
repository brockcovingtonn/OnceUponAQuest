-- Phase 1 security and game-rule tests. Run against the local stack:
--   supabase test db
-- Everything runs inside a transaction and is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
-- Hosted test connections log in as a helper role with a short search_path.
set local search_path = public, extensions;
set local role postgres;

select plan(50);

-- Test the rules, not live pins: clear any field-walk pins inside this rolled-back transaction.
update public.spots set lat = null, lng = null where lat is not null;

-- ---------------------------------------------------------------------------
-- Helpers (temporary, dropped with the rollback)
-- ---------------------------------------------------------------------------
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

-- Spot ids resolved up front (as postgres) so the tests below read clearly.
create temp table t_spots as select
  pg_temp.spot('windows-of-legends', 1) as elias,        -- answer, parade-paused
  pg_temp.spot('windows-of-legends', 4) as sherman,      -- answer, not paused
  pg_temp.spot('walt-was-here', 2)      as fire_wagon,   -- answer, gets a GPS pin below
  pg_temp.spot('walt-was-here', 1)      as walts_lamp,   -- photo
  pg_temp.spot('main-street-senses', 1) as phones;       -- listen
grant select on t_spots to authenticated, anon;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

-- ---------------------------------------------------------------------------
-- Seed content
-- ---------------------------------------------------------------------------
select is((select count(*) from public.quests where status = 'live' and not is_premium), 20::bigint, 'seed: 20 free live quests');
select is((select count(*) from public.spots s join public.quests q on q.id = s.quest_id where not q.is_premium), 93::bigint, 'seed: 93 spots in free quests');
select is((select count(*) from public.lands where park_id = 'disneyland-park'), 9::bigint, 'seed: 9 lands');
select is(
  (select count(*) from public.lands l
   where (select count(*) from public.quests q where q.land_id = l.id and q.status = 'live') < 2
     and l.id <> 'dlp-main-street'),
  0::bigint, 'seed: every new land has at least 2 live quests');
select is(
  (select count(*) from public.spots s
   where s.method = 'answer'
     and not exists (select 1 from private.spot_answers a where a.spot_id = s.id)),
  0::bigint, 'seed: every answer spot has an answer key');

-- ---------------------------------------------------------------------------
-- Answer keys never reach the client
-- ---------------------------------------------------------------------------
select ok(not has_table_privilege('authenticated', 'private.spot_answers', 'select'),
  'authenticated role has no SELECT on answer keys');
select ok(not has_table_privilege('anon', 'private.spot_answers', 'select'),
  'anon role has no SELECT on answer keys');
select ok(not ('private' = any (string_to_array(
    coalesce(current_setting('pgrst.db_schemas', true), 'public,graphql_public'), ','))),
  'private schema is not exposed through the API');

-- ---------------------------------------------------------------------------
-- User A: profile + age gate
-- ---------------------------------------------------------------------------
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ insert into public.profiles (id, username)
     values ('11111111-1111-1111-1111-111111111111', 'lampLighter') $$,
  '42501', null, 'profile insert without the 13+ age gate is rejected');
select lives_ok(
  $$ insert into public.profiles (id, username, age_confirmed_13)
     values ('11111111-1111-1111-1111-111111111111', 'lampLighter', true) $$,
  'profile insert with the 13+ age gate succeeds');
select throws_ok(
  $$ insert into public.profiles (id, username, age_confirmed_13)
     values ('22222222-2222-2222-2222-222222222222', 'impostor', true) $$,
  '42501', null, 'cannot create a profile for someone else');
select is(public.username_available('LAMPLIGHTER'), false, 'username check is case-insensitive');
select is(public.username_available('castleCrumb'), true, 'free username is available');
select is(public.username_available('ab'), false, 'too-short username is not available');

select throws_ok($$ select * from private.spot_answers $$,
  '42501', null, 'signed-in user cannot read answer keys');
select throws_ok(
  $$ insert into public.checkins (user_id, spot_id, method)
     select auth.uid(), id, 'photo' from public.spots limit 1 $$,
  '42501', null, 'signed-in user cannot insert check-ins directly');

-- ---------------------------------------------------------------------------
-- check_in: answers
-- ---------------------------------------------------------------------------
select is(public.check_in(gen_random_uuid(), 'x') ->> 'reason', 'not_found', 'unknown spot -> not_found');
select is(public.check_in((select sherman from t_spots), 'music store') ->> 'reason',
  'wrong_answer', 'wrong answer is rejected');
select is(public.check_in((select sherman from t_spots), '') ->> 'reason',
  'wrong_answer', 'empty answer is rejected');
select is(public.check_in((select sherman from t_spots), '  TWENTIETH century music company!') ->> 'ok',
  'true', 'answer matching ignores case, spaces and punctuation');
select is(public.check_in((select sherman from t_spots), 'anything') ->> 'already',
  'true', 'checking in again is idempotent');

-- ---------------------------------------------------------------------------
-- check_in: parade mode
-- ---------------------------------------------------------------------------
select is(public.check_in((select elias from t_spots), 'Elias', p_parade_mode => true) ->> 'reason',
  'paused', 'parade mode pauses a flagged spot');
select is(public.check_in((select fire_wagon from t_spots), '1960', p_parade_mode => true) ->> 'ok',
  'true', 'parade mode does not pause unflagged spots');
select is(public.check_in((select elias from t_spots), 'elias disney') ->> 'ok',
  'true', 'flagged spot works with parade mode off');

-- ---------------------------------------------------------------------------
-- check_in: photos must be in the user's own folder; honor-system methods
-- ---------------------------------------------------------------------------
select is(public.check_in((select walts_lamp from t_spots)) ->> 'reason',
  'photo_required', 'photo spot without a photo -> photo_required');
select is(public.check_in((select walts_lamp from t_spots),
    p_photo_path => '22222222-2222-2222-2222-222222222222/x.jpg') ->> 'reason',
  'photo_required', 'photo in someone else''s folder is rejected');
select is(public.check_in((select walts_lamp from t_spots),
    p_photo_path => '11111111-1111-1111-1111-111111111111/lamp.jpg') ->> 'ok',
  'true', 'photo in own folder is accepted');
select is(public.check_in((select phones from t_spots)) ->> 'ok',
  'true', 'listen spot checks in on the honor system');

-- ---------------------------------------------------------------------------
-- Badge awarded when the quest is complete
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(public.check_in(s.id, p_photo_path => auth.uid()::text || '/p.jpg') ->> 'quest_complete'
                    order by s.sort_order)
   from public.spots s join public.quests q on q.id = s.quest_id
   where q.slug = 'ears-everywhere'),
  array['false', 'false', 'false', 'true'],
  'only the last spot of Ears Everywhere completes the quest');
select is(
  (select array_agg(b.slug) from public.user_badges ub join public.badges b on b.id = ub.badge_id),
  array['ears-everywhere'], 'Ears Everywhere badge is awarded');

-- ---------------------------------------------------------------------------
-- Geofence (spot gets a GPS pin; radius 40 m + 25 m tolerance)
-- ---------------------------------------------------------------------------
set local role postgres;
update public.spots set lat = 33.8110, lng = -117.9190
  where id = (select pg_temp.spot('windows-of-legends', 3));
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select is(public.check_in(pg_temp.spot('windows-of-legends', 3), 'Broggie') ->> 'reason',
  'location_required', 'pinned spot without a location -> location_required');
select is(public.check_in(pg_temp.spot('windows-of-legends', 3), 'Broggie', 33.8200, -117.9190) ->> 'reason',
  'too_far', 'pinned spot ~1 km away -> too_far');
select is(public.check_in(pg_temp.spot('windows-of-legends', 3), 'Broggie', 33.81105, -117.91905) ->> 'ok',
  'true', 'pinned spot a few meters away -> ok');

-- ---------------------------------------------------------------------------
-- Profile photos must live in the user's own avatars folder
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ update public.profiles set avatar_url = '22222222-2222-2222-2222-222222222222/me.jpg'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'avatar path in someone else''s folder is rejected');
select lives_ok(
  $$ update public.profiles set avatar_url = '11111111-1111-1111-1111-111111111111/avatar.jpg'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'avatar path in own folder is accepted');

-- ---------------------------------------------------------------------------
-- Friends + leaderboard
-- ---------------------------------------------------------------------------
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
insert into public.profiles (id, username, age_confirmed_13)
  values ('22222222-2222-2222-2222-222222222222', 'castleCrumb', true);

select is((select count(*) from public.checkins), 0::bigint,
  'B cannot see A''s check-ins before becoming friends');
select throws_ok(
  $$ insert into public.friendships (requester, addressee, status)
     values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted') $$,
  '42501', null, 'cannot create an already-accepted friendship');
insert into public.friendships (requester, addressee)
  values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
update public.friendships set status = 'accepted';
select is((select status::text from public.friendships), 'pending',
  'requester cannot accept their own request');

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
update public.friendships set status = 'accepted'
  where requester = '22222222-2222-2222-2222-222222222222';

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select ok((select count(*) from public.checkins) > 0,
  'B sees A''s check-ins after A accepts');
select results_eq(
  $$ select username, is_me from public.friends_leaderboard() $$,
  $$ values ('lampLighter'::text, false), ('castleCrumb'::text, true) $$,
  'leaderboard ranks friends by spots found and flags the current user');

-- ---------------------------------------------------------------------------
-- Field tools are admin-only
-- ---------------------------------------------------------------------------
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select is(public.am_i_admin(), false, 'regular user is not an admin');
select throws_ok(
  $$ select public.admin_update_spot((select elias from t_spots), 33.8, -117.9) $$,
  '42501', null, 'regular user cannot set a spot pin');
select throws_ok($$ select * from private.admins $$, '42501', null, 'admin list is not readable');
set local role postgres;
insert into private.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select is(public.am_i_admin(), true, 'admin is recognised');
select lives_ok(
  $$ select public.admin_update_spot((select sherman from t_spots), 33.81, -117.919, 'spots/sherman.jpg', true) $$,
  'admin can set pin, hint photo and verified');
select throws_ok(
  $$ select public.admin_update_spot((select sherman from t_spots), 33.81, null) $$,
  '22023', null, 'lat without lng is rejected');

-- ---------------------------------------------------------------------------
-- Signed-out users can't call anything
-- ---------------------------------------------------------------------------
set local role postgres;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok($$ select public.check_in(gen_random_uuid()) $$,
  '42501', null, 'anon cannot call check_in');
select is((select count(*) from public.quests), 0::bigint, 'anon sees no quests');

-- ---------------------------------------------------------------------------
-- Account deletion cascades
-- ---------------------------------------------------------------------------
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok($$ select public.delete_my_account() $$, 'user can delete their own account');
set local role postgres;
select is(
  (select count(*) from public.checkins where user_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'deleting the account removes the user''s check-ins and profile');

select * from finish();
rollback;
