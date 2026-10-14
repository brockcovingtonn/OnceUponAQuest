-- Admin content editing: spot text, accepted answers, quest text, edit log.
--   supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local role postgres;

select plan(14);

-- Test the rules, not live pins: clear any field-walk pins inside this rolled-back transaction.
update public.spots set lat = null, lng = null where lat is not null;

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
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users (id, email) values
  ('a2000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('e2000000-0000-0000-0000-000000000005', 'eve@example.com');
insert into public.profiles (id, username, age_confirmed_13) values
  ('a2000000-0000-0000-0000-000000000001', 'ann', true),
  ('e2000000-0000-0000-0000-000000000005', 'eve', true);
insert into private.admins (user_id) values ('e2000000-0000-0000-0000-000000000005');

create temp table t as select pg_temp.spot('windows-of-legends', 1) as elias, pg_temp.spot('ears-everywhere', 1) as photo_spot,
  (select id from public.quests where slug = 'walt-was-here') as quest;
grant select on t to authenticated;

-- Explorers can't edit or read answers
select pg_temp.act_as('a2000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.admin_get_spot_answers((select elias from t)) $$, '42501', null, 'explorers cannot read answers');
select throws_ok($$ select public.admin_update_spot_content((select elias from t), '{"clue": "x"}') $$, '42501', null, 'explorers cannot edit spots');
select throws_ok($$ select public.admin_update_quest_content((select quest from t), 'X', null) $$, '42501', null, 'explorers cannot edit quests');

-- Admin edits
select pg_temp.act_as('e2000000-0000-0000-0000-000000000005');
select is(public.admin_get_spot_answers((select elias from t)), array['Elias', 'Elias Disney'], 'admin reads accepted answers');
select lives_ok(
  $$ select public.admin_update_spot_content((select elias from t),
       '{"clue": "  A new clue.  ", "hint": "", "teaser": "", "radius_m": 60, "pause_during_parades": false,
         "accepted_answers": ["Elias", " E. Disney ", ""]}') $$,
  'admin updates spot text and answers');
select is((select clue from public.spots where id = (select elias from t)), 'A new clue.', 'text is trimmed');
select is((select hint from public.spots where id = (select elias from t)), null, 'blank hint clears it');
select isnt((select teaser from public.spots where id = (select elias from t)), '', 'blank required field is ignored');
select is((select radius_m from public.spots where id = (select elias from t)), 60, 'radius updated');
select is(public.admin_get_spot_answers((select elias from t)), array['Elias', 'E. Disney'], 'answers trimmed, blanks dropped');
select throws_ok(
  $$ select public.admin_update_spot_content((select elias from t), '{"accepted_answers": []}') $$,
  '22023', null, 'answer spots need at least one answer');
select throws_ok(
  $$ select public.admin_update_spot_content((select elias from t), '{"radius_m": 5}') $$,
  '23514', null, 'radius must stay within 10–200 m');

-- New answer works for check-in right away
select pg_temp.act_as('a2000000-0000-0000-0000-000000000001');
select is(public.check_in((select elias from t), 'e disney') ->> 'ok', 'true', 'check_in accepts the newly added answer');

set local role postgres;
select is((select count(*) from private.content_edits where target_id = (select elias from t)), 1::bigint, 'the edit is logged with before/after');

select * from finish();
rollback;
