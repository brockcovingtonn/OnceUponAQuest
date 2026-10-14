-- Storybook Lens: landmarks, Lens stamps, field tools and content editing.
--   supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local role postgres;

select plan(20);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users (id, email) values
  ('a3000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('b3000000-0000-0000-0000-000000000002', 'bo@example.com'),
  ('c3000000-0000-0000-0000-000000000003', 'cy@example.com'),
  ('e3000000-0000-0000-0000-000000000005', 'eve@example.com');
insert into public.profiles (id, username, age_confirmed_13) values
  ('a3000000-0000-0000-0000-000000000001', 'ann', true),
  ('b3000000-0000-0000-0000-000000000002', 'bobo', true),
  ('c3000000-0000-0000-0000-000000000003', 'cyrus', true),
  ('e3000000-0000-0000-0000-000000000005', 'eve', true);
insert into private.admins (user_id) values ('e3000000-0000-0000-0000-000000000005');
-- Ann and Bo are friends; Cy is a stranger.
insert into public.friendships (requester, addressee, status) values
  ('a3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 'accepted');

create temp table t as select
  (select id from public.landmarks where slug = 'the-castle') as castle,
  (select id from public.landmarks where slug = 'the-monorail') as monorail;
grant select on t to authenticated;

-- Content
select ok((select count(*) from public.landmarks where status = 'live') >= 36, 'seed: at least 36 live landmarks');
select is(
  (select count(*) from public.lands l where l.park_id = 'disneyland-park'
     and (select count(*) from public.landmarks m where m.land_id = l.id) < 4),
  0::bigint, 'seed: every land has at least 4 landmarks');
select is((select count(*) from public.landmarks where num_nonnulls(architecture, story, history, engineering) < 2),
  0::bigint, 'seed: every landmark has at least 2 layers');
select ok((select count(*) from public.spots where landmark_id is not null) >= 30, 'seed: quest spots link to their stories');

-- Explorers read landmarks but can't write stamps directly
select pg_temp.act_as('a3000000-0000-0000-0000-000000000001');
select ok((select count(*) from public.landmarks) >= 36, 'explorers can read landmarks');
select throws_ok(
  $$ insert into public.lens_stamps (user_id, landmark_id) values ('a3000000-0000-0000-0000-000000000001', (select castle from t)) $$,
  '42501', null, 'explorers cannot insert stamps directly');

-- Unpinned landmark: stamp from anywhere
select is((public.stamp_landmark((select castle from t)))->>'ok', 'true', 'stamp an unpinned landmark');
select is((public.stamp_landmark((select castle from t)))->>'already', 'true', 'second stamp is a no-op');

-- Pinned landmark: needs to be close
set local role postgres;
update public.landmarks set lat = 33.8116, lng = -117.9175, radius_m = 60 where id = (select monorail from t);
select pg_temp.act_as('a3000000-0000-0000-0000-000000000001');
select is((public.stamp_landmark((select monorail from t)))->>'reason', 'location_required', 'pinned landmark needs a location');
select is((public.stamp_landmark((select monorail from t), 33.8100, -117.9190))->>'reason', 'too_far', 'far away is refused');
select is((public.stamp_landmark((select monorail from t), 33.81162, -117.91752))->>'ok', 'true', 'close by is stamped');
select is((select count(*) from public.lens_stamps where user_id = 'a3000000-0000-0000-0000-000000000001'), 2::bigint, 'ann has two stamps');

-- Visibility: friends yes, strangers no
select pg_temp.act_as('b3000000-0000-0000-0000-000000000002');
select is((select count(*) from public.lens_stamps where user_id = 'a3000000-0000-0000-0000-000000000001'), 2::bigint, 'friends see your stamps');
select pg_temp.act_as('c3000000-0000-0000-0000-000000000003');
select is((select count(*) from public.lens_stamps), 0::bigint, 'strangers do not see your stamps');

-- Field tools and content editing
select throws_ok($$ select public.admin_update_landmark((select castle from t), 33.81, -117.92) $$, '42501', null, 'explorers cannot pin landmarks');
select throws_ok($$ select public.admin_update_landmark_content((select castle from t), '{"story": "x"}') $$, '42501', null, 'explorers cannot edit landmarks');
select pg_temp.act_as('e3000000-0000-0000-0000-000000000005');
select throws_ok($$ select public.admin_update_landmark((select castle from t), null, null, 'spots/x.jpg') $$, '22023', null, 'landmark photos must live under landmarks/');
select lives_ok($$ select public.admin_update_landmark((select castle from t), 33.8128, -117.919, 'landmarks/castle.jpg', true) $$, 'admin pins and verifies a landmark');
select lives_ok($$ select public.admin_update_landmark_content((select castle from t), '{"teaser": "  New teaser.  ", "engineering": "Gears and stone."}') $$, 'admin edits landmark text');
set local role postgres;
select is((select count(*) from private.content_edits where target = 'landmark' and target_id = (select castle from t)), 1::bigint, 'landmark edit is logged');

select * from finish();
rollback;
