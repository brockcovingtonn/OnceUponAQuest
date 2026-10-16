-- Avatars, Wishing Stars and the wardrobe.
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
create function pg_temp.as_postgres() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
end $$;
create function pg_temp.balance() returns int language sql as $$
  select (public.my_wardrobe() ->> 'balance')::int
$$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users (id, email) values
  ('a5000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('b5000000-0000-0000-0000-000000000002', 'bo@example.com');
insert into public.profiles (id, username, age_confirmed_13, avatar) values
  ('a5000000-0000-0000-0000-000000000001', 'annie', true,
   '{"v":1,"skin":"s2","hair":"bob","hairColor":"h3","eyes":"dot","freckles":true,"hat":null,"outfit":"explorer-tee","back":"day-pack","held":null}'),
  ('b5000000-0000-0000-0000-000000000002', 'bobby', true, null);

create temp table t as select
  (select id from public.spots s where s.quest_id = (select id from public.quests where slug = 'windows-of-legends') order by sort_order limit 1) as ms_spot,
  (select id from public.spots s where s.quest_id = (select id from public.quests where slug = 'jungle-expedition') order by sort_order limit 1) as adv_spot,
  (select id from public.landmarks order by slug limit 1) as landmark;
grant select on t to authenticated;

select pg_temp.act_as('a5000000-0000-0000-0000-000000000001');
select is(pg_temp.balance(), 60, 'a new explorer gets 60 welcome stars');
select is(jsonb_array_length(public.my_wardrobe() -> 'items')::bigint,
  (select count(*) from public.avatar_items
   where is_active and (pass_month is null or pass_month = to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM'))),
  'the wardrobe lists every item (and only this month''s Pass gift)');
select ok((select bool_and((i ->> 'owned')::boolean) from jsonb_array_elements(public.my_wardrobe() -> 'items') i
           where (i ->> 'is_starter')::boolean), 'starter items are owned by everyone');

-- The avatar is checked.
select lives_ok(
  $$ update public.profiles set avatar = avatar || '{"hat":"explorer-cap","held":"folded-map"}' where id = auth.uid() $$,
  'explorer wears starter items');
select throws_ok(
  $$ update public.profiles set avatar = avatar || '{"hat":"straw-boater"}' where id = auth.uid() $$,
  '42501', null, 'cannot wear an item you do not own');
select throws_ok(
  $$ update public.profiles set avatar = avatar || '{"skin":"green"}' where id = auth.uid() $$,
  '22023', null, 'a bad look is rejected');
select lives_ok(
  $$ update public.profiles set avatar = avatar || '{"eyeColor":"e4"}' where id = auth.uid() $$,
  'explorer picks an eye color');
select throws_ok(
  $$ update public.profiles set avatar = avatar || '{"eyeColor":"e9"}' where id = auth.uid() $$,
  '22023', null, 'an unknown eye color is rejected');
select throws_ok(
  $$ update public.profiles set avatar = avatar || '{"outfit":"explorer-cap"}' where id = auth.uid() $$,
  '42501', null, 'an item only goes in its own slot');

-- Buying.
select is(public.buy_avatar_item('quartet-stripes') ->> 'status', 'short', 'not enough stars');
select is(public.buy_avatar_item('lamplighter-coat') ->> 'status', 'locked', 'land-locked item stays locked');
select is(public.buy_avatar_item('pocket-watch') ->> 'status', 'locked', 'quest-locked item stays locked');
select is(public.buy_avatar_item('straw-boater') ->> 'status', 'ok', 'buys an item');
select is(pg_temp.balance(), 0, 'the price comes off the balance');
select is(public.buy_avatar_item('straw-boater') ->> 'status', 'owned', 'cannot buy the same item twice');
select lives_ok(
  $$ update public.profiles set avatar = avatar || '{"hat":"straw-boater"}' where id = auth.uid() $$,
  'explorer wears what they bought');

-- Earning (progress rows are written by check_in / stamp_landmark; insert them directly here).
select pg_temp.as_postgres();
insert into public.checkins (user_id, spot_id, method) values
  ('a5000000-0000-0000-0000-000000000001', (select ms_spot from t), 'answer'),
  ('a5000000-0000-0000-0000-000000000001', (select adv_spot from t), 'answer');
insert into public.lens_stamps (user_id, landmark_id) values ('a5000000-0000-0000-0000-000000000001', (select landmark from t));
select pg_temp.act_as('a5000000-0000-0000-0000-000000000001');
select is(pg_temp.balance(), 10 + 5 + 10 + 15, 'spots, the Main Street dress-the-part bonus and a Lens stamp earn stars');

select pg_temp.as_postgres();
insert into public.user_badges (user_id, badge_id)
select 'a5000000-0000-0000-0000-000000000001', q.badge_id from public.quests q where q.land_id = 'dlp-main-street' and q.badge_id is not null and not q.is_premium;
select pg_temp.act_as('a5000000-0000-0000-0000-000000000001');
select is((select count(*) from public.star_ledger where reason = 'land'), 1::bigint, 'finishing a land earns the land bonus once');
select is(pg_temp.balance(), 40 + 4 * 50 + 200, 'badges and the land bonus add up');
select is(public.buy_avatar_item('lamplighter-coat') ->> 'status', 'ok', 'finishing the land unlocks its item');

-- Nobody can write stars or items themselves, or see someone else's.
select throws_ok(
  $$ insert into public.star_ledger (user_id, amount, reason, ref) values (auth.uid(), 1000, 'spot', 'x') $$,
  '42501', null, 'cannot award yourself stars');
select throws_ok(
  $$ insert into public.avatar_owned (user_id, item_id) values (auth.uid(), 'flying-carpet') $$,
  '42501', null, 'cannot give yourself items');
select pg_temp.act_as('b5000000-0000-0000-0000-000000000002');
select is((select count(*) from public.star_ledger), 1::bigint, 'you see only your own stars');
select is((select count(*) from public.avatar_owned), 0::bigint, 'you see only your own wardrobe');

select * from finish();
rollback;
