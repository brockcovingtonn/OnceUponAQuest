-- The animated-style avatar adds an eye color (optional; older avatars default to brown).
create or replace function private.guard_profile_avatar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  a jsonb := new.avatar;
  v_slot text;
  v_item text;
begin
  if a is null then
    return new;
  end if;
  if jsonb_typeof(a) <> 'object'
     or exists (select 1 from jsonb_object_keys(a) k
                where k not in ('v', 'skin', 'hair', 'hairColor', 'eyes', 'eyeColor', 'freckles', 'hat', 'outfit', 'back', 'held'))
     or (a ->> 'v') is distinct from '1'
     or (a ->> 'skin') not in ('s1', 's2', 's3', 's4', 's5', 's6')
     or (a ->> 'hair') not in ('crop', 'swoop', 'bob', 'long', 'curls', 'ponytail', 'braids', 'shaved')
     or (a ->> 'hairColor') not in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7')
     or (a ->> 'eyes') not in ('dot', 'happy', 'sparkle')
     or (a ? 'eyeColor' and (a ->> 'eyeColor') not in ('e1', 'e2', 'e3', 'e4', 'e5'))
     or jsonb_typeof(a -> 'freckles') <> 'boolean'
     or (a ->> 'outfit') is null then
    raise exception 'invalid avatar' using errcode = '22023';
  end if;
  foreach v_slot in array array['hat', 'outfit', 'back', 'held'] loop
    v_item := a ->> v_slot;
    continue when v_item is null;
    if not exists (
      select 1 from public.avatar_items i
      where i.id = v_item and i.slot::text = v_slot and i.is_active
        and (i.is_starter or exists (select 1 from public.avatar_owned o where o.user_id = new.id and o.item_id = i.id))
    ) then
      raise exception 'item not owned: %', v_item using errcode = '42501';
    end if;
  end loop;
  return new;
end $$;
