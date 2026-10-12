-- Moderation (App Store Guideline 1.2 for user-generated content):
-- block users, report users, an admin review queue, suspensions, and a
-- filter for usernames / display names.

-- ---------------------------------------------------------------------------
-- Name filter: words that may not appear in usernames or display names.
-- Seeded with impersonation terms; admins add more in SQL:
--   insert into private.banned_name_words (word) values ('...');
-- ---------------------------------------------------------------------------
create table private.banned_name_words (
  word text primary key check (word = lower(word) and char_length(word) >= 3)
);
insert into private.banned_name_words (word) values
  ('disney'), ('official'), ('moderator'), ('castmember'), ('onceuponaquest');
revoke all on private.banned_name_words from public, anon, authenticated;

create or replace function private.name_allowed(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_name is null or not exists (
    select 1 from private.banned_name_words b
    where position(b.word in regexp_replace(lower(p_name), '[^a-z0-9]', '', 'g')) > 0
  )
$$;
revoke all on function private.name_allowed(text) from public;
grant execute on function private.name_allowed(text) to authenticated;

create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[A-Za-z0-9_]{3,24}$'
     and private.name_allowed(p_username)
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username))
$$;

-- ---------------------------------------------------------------------------
-- Suspensions: a suspended profile is hidden from everyone but its owner
-- and admins, and can't send friend requests.
-- ---------------------------------------------------------------------------
alter table public.profiles add column suspended_at timestamptz;

create or replace function private.is_suspended(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = p_user and suspended_at is not null)
$$;
revoke all on function private.is_suspended(uuid) from public;
grant execute on function private.is_suspended(uuid) to authenticated;

drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (suspended_at is null or id = auth.uid() or private.is_admin());

-- Users can't lift their own suspension or pick a banned name. These run as the
-- caller (not security definer) so current_user tells API users from admin RPCs.
create or replace function private.guard_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.suspended_at is distinct from old.suspended_at and not private.is_admin()
     and current_user = 'authenticated' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (new.username is distinct from old.username or new.display_name is distinct from old.display_name)
     and current_user = 'authenticated'
     and not (private.name_allowed(new.username) and private.name_allowed(new.display_name)) then
    raise exception 'name not allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_update before update on public.profiles
  for each row execute function private.guard_profile_update();

create or replace function private.guard_profile_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.suspended_at is not null and current_user = 'authenticated' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not (private.name_allowed(new.username) and private.name_allowed(new.display_name)) then
    raise exception 'name not allowed' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_insert before insert on public.profiles
  for each row execute function private.guard_profile_insert();

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------
create table public.user_blocks (
  blocker    uuid not null references public.profiles (id) on delete cascade,
  blocked    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
alter table public.user_blocks enable row level security;
create policy user_blocks_read_own on public.user_blocks for select to authenticated
  using (blocker = auth.uid());
create policy user_blocks_delete_own on public.user_blocks for delete to authenticated
  using (blocker = auth.uid());

create or replace function private.is_blocked_pair(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker = a and blocked = b) or (blocker = b and blocked = a)
  )
$$;
revoke all on function private.is_blocked_pair(uuid, uuid) from public;
grant execute on function private.is_blocked_pair(uuid, uuid) to authenticated;

-- Block someone: also ends any friendship or pending request between you.
create or replace function public.block_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot block yourself' using errcode = '22023';
  end if;
  insert into public.user_blocks (blocker, blocked) values (auth.uid(), p_user_id)
  on conflict do nothing;
  delete from public.friendships
  where (requester = auth.uid() and addressee = p_user_id)
     or (requester = p_user_id and addressee = auth.uid());
end;
$$;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

-- Friend requests: not between blocked pairs, and not from suspended accounts.
drop policy friendships_send on public.friendships;
create policy friendships_send on public.friendships for insert to authenticated
  with check (
    requester = auth.uid() and status = 'pending'
    and not private.is_blocked_pair(requester, addressee)
    and not private.is_suspended(requester)
    and not private.is_suspended(addressee)
  );

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create type public.user_report_reason as enum
  ('inappropriate_photo', 'offensive_name', 'harassment', 'spam', 'other');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.user_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reported    uuid not null references public.profiles (id) on delete cascade,
  reason      public.user_report_reason not null,
  note        text check (char_length(note) <= 500),
  status      public.report_status not null default 'open',
  action      text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  check (reporter <> reported)
);
create index user_reports_open_idx on public.user_reports (created_at) where status = 'open';
alter table public.user_reports enable row level security;
create policy user_reports_insert on public.user_reports for insert to authenticated
  with check (reporter = auth.uid() and status = 'open' and resolved_at is null and action is null);
create policy user_reports_admin_read on public.user_reports for select to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Admin actions on a report. Every action resolves all open reports about
-- that person. p_action: 'dismiss' | 'remove_photo' | 'reset_name' | 'suspend'.
-- Returns the removed avatar path (if any) so the app can delete the file.
-- ---------------------------------------------------------------------------
create or replace function public.admin_resolve_report(p_report_id uuid, p_action text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_reported uuid;
  v_avatar   text;
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  select reported into v_reported from public.user_reports where id = p_report_id;
  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  select avatar_url into v_avatar from public.profiles where id = v_reported;

  if p_action = 'dismiss' then
    update public.user_reports
    set status = 'dismissed', action = 'dismiss', resolved_at = now(), resolved_by = auth.uid()
    where id = p_report_id;
    return null;
  elsif p_action = 'remove_photo' then
    update public.profiles set avatar_url = null where id = v_reported;
  elsif p_action = 'reset_name' then
    update public.profiles
    set username = 'explorer_' || substr(replace(v_reported::text, '-', ''), 1, 8), display_name = null
    where id = v_reported;
  elsif p_action = 'suspend' then
    update public.profiles set suspended_at = now(), avatar_url = null where id = v_reported;
    delete from public.friendships where requester = v_reported or addressee = v_reported;
  else
    raise exception 'unknown action' using errcode = '22023';
  end if;

  update public.user_reports
  set status = 'actioned', action = p_action, resolved_at = now(), resolved_by = auth.uid()
  where reported = v_reported and status = 'open';
  return case when p_action in ('remove_photo', 'suspend') then v_avatar end;
end;
$$;
revoke all on function public.admin_resolve_report(uuid, text) from public, anon;
grant execute on function public.admin_resolve_report(uuid, text) to authenticated;

-- Admins may delete a removed profile photo from storage.
create policy avatars_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and private.is_admin());
