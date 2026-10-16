-- Quest Pass, outfit packs and Pass gifts.
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
create function pg_temp.event(p_id text, p_type text, p_product text, p_user text, p_extra jsonb default '{}')
returns text language sql as $$
  select public.apply_store_event(jsonb_build_object(
    'id', p_id, 'type', p_type, 'product_id', p_product, 'app_user_id', p_user,
    'purchased_at_ms', (extract(epoch from now()) * 1000)::bigint,
    'expiration_at_ms', (extract(epoch from now() + interval '30 days') * 1000)::bigint) || p_extra)
$$;
grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users (id, email) values
  ('a6000000-0000-0000-0000-000000000001', 'ann@example.com'),
  ('b6000000-0000-0000-0000-000000000002', 'bo@example.com');
insert into public.profiles (id, username, age_confirmed_13, avatar) values
  ('a6000000-0000-0000-0000-000000000001', 'annie', true,
   '{"v":1,"skin":"s2","hair":"bob","hairColor":"h3","eyes":"dot","freckles":false,"hat":null,"outfit":"explorer-tee","back":null,"held":null}'),
  ('b6000000-0000-0000-0000-000000000002', 'bobby', true, null);
-- A gift for whatever month the tests run in.
insert into public.avatar_items (id, slot, name, description, pass_month, sort_order)
values ('test-gift', 'held', 'Test gift', 'For tests.', to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM'), 999)
on conflict (id) do update set pass_month = excluded.pass_month;
update public.avatar_items set is_active = false where pass_month is not null and id <> 'test-gift';

create temp table t as select
  (select id from public.spots where quest_id = (select id from public.quests where slug = 'hollow-haunts') order by sort_order limit 1) as haunt_spot;
grant select on t to authenticated;

-- Without the Pass.
select pg_temp.act_as('a6000000-0000-0000-0000-000000000001');
select is((select count(*) from public.spots where quest_id = (select id from public.quests where slug = 'hollow-haunts')), 0::bigint,
  'premium spots are hidden without the Pass');
select is((select count(*) from public.quests where slug = 'hollow-haunts'), 1::bigint, 'the premium quest itself is listed');
select is(public.check_in((select haunt_spot from t), null, null, null, 'a6000000-0000-0000-0000-000000000001/x.jpg') ->> 'reason',
  'pass_required', 'premium check-ins need the Pass');
select is(public.claim_pass_gift() ->> 'status', 'no_pass', 'no gift without the Pass');
select throws_ok($$ select public.apply_store_event('{"id":"x","type":"TEST"}') $$, '42501', null,
  'the app cannot send store events');

-- Buying the Pass (webhook).
select pg_temp.as_postgres();
select is(pg_temp.event('e1', 'INITIAL_PURCHASE', 'oq_pass_monthly', 'a6000000-0000-0000-0000-000000000001'), 'pass granted', 'a subscription grants the Pass');
select is(pg_temp.event('e1', 'INITIAL_PURCHASE', 'oq_pass_monthly', 'a6000000-0000-0000-0000-000000000001'), 'ignored: already seen', 'repeated events are ignored');
select is(pg_temp.event('e2', 'INITIAL_PURCHASE', 'oq_pass_monthly', '$RCAnonymousID:abc'), 'ignored: unknown user', 'anonymous store ids are ignored');
select is(pg_temp.event('e3', 'INITIAL_PURCHASE', 'something_else', 'a6000000-0000-0000-0000-000000000001'), 'ignored: unknown product', 'unknown products are ignored');

select pg_temp.act_as('a6000000-0000-0000-0000-000000000001');
select is((select count(*) from public.spots where quest_id = (select id from public.quests where slug = 'hollow-haunts')), 4::bigint,
  'Pass holders see premium spots');
select is(public.check_in((select haunt_spot from t), null, null, null, 'a6000000-0000-0000-0000-000000000001/x.jpg') ->> 'ok',
  'true', 'Pass holders can check in on premium quests');
select is(public.claim_pass_gift() ->> 'status', 'ok', 'Pass holders claim the monthly gift');
select is(public.claim_pass_gift() ->> 'status', 'owned', 'the gift is claimed once');

-- Cancelling keeps the Pass until it runs out; a refund ends it now.
select pg_temp.as_postgres();
select is(pg_temp.event('e4', 'CANCELLATION', 'oq_pass_monthly', 'a6000000-0000-0000-0000-000000000001', '{"cancel_reason":"UNSUBSCRIBE"}'),
  'pass will not renew', 'cancelling stops renewal');
select ok(private.has_pass('a6000000-0000-0000-0000-000000000001'), 'a cancelled Pass lasts until it expires');
select is(pg_temp.event('e5', 'CANCELLATION', 'oq_pass_monthly', 'a6000000-0000-0000-0000-000000000001', '{"cancel_reason":"CUSTOMER_SUPPORT"}'),
  'pass refunded', 'a refund ends the Pass');
select ok(not private.has_pass('a6000000-0000-0000-0000-000000000001'), 'no Pass after a refund');

-- Trip Pass: 3 days.
select is(pg_temp.event('e6', 'NON_RENEWING_PURCHASE', 'oq_pass_trip_3day', 'b6000000-0000-0000-0000-000000000002'), 'trip pass granted', 'a Trip Pass grants the Pass');
select ok((select expires_at between now() + interval '71 hours' and now() + interval '73 hours' from public.entitlements
           where user_id = 'b6000000-0000-0000-0000-000000000002'), 'a Trip Pass lasts 3 days');

-- Outfit packs.
select is(pg_temp.event('e7', 'NON_RENEWING_PURCHASE', 'oq_pack_pirate_captain', 'a6000000-0000-0000-0000-000000000001'), 'pack granted', 'buying a pack');
select pg_temp.act_as('a6000000-0000-0000-0000-000000000001');
select is((select count(*) from public.avatar_owned where item_id in ('captains-greatcoat', 'plumed-hat', 'spyglass', 'crossed-swords-flag')), 4::bigint,
  'a pack gives all its items');
select is(public.buy_avatar_item('pom-beanie') ->> 'status', 'not_for_stars', 'pack items are not sold for stars');
update public.profiles set avatar = avatar || '{"hat":"plumed-hat","outfit":"captains-greatcoat"}' where id = auth.uid();
select pg_temp.as_postgres();
select pg_temp.event('e8', 'CANCELLATION', 'oq_pack_pirate_captain', 'a6000000-0000-0000-0000-000000000001', '{"cancel_reason":"CUSTOMER_SUPPORT"}');
select is((select avatar ->> 'hat' || '/' || (avatar ->> 'outfit') from public.profiles where id = 'a6000000-0000-0000-0000-000000000001'),
  null, 'a refunded pack comes off the explorer');
select is((select count(*) from public.avatar_owned where user_id = 'a6000000-0000-0000-0000-000000000001' and item_id = 'spyglass'), 0::bigint,
  'a refunded pack is taken back');

select * from finish();
rollback;
