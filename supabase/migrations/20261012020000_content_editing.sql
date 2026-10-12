-- Edit quest content from the app (admins only): spot text, accepted answers,
-- parade flag, check-in radius, and quest title/story. Every edit is logged
-- with before/after values so mistakes can be undone.

create table private.content_edits (
  id         bigserial primary key,
  editor     uuid references auth.users (id) on delete set null,
  target     text not null check (target in ('spot', 'quest')),
  target_id  uuid not null,
  before     jsonb not null,
  after      jsonb not null,
  created_at timestamptz not null default now()
);
revoke all on private.content_edits from public, anon, authenticated;

-- Accepted answers for one spot, for the admin edit form only.
create or replace function public.admin_get_spot_answers(p_spot_id uuid)
returns text[] language plpgsql stable security definer set search_path = '' as $$
declare
  v_answers text[];
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  select accepted into v_answers from private.spot_answers where spot_id = p_spot_id;
  return coalesce(v_answers, '{}');
end;
$$;
revoke all on function public.admin_get_spot_answers(uuid) from public, anon;
grant execute on function public.admin_get_spot_answers(uuid) to authenticated;

-- p_changes keys (all optional): teaser, title, where_to_stand, clue, prompt
-- (required text — blank values are ignored), hint, holiday_note (blank
-- clears), pause_during_parades (boolean), radius_m (10–200),
-- accepted_answers (array of strings; required non-empty for answer spots).
create or replace function public.admin_update_spot_content(p_spot_id uuid, p_changes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_before  jsonb;
  v_after   jsonb;
  v_method  public.checkin_method;
  v_answers text[];
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;

  select to_jsonb(s) - 'source_url' || jsonb_build_object(
           'accepted_answers', (select accepted from private.spot_answers where spot_id = s.id)),
         s.method
  into v_before, v_method
  from public.spots s where s.id = p_spot_id;
  if v_before is null then
    raise exception 'spot not found' using errcode = 'P0002';
  end if;

  update public.spots set
    teaser         = coalesce(nullif(btrim(p_changes->>'teaser'), ''), teaser),
    title          = coalesce(nullif(btrim(p_changes->>'title'), ''), title),
    where_to_stand = coalesce(nullif(btrim(p_changes->>'where_to_stand'), ''), where_to_stand),
    clue           = coalesce(nullif(btrim(p_changes->>'clue'), ''), clue),
    prompt         = coalesce(nullif(btrim(p_changes->>'prompt'), ''), prompt),
    hint           = case when p_changes ? 'hint' then nullif(btrim(p_changes->>'hint'), '') else hint end,
    holiday_note   = case when p_changes ? 'holiday_note' then nullif(btrim(p_changes->>'holiday_note'), '') else holiday_note end,
    pause_during_parades = coalesce((p_changes->>'pause_during_parades')::boolean, pause_during_parades),
    radius_m       = coalesce((p_changes->>'radius_m')::int, radius_m)
  where id = p_spot_id;

  if p_changes ? 'accepted_answers' then
    select coalesce(array_agg(btrim(a)) filter (where btrim(a) <> ''), '{}')
    into v_answers
    from jsonb_array_elements_text(p_changes->'accepted_answers') a;
    if cardinality(v_answers) = 0 then
      if v_method = 'answer' then
        raise exception 'an answer spot needs at least one accepted answer' using errcode = '22023';
      end if;
      delete from private.spot_answers where spot_id = p_spot_id;
    else
      insert into private.spot_answers (spot_id, accepted) values (p_spot_id, v_answers)
      on conflict (spot_id) do update set accepted = excluded.accepted;
    end if;
  end if;

  select to_jsonb(s) - 'source_url' || jsonb_build_object(
           'accepted_answers', (select accepted from private.spot_answers where spot_id = s.id))
  into v_after
  from public.spots s where s.id = p_spot_id;

  insert into private.content_edits (editor, target, target_id, before, after)
  values (auth.uid(), 'spot', p_spot_id, v_before, v_after);
end;
$$;
revoke all on function public.admin_update_spot_content(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_spot_content(uuid, jsonb) to authenticated;

create or replace function public.admin_update_quest_content(p_quest_id uuid, p_title text, p_story text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb;
  v_after  jsonb;
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  select to_jsonb(q) into v_before from public.quests q where q.id = p_quest_id;
  if v_before is null then
    raise exception 'quest not found' using errcode = 'P0002';
  end if;
  update public.quests set
    title = coalesce(nullif(btrim(p_title), ''), title),
    story = case when p_story is null then story else nullif(btrim(p_story), '') end
  where id = p_quest_id;
  select to_jsonb(q) into v_after from public.quests q where q.id = p_quest_id;
  insert into private.content_edits (editor, target, target_id, before, after)
  values (auth.uid(), 'quest', p_quest_id, v_before, v_after);
end;
$$;
revoke all on function public.admin_update_quest_content(uuid, text, text) from public, anon;
grant execute on function public.admin_update_quest_content(uuid, text, text) to authenticated;
