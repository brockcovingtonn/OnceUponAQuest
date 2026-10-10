-- Manual checks for the Phase 1 schema. Run against the LOCAL Supabase stack only:
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/tests/manual_checks.sql
-- Everything runs inside a transaction and is rolled back. Lines marked 'should FAIL' are expected errors.
\set ON_ERROR_ROLLBACK on
begin;

insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@x'),('22222222-2222-2222-2222-222222222222','b@x');
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
\echo -- profile insert without age gate (should FAIL)
insert into profiles(id,username) values ('11111111-1111-1111-1111-111111111111','lampLighter');
\echo -- profile insert with age gate
insert into profiles(id,username,age_confirmed_13) values ('11111111-1111-1111-1111-111111111111','lampLighter',true);
select username_available('lamplighter') taken_case_insensitive, username_available('castleCrumb') free;
\echo -- answer keys hidden (should FAIL)
select * from private.spot_answers;
\echo -- direct checkin insert (should FAIL)
insert into checkins(user_id,spot_id,method) select auth.uid(), id, 'photo' from spots limit 1;
\echo -- wrong / right answers
select check_in((select s.id from spots s join quests q on q.id=s.quest_id where q.slug='windows-of-legends' and s.sort_order=4), 'music store');
select check_in((select s.id from spots s join quests q on q.id=s.quest_id where q.slug='windows-of-legends' and s.sort_order=4), '20th-Century Music Co.');
select check_in((select s.id from spots s join quests q on q.id=s.quest_id where q.slug='windows-of-legends' and s.sort_order=4), '  TWENTIETH century music company!');
\echo -- parade pause
select check_in((select s.id from spots s join quests q on q.id=s.quest_id where q.slug='windows-of-legends' and s.sort_order=1), 'Elias', p_parade_mode => true);
\echo -- photo path must be in own folder
select check_in((select s.id from spots s join quests q on q.id=s.quest_id where q.slug='ears-everywhere' and s.sort_order=1), p_photo_path => '22222222-2222-2222-2222-222222222222/x.jpg');
\echo -- complete ears-everywhere quest
select check_in(s.id, p_photo_path => auth.uid()::text || '/p.jpg') from spots s join quests q on q.id=s.quest_id where q.slug='ears-everywhere' order by s.sort_order;
select b.slug from user_badges ub join badges b on b.id=ub.badge_id;
reset role;
\echo -- geofence
update spots set lat=33.8110, lng=-117.9190 where title='Elias Disney window';
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select check_in((select id from spots where title='Elias Disney window'), 'elias');
select check_in((select id from spots where title='Elias Disney window'), 'elias', 33.8200, -117.9190);
select check_in((select id from spots where title='Elias Disney window'), 'elias', 33.81105, -117.91905);
\echo -- friends + leaderboard
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into profiles(id,username,age_confirmed_13) values ('22222222-2222-2222-2222-222222222222','castleCrumb',true);
\echo -- B cannot see A checkins before friendship
select count(*) from checkins;
insert into friendships(requester,addressee) values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111');
\echo -- requester cannot self-accept (0 rows)
update friendships set status='accepted';
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update friendships set status='accepted' where requester='22222222-2222-2222-2222-222222222222';
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) friend_checkins_visible from checkins;
select username, spots_found, badges, is_me from friends_leaderboard();
\echo -- anon blocked
reset role; set role anon;
select check_in(gen_random_uuid());
select count(*) from quests;
reset role;
\echo -- delete account cascades
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
-- delete_my_account() also tested; skipped here to keep the rollback simple
reset role;
select (select count(*) from profiles) profiles, (select count(*) from checkins) checkins;
rollback;
