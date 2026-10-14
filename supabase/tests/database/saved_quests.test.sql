-- Saved quests: private to each explorer.
--   supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local role postgres;

select plan(7);

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users (id, email) values
  ('a4000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('b4000000-0000-0000-0000-000000000002', 'bo@example.com');
insert into public.profiles (id, username, age_confirmed_13) values
  ('a4000000-0000-0000-0000-000000000001', 'annie', true),
  ('b4000000-0000-0000-0000-000000000002', 'bobby', true);
-- Friends still can't see each other's saved quests.
insert into public.friendships (requester, addressee, status) values
  ('a4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000002', 'accepted');

create temp table t as select (select id from public.quests where slug = 'jungle-expedition') as quest;
grant select on t to authenticated;

select pg_temp.act_as('a4000000-0000-0000-0000-000000000001');
select lives_ok($$ insert into public.saved_quests (quest_id) values ((select quest from t)) $$, 'explorer saves a quest');
select is((select count(*) from public.saved_quests), 1::bigint, 'explorer sees their saved quest');
select throws_ok(
  $$ insert into public.saved_quests (user_id, quest_id) values ('b4000000-0000-0000-0000-000000000002', (select quest from t)) $$,
  '42501', null, 'cannot save for someone else');

select pg_temp.act_as('b4000000-0000-0000-0000-000000000002');
select is((select count(*) from public.saved_quests), 0::bigint, 'friends cannot see saved quests');
select lives_ok($$ delete from public.saved_quests $$, 'a delete by someone else runs');

select pg_temp.act_as('a4000000-0000-0000-0000-000000000001');
select is((select count(*) from public.saved_quests), 1::bigint, 'nobody else can remove your saved quest');
delete from public.saved_quests where quest_id = (select quest from t);
select is((select count(*) from public.saved_quests), 0::bigint, 'explorer removes their saved quest');

select * from finish();
rollback;
