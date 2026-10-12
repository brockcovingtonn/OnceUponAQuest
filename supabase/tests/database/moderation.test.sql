-- Moderation tests: name filter, blocks, reports, admin actions, suspensions.
--   supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local role postgres;

select plan(24);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('b0000000-0000-0000-0000-000000000002', 'bob@example.com'),
  ('c0000000-0000-0000-0000-000000000003', 'cat@example.com'),
  ('d0000000-0000-0000-0000-000000000004', 'dan@example.com'),
  ('e0000000-0000-0000-0000-000000000005', 'mod@example.com');
insert into public.profiles (id, username, age_confirmed_13, avatar_url) values
  ('a0000000-0000-0000-0000-000000000001', 'ann', true, null),
  ('b0000000-0000-0000-0000-000000000002', 'bob', true, null),
  ('c0000000-0000-0000-0000-000000000003', 'cat', true, 'c0000000-0000-0000-0000-000000000003/avatar.jpg'),
  ('d0000000-0000-0000-0000-000000000004', 'dan', true, null),
  ('e0000000-0000-0000-0000-000000000005', 'eve', true, null);
insert into private.admins (user_id) values ('e0000000-0000-0000-0000-000000000005');

-- ---------------------------------------------------------------------------
-- Name filter
-- ---------------------------------------------------------------------------
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001');
select is(public.username_available('DisneyFan'), false, 'banned word blocks a username');
select is(public.username_available('Dis_ney_Fan'), false, 'banned word is caught through underscores');
select is(public.username_available('lampLighter'), true, 'ordinary username is fine');
select throws_ok(
  $$ update public.profiles set display_name = 'Official Guide' where id = auth.uid() $$,
  '23514', null, 'banned word blocks a display name');
select lives_ok(
  $$ update public.profiles set display_name = 'Ann B' where id = auth.uid() $$,
  'ordinary display name is fine');
select throws_ok(
  $$ update public.profiles set suspended_at = now() where id = auth.uid() $$,
  '42501', null, 'users cannot change suspension status');

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------
select pg_temp.act_as('b0000000-0000-0000-0000-000000000002');
insert into public.friendships (requester, addressee) values
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001');
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001');
select lives_ok($$ select public.block_user('b0000000-0000-0000-0000-000000000002') $$, 'A blocks B');
select is((select count(*) from public.friendships), 0::bigint, 'blocking removes the pending request');
select throws_ok(
  $$ insert into public.friendships (requester, addressee) values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'blocker cannot send a request to the blocked person');
select pg_temp.act_as('b0000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ insert into public.friendships (requester, addressee) values ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'blocked person cannot send a request');
select is((select count(*) from public.user_blocks), 0::bigint, 'blocked person cannot see the block');
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.user_blocks), 1::bigint, 'blocker sees their block');
delete from public.user_blocks where blocked = 'b0000000-0000-0000-0000-000000000002';
select lives_ok(
  $$ insert into public.friendships (requester, addressee) values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002') $$,
  'after unblocking, requests work again');

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
select pg_temp.act_as('b0000000-0000-0000-0000-000000000002');
select lives_ok(
  $$ insert into public.user_reports (reported, reason, note) values ('c0000000-0000-0000-0000-000000000003', 'inappropriate_photo', 'not ok') $$,
  'B reports C');
select is((select count(*) from public.user_reports), 0::bigint, 'reporters cannot read reports');
select throws_ok(
  $$ insert into public.user_reports (reported, reason, status) values ('d0000000-0000-0000-0000-000000000004', 'spam', 'actioned') $$,
  '42501', null, 'cannot file an already-resolved report');
select throws_ok(
  $$ select public.admin_resolve_report((select id from public.user_reports limit 1), 'dismiss') $$,
  '42501', null, 'non-admin cannot resolve reports');
select lives_ok(
  $$ insert into public.user_reports (reported, reason) values ('d0000000-0000-0000-0000-000000000004', 'harassment') $$,
  'B reports D');

-- ---------------------------------------------------------------------------
-- Admin actions
-- ---------------------------------------------------------------------------
select pg_temp.act_as('e0000000-0000-0000-0000-000000000005');
select is((select count(*) from public.user_reports where status = 'open'), 2::bigint, 'admin sees open reports');
select is(
  public.admin_resolve_report((select id from public.user_reports where reported = 'c0000000-0000-0000-0000-000000000003'), 'remove_photo'),
  'c0000000-0000-0000-0000-000000000003/avatar.jpg', 'remove_photo returns the file to delete');
select is((select avatar_url from public.profiles where id = 'c0000000-0000-0000-0000-000000000003'), null, 'photo removed from the profile');

-- D is friends with A, then gets suspended
set local role postgres;
insert into public.friendships (requester, addressee, status) values
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'accepted');
select pg_temp.act_as('e0000000-0000-0000-0000-000000000005');
select public.admin_resolve_report((select id from public.user_reports where reported = 'd0000000-0000-0000-0000-000000000004'), 'suspend');
select pg_temp.act_as('a0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.profiles where id = 'd0000000-0000-0000-0000-000000000004'), 0::bigint, 'suspended profile is hidden from others');
select is(
  (select count(*) from public.friendships where 'd0000000-0000-0000-0000-000000000004' in (requester, addressee)),
  0::bigint, 'suspension ends friendships');
select pg_temp.act_as('d0000000-0000-0000-0000-000000000004');
select throws_ok(
  $$ insert into public.friendships (requester, addressee) values ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'suspended account cannot send requests');

select * from finish();
rollback;
