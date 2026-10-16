-- California Adventure content: the second park's quests and answers.
--   supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local role postgres;

select plan(5);

select is((select count(*) from public.lands where park_id = 'california-adventure'), 8::bigint, 'eight California Adventure lands');
select is((select count(*) from public.quests q join public.lands l on l.id = q.land_id
           where l.park_id = 'california-adventure' and not q.is_premium and q.status = 'live'), 16::bigint, 'two free quests per land');
select is((select count(*) from public.quests q join public.lands l on l.id = q.land_id
           where l.park_id = 'california-adventure' and q.is_premium), 2::bigint, 'two Quest Pass quests');
select is((select count(*) from public.spots s
           where s.method = 'answer' and not exists (select 1 from private.spot_answers a where a.spot_id = s.id)), 0::bigint,
  'every typed-answer spot in both parks has answers');
select is((select count(*) from public.quests where badge_id is null and status = 'live'), 0::bigint, 'every live quest has a badge');

select * from finish();
rollback;
