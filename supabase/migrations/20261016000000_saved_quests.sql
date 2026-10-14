-- "Save for my next visit": quests an explorer pins to the top of the Quests
-- screen. Private to each explorer (friends can't see them).

create table public.saved_quests (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, quest_id)
);
alter table public.saved_quests enable row level security;

create policy saved_quests_read_own on public.saved_quests for select to authenticated
  using (user_id = auth.uid());
create policy saved_quests_insert_own on public.saved_quests for insert to authenticated
  with check (user_id = auth.uid());
create policy saved_quests_delete_own on public.saved_quests for delete to authenticated
  using (user_id = auth.uid());
