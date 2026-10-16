-- Quest Pass and outfit packs: paid digital extras, bought through the App
-- Store / Google Play (via RevenueCat). Our server is the source of truth:
-- RevenueCat's webhook calls apply_store_event(), which grants the Pass or a
-- pack. Wishing Stars stay earned-only and are never sold.
--
-- What the Pass unlocks: premium quests (quests.is_premium), a free outfit
-- each month, and a Pass badge. All free quests stay free, and premium quests
-- never count toward finishing a land, so free players can still earn every
-- land bonus and land-locked item.

-- ---------------------------------------------------------------------------
-- Entitlements and store bookkeeping
-- ---------------------------------------------------------------------------
create table public.entitlements (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('quest_pass')),
  product_id  text not null,
  expires_at  timestamptz not null,
  will_renew  boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.entitlements enable row level security;
create policy entitlements_read on public.entitlements for select to authenticated using (user_id = auth.uid());

-- Store products we sell. Google subscriptions arrive as "subscription:base-plan".
create table private.store_products (
  product_id text primary key,
  kind       text not null check (kind in ('pass_subscription', 'pass_trip', 'pack')),
  trip_days  int,
  pack_id    text
);

-- Every webhook event we've seen, so repeats are ignored.
create table private.store_events (
  id          text primary key,
  user_id     uuid,
  type        text not null,
  product_id  text,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);

create or replace function private.has_pass(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.entitlements
    where user_id = p_user and kind = 'quest_pass' and expires_at > now()
  )
$$;
revoke all on function private.has_pass(uuid) from public, anon, authenticated;

-- For row policies: does the signed-in explorer have the Pass?
create or replace function private.i_have_pass()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_pass(auth.uid())
$$;
revoke all on function private.i_have_pass() from public, anon;
grant execute on function private.i_have_pass() to authenticated;

-- ---------------------------------------------------------------------------
-- Outfit packs and the monthly Pass gift
-- ---------------------------------------------------------------------------
create table public.outfit_packs (
  id          text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  product_id  text not null unique,
  name        text not null,
  description text not null,
  story       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true
);
alter table public.outfit_packs enable row level security;
create policy outfit_packs_read on public.outfit_packs for select to authenticated using (is_active);

create table public.pack_owned (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  pack_id      text not null references public.outfit_packs (id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, pack_id)
);
alter table public.pack_owned enable row level security;
create policy pack_owned_read on public.pack_owned for select to authenticated using (user_id = auth.uid());

alter table public.avatar_items
  add column pack_id text references public.outfit_packs (id),
  -- 'YYYY-MM': Pass holders can claim it free that month and keep it forever.
  add column pass_month text check (pass_month ~ '^\d{4}-\d{2}$');

-- ---------------------------------------------------------------------------
-- Premium quests: spots are visible to Pass holders (and admins) only, and
-- never count toward finishing a land.
-- ---------------------------------------------------------------------------
drop policy spots_read on public.spots;
create policy spots_read on public.spots for select to authenticated
  using (exists (
    select 1 from public.quests q
    where q.id = quest_id and q.status = 'live'
      and (not q.is_premium or private.i_have_pass() or private.is_admin())
  ));

create or replace function private.land_complete(p_user uuid, p_land text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.quests q
           where q.land_id = p_land and q.status = 'live' and not q.is_premium and q.badge_id is not null)
     and not exists (
           select 1 from public.quests q
           where q.land_id = p_land and q.status = 'live' and not q.is_premium and q.badge_id is not null
             and not exists (select 1 from public.user_badges ub where ub.user_id = p_user and ub.badge_id = q.badge_id))
$$;

-- check_in: same as before, plus premium quests need the Pass.
create or replace function public.check_in(
  p_spot_id     uuid,
  p_answer      text default null,
  p_lat         double precision default null,
  p_lng         double precision default null,
  p_photo_path  text default null,
  p_parade_mode boolean default false,
  p_found_at    timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_spot      public.spots%rowtype;
  v_quest     public.quests%rowtype;
  v_dist      double precision;
  v_total     int;
  v_found     int;
  v_badge     text;
  v_found_at  timestamptz := least(now(), greatest(coalesce(p_found_at, now()), now() - interval '7 days'));
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select s.* into v_spot
  from public.spots s join public.quests q on q.id = s.quest_id
  where s.id = p_spot_id and q.status = 'live';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  select * into v_quest from public.quests where id = v_spot.quest_id;

  if exists (select 1 from public.checkins c where c.user_id = v_uid and c.spot_id = p_spot_id) then
    return jsonb_build_object('ok', true, 'already', true, 'quest_complete', false);
  end if;

  if v_quest.is_premium and not private.has_pass(v_uid) then
    return jsonb_build_object('ok', false, 'reason', 'pass_required');
  end if;

  if p_parade_mode and v_spot.pause_during_parades then
    return jsonb_build_object('ok', false, 'reason', 'paused');
  end if;

  if v_spot.lat is not null then
    if p_lat is null or p_lng is null then
      return jsonb_build_object('ok', false, 'reason', 'location_required');
    end if;
    v_dist := private.distance_m(v_spot.lat, v_spot.lng, p_lat, p_lng);
    if v_dist > v_spot.radius_m + 25 then
      return jsonb_build_object('ok', false, 'reason', 'too_far', 'distance_m', round(v_dist));
    end if;
  end if;

  if v_spot.method = 'answer' then
    if not exists (
      select 1 from private.spot_answers a, unnest(a.accepted) acc
      where a.spot_id = p_spot_id
        and private.normalize_answer(acc) = private.normalize_answer(p_answer)
        and private.normalize_answer(p_answer) <> ''
    ) then
      return jsonb_build_object('ok', false, 'reason', 'wrong_answer');
    end if;
  elsif v_spot.method = 'photo' then
    if p_photo_path is null
       or split_part(p_photo_path, '/', 1) <> v_uid::text then
      return jsonb_build_object('ok', false, 'reason', 'photo_required');
    end if;
  end if;

  insert into public.checkins (user_id, spot_id, method, photo_path, created_at)
  values (v_uid, p_spot_id, v_spot.method, p_photo_path, v_found_at)
  on conflict (user_id, spot_id) do nothing;

  select count(*) into v_total from public.spots where quest_id = v_quest.id;
  select count(*) into v_found
  from public.checkins c join public.spots s on s.id = c.spot_id
  where c.user_id = v_uid and s.quest_id = v_quest.id;

  if v_found >= v_total and v_quest.badge_id is not null then
    insert into public.user_badges (user_id, badge_id, earned_at)
    values (v_uid, v_quest.badge_id, v_found_at)
    on conflict do nothing;
    select slug into v_badge from public.badges where id = v_quest.badge_id;
    return jsonb_build_object('ok', true, 'quest_complete', true, 'badge_slug', v_badge);
  end if;

  return jsonb_build_object('ok', true, 'quest_complete', false,
                            'found', v_found, 'total', v_total);
end;
$$;

-- ---------------------------------------------------------------------------
-- Wardrobe RPCs: packs and Pass gifts aren't sold for stars.
-- ---------------------------------------------------------------------------
create or replace function public.my_wardrobe()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'balance', private.star_balance(auth.uid()),
    'has_pass', private.has_pass(auth.uid()),
    'gift_month', to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM'),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i.id,
               'slot', i.slot,
               'name', i.name,
               'description', i.description,
               'story', i.story,
               'land_id', i.land_id,
               'price', i.price,
               'is_starter', i.is_starter,
               'unlock_land_id', i.unlock_land_id,
               'unlock_quest_id', i.unlock_quest_id,
               'pack_id', i.pack_id,
               'pass_month', i.pass_month,
               'owned', i.is_starter or exists (select 1 from public.avatar_owned o where o.user_id = auth.uid() and o.item_id = i.id),
               'unlocked', (i.unlock_land_id is null or private.land_complete(auth.uid(), i.unlock_land_id))
                       and (i.unlock_quest_id is null or exists (
                              select 1 from public.quests q join public.user_badges ub on ub.badge_id = q.badge_id
                              where q.id = i.unlock_quest_id and ub.user_id = auth.uid()))
             ) order by i.sort_order, i.id)
      from public.avatar_items i
      -- Past Pass gifts you didn't claim, and future ones, stay hidden.
      where i.is_active
        and (i.pass_month is null
             or i.pass_month = to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM')
             or exists (select 1 from public.avatar_owned o where o.user_id = auth.uid() and o.item_id = i.id))), '[]'::jsonb),
    'packs', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id,
               'product_id', p.product_id,
               'name', p.name,
               'description', p.description,
               'story', p.story,
               'owned', exists (select 1 from public.pack_owned po where po.user_id = auth.uid() and po.pack_id = p.id)
             ) order by p.sort_order, p.id)
      from public.outfit_packs p where p.is_active), '[]'::jsonb)
  )
$$;

create or replace function public.buy_avatar_item(p_item text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_item public.avatar_items%rowtype;
  v_balance int;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  perform 1 from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'no profile' using errcode = '42501';
  end if;
  v_balance := private.star_balance(v_uid);

  select * into v_item from public.avatar_items where id = p_item and is_active;
  if not found then
    return jsonb_build_object('status', 'not_found', 'balance', v_balance);
  end if;
  if v_item.is_starter or exists (select 1 from public.avatar_owned where user_id = v_uid and item_id = p_item) then
    return jsonb_build_object('status', 'owned', 'balance', v_balance);
  end if;
  -- Pack items come with their pack; Pass gifts are claimed, never bought with stars.
  if v_item.pack_id is not null or v_item.pass_month is not null then
    return jsonb_build_object('status', 'not_for_stars', 'balance', v_balance);
  end if;
  if (v_item.unlock_land_id is not null and not private.land_complete(v_uid, v_item.unlock_land_id))
     or (v_item.unlock_quest_id is not null and not exists (
           select 1 from public.quests q join public.user_badges ub on ub.badge_id = q.badge_id
           where q.id = v_item.unlock_quest_id and ub.user_id = v_uid)) then
    return jsonb_build_object('status', 'locked', 'balance', v_balance);
  end if;
  if v_balance < v_item.price then
    return jsonb_build_object('status', 'short', 'balance', v_balance);
  end if;

  insert into public.avatar_owned (user_id, item_id, price_paid) values (v_uid, p_item, v_item.price);
  if v_item.price > 0 then
    insert into public.star_ledger (user_id, amount, reason, ref) values (v_uid, -v_item.price, 'purchase', p_item);
  end if;
  return jsonb_build_object('status', 'ok', 'balance', v_balance - v_item.price);
end $$;

-- Pass holders claim this month's gift (kept forever). Returns {status}:
-- 'ok', 'owned', 'no_pass' or 'none' (no gift this month).
create or replace function public.claim_pass_gift()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_month text := to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM');
  v_count int;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not private.has_pass(v_uid) then
    return jsonb_build_object('status', 'no_pass');
  end if;
  if not exists (select 1 from public.avatar_items where pass_month = v_month and is_active) then
    return jsonb_build_object('status', 'none');
  end if;
  insert into public.avatar_owned (user_id, item_id, price_paid)
  select v_uid, id, 0 from public.avatar_items where pass_month = v_month and is_active
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return jsonb_build_object('status', case when v_count > 0 then 'ok' else 'owned' end);
end $$;
revoke all on function public.claim_pass_gift() from public, anon;
grant execute on function public.claim_pass_gift() to authenticated;

-- ---------------------------------------------------------------------------
-- Store events (called by the revenuecat-webhook Edge Function only)
-- ---------------------------------------------------------------------------

-- Takes a pack back after a refund: removes its items and takes them off.
create or replace function private.revoke_pack(p_user uuid, p_pack text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_items text[] := array(select id from public.avatar_items where pack_id = p_pack);
begin
  -- Take the pack's items off first (all at once, so the avatar stays valid).
  update public.profiles p set avatar = p.avatar
    || jsonb_build_object('hat', case when p.avatar ->> 'hat' = any (v_items) then null else p.avatar -> 'hat' end)
    || jsonb_build_object('back', case when p.avatar ->> 'back' = any (v_items) then null else p.avatar -> 'back' end)
    || jsonb_build_object('held', case when p.avatar ->> 'held' = any (v_items) then null else p.avatar -> 'held' end)
    || jsonb_build_object('outfit', case when p.avatar ->> 'outfit' = any (v_items) then to_jsonb('explorer-tee'::text) else p.avatar -> 'outfit' end)
  where p.id = p_user and p.avatar is not null;
  delete from public.avatar_owned where user_id = p_user and item_id = any (v_items);
  delete from public.pack_owned where user_id = p_user and pack_id = p_pack;
end $$;

-- Applies one RevenueCat webhook event. Returns what happened, for logging.
create or replace function public.apply_store_event(p_event jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_id       text := p_event ->> 'id';
  v_type     text := p_event ->> 'type';
  v_product  text := p_event ->> 'product_id';
  v_user     uuid;
  v_prod     private.store_products%rowtype;
  v_expires  timestamptz;
  v_bought   timestamptz;
  v_refund   boolean := (p_event ->> 'cancel_reason') = 'CUSTOMER_SUPPORT';
begin
  if v_id is null or v_type is null then
    return 'ignored: malformed';
  end if;
  -- Our app user ids are profile ids; anonymous store ids are ignored.
  begin
    v_user := (p_event ->> 'app_user_id')::uuid;
  exception when others then
    v_user := null;
  end;

  insert into private.store_events (id, user_id, type, product_id, payload)
  values (v_id, v_user, v_type, v_product, p_event)
  on conflict (id) do nothing;
  if not found then
    return 'ignored: already seen';
  end if;
  if v_user is null or not exists (select 1 from public.profiles where id = v_user) then
    return 'ignored: unknown user';
  end if;
  select * into v_prod from private.store_products where product_id = v_product;
  if not found then
    return 'ignored: unknown product';
  end if;

  v_expires := to_timestamp(((p_event ->> 'expiration_at_ms')::bigint) / 1000.0);
  v_bought := coalesce(to_timestamp(((p_event ->> 'purchased_at_ms')::bigint) / 1000.0), now());

  if v_prod.kind = 'pass_subscription' then
    if v_type in ('INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE',
                  'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT', 'REFUND_REVERSED') and v_expires is not null then
      insert into public.entitlements (user_id, kind, product_id, expires_at, will_renew)
      values (v_user, 'quest_pass', v_product, v_expires, true)
      on conflict (user_id, kind) do update
        set product_id = excluded.product_id,
            expires_at = greatest(public.entitlements.expires_at, excluded.expires_at),
            will_renew = true, updated_at = now();
      return 'pass granted';
    elsif v_type = 'CANCELLATION' and v_refund then
      update public.entitlements set expires_at = now(), will_renew = false, updated_at = now()
      where user_id = v_user and kind = 'quest_pass' and product_id = v_product;
      return 'pass refunded';
    elsif v_type in ('CANCELLATION', 'BILLING_ISSUE') then
      update public.entitlements set will_renew = false, updated_at = now()
      where user_id = v_user and kind = 'quest_pass';
      return 'pass will not renew';
    elsif v_type = 'EXPIRATION' then
      update public.entitlements set expires_at = least(expires_at, coalesce(v_expires, now())), will_renew = false, updated_at = now()
      where user_id = v_user and kind = 'quest_pass' and product_id = v_product;
      return 'pass expired';
    end if;
  elsif v_prod.kind = 'pass_trip' then
    if v_type = 'NON_RENEWING_PURCHASE' then
      -- A Trip Pass adds its days on top of any Pass time you already have.
      insert into public.entitlements (user_id, kind, product_id, expires_at, will_renew)
      values (v_user, 'quest_pass', v_product, v_bought + make_interval(days => v_prod.trip_days), false)
      on conflict (user_id, kind) do update
        set expires_at = greatest(public.entitlements.expires_at, v_bought) + make_interval(days => v_prod.trip_days),
            updated_at = now();
      return 'trip pass granted';
    elsif v_type = 'CANCELLATION' and v_refund then
      update public.entitlements set expires_at = greatest(now(), expires_at - make_interval(days => v_prod.trip_days)), updated_at = now()
      where user_id = v_user and kind = 'quest_pass';
      return 'trip pass refunded';
    end if;
  elsif v_prod.kind = 'pack' then
    if v_type in ('NON_RENEWING_PURCHASE', 'INITIAL_PURCHASE', 'REFUND_REVERSED') then
      insert into public.pack_owned (user_id, pack_id, purchased_at) values (v_user, v_prod.pack_id, v_bought)
      on conflict do nothing;
      insert into public.avatar_owned (user_id, item_id, price_paid)
      select v_user, id, 0 from public.avatar_items where pack_id = v_prod.pack_id
      on conflict do nothing;
      return 'pack granted';
    elsif v_type = 'CANCELLATION' and v_refund then
      perform private.revoke_pack(v_user, v_prod.pack_id);
      return 'pack refunded';
    end if;
  end if;
  return 'ignored: nothing to do';
end $$;
revoke all on function public.apply_store_event(jsonb) from public, anon, authenticated;
grant execute on function public.apply_store_event(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Products, packs and their items
-- ---------------------------------------------------------------------------
insert into public.outfit_packs (id, product_id, name, description, story, sort_order) values
  ('sleepy-hollow', 'oq_pack_sleepy_hollow', 'Sleepy Hollow Pack',
   'A schoolmaster''s coat, a pumpkin cap and the Headless Horseman''s billowing cloak, for a spooky season stroll.',
   'The Legend of Sleepy Hollow (1820)', 1),
  ('holiday-lights', 'oq_pack_holiday_lights', 'Holiday Lights Pack',
   'A snowflake sweater, a cozy pom-pom beanie, a gingerbread friend and a cape of twinkling lights.', null, 2),
  ('pirate-captain', 'oq_pack_pirate_captain', 'Pirate Captain Pack',
   'A captain''s greatcoat, a plumed hat, a brass spyglass and your own crossed-swords flag.', 'Treasure Island (1883)', 3);

insert into private.store_products (product_id, kind, trip_days, pack_id) values
  ('oq_pass_monthly', 'pass_subscription', null, null),
  ('oq_pass_yearly', 'pass_subscription', null, null),
  ('oq_pass:monthly', 'pass_subscription', null, null),
  ('oq_pass:yearly', 'pass_subscription', null, null),
  ('oq_pass_trip_3day', 'pass_trip', 3, null),
  ('oq_pack_sleepy_hollow', 'pack', null, 'sleepy-hollow'),
  ('oq_pack_holiday_lights', 'pack', null, 'holiday-lights'),
  ('oq_pack_pirate_captain', 'pack', null, 'pirate-captain');

insert into public.avatar_items (id, slot, name, description, story, land_id, price, is_starter, pack_id, pass_month, sort_order) values
  -- Sleepy Hollow Pack
  ('schoolmaster-coat', 'outfit', 'Schoolmaster''s Coat', 'A long black coat for a lanky schoolmaster who startles at every sound.', 'The Legend of Sleepy Hollow (1820)', 'dlp-new-orleans-square', 0, false, 'sleepy-hollow', null, 200),
  ('pumpkin-cap', 'hat', 'Pumpkin Cap', 'A little pumpkin hat with a curly green stem.', 'The Legend of Sleepy Hollow (1820)', 'dlp-new-orleans-square', 0, false, 'sleepy-hollow', null, 201),
  ('horseman-cloak', 'back', 'Horseman''s Cloak', 'A billowing midnight cloak, as worn by the Headless Horseman on his midnight ride.', 'The Legend of Sleepy Hollow (1820)', 'dlp-new-orleans-square', 0, false, 'sleepy-hollow', null, 202),
  -- Holiday Lights Pack
  ('snowflake-sweater', 'outfit', 'Snowflake Sweater', 'A cozy knit with snowflakes all the way around.', null, null, 0, false, 'holiday-lights', null, 210),
  ('pom-beanie', 'hat', 'Pom-Pom Beanie', 'A striped knit beanie with one big fluffy pom-pom.', null, null, 0, false, 'holiday-lights', null, 211),
  ('gingerbread-friend', 'held', 'Gingerbread Friend', 'A cheerful gingerbread cookie with icing buttons. Too cute to eat.', null, null, 0, false, 'holiday-lights', null, 212),
  ('twinkle-cape', 'back', 'Twinkle-Light Cape', 'A cape strung with little glowing lights.', null, null, 0, false, 'holiday-lights', null, 213),
  -- Pirate Captain Pack
  ('captains-greatcoat', 'outfit', 'Captain''s Greatcoat', 'A deep blue greatcoat with gold braid, for the captain of the finest ship afloat.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 0, false, 'pirate-captain', null, 220),
  ('plumed-hat', 'hat', 'Plumed Captain''s Hat', 'A wide-brimmed hat with a sweeping golden plume.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 0, false, 'pirate-captain', null, 221),
  ('spyglass', 'held', 'Brass Spyglass', 'Land ho! A brass telescope for spotting islands and clues.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 0, false, 'pirate-captain', null, 222),
  ('crossed-swords-flag', 'back', 'Crossed-Swords Flag', 'Your own flag on a pole, flying a pair of crossed swords.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 0, false, 'pirate-captain', null, 223),
  -- Quest Pass monthly gifts
  ('lantern-bearer', 'held', 'Lantern Bearer''s Lantern', 'October''s Quest Pass gift: a lantern lit from the one at the top of Lantern Keep, so you can always find your way home.', null, null, 0, false, null, '2026-10', 300),
  ('autumn-leaf-cape', 'back', 'Autumn Leaf Cape', 'November''s Quest Pass gift: a cape stitched from red and golden leaves.', null, null, 0, false, null, '2026-11', 301),
  ('snow-globe', 'held', 'Snow Globe', 'December''s Quest Pass gift: a tiny snowy village in a glass globe.', null, null, 0, false, null, '2026-12', 302);

-- ---------------------------------------------------------------------------
-- The first premium quest: Hollow Haunts, around the mansion on the hill in
-- New Orleans Square. Same rules as other quests: our own words, not yet
-- checked on site, no GPS pins until the field walk. Paused during parades
-- and fireworks, because nighttime show crowds gather along the river here.
-- ---------------------------------------------------------------------------
insert into public.badges (slug, title, description, art_key) values
  ('hollow-haunts', 'Midnight Visitor', 'Paid a polite visit to the mansion on the hill and lived to tell the tale.', 'badge_lantern')
on conflict (slug) do nothing;

insert into public.quests (slug, land_id, badge_id, title, story, est_minutes, sort_order, status, is_premium) values
  ('hollow-haunts', 'dlp-new-orleans-square', (select id from public.badges where slug = 'hollow-haunts'),
   'Hollow Haunts',
   'A grand old mansion stands on a hill above the river, and its residents are dying to meet you. Walk slowly, look closely, and mind the ones you can''t see.',
   20,
   (select max(sort_order) from public.quests where land_id = 'dlp-new-orleans-square'),
   'live', true)
on conflict (slug) do nothing;

with q as (select id from public.quests where slug = 'hollow-haunts')
insert into public.spots
  (quest_id, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method, pause_during_parades, holiday_note)
values
  ((select id from q), 1,
   'An empty harness', 'The hearse with no horse',
   'The walkway in front of the mansion, off to the side of the line so guests can pass.',
   'An old black hearse waits near the mansion, hitched up and ready to go. Look at the harness: there''s no horse. The story goes that the horse is simply invisible.',
   'It''s parked near the front of the mansion grounds, outside the line.',
   'Take a photo of the hearse.', 'photo', true, null),
  ((select id from q), 2,
   'Look up, way up', 'The weathervane',
   'Any spot on the walkway with a clear view of the mansion roof. Stop before you look up.',
   'Most weathervanes have a rooster. This mansion''s has something that suits a house by the river: look for what rides the wind on top of the roof.',
   'It isn''t a bird. Think of something that sails.',
   'Take a photo of the weathervane.', 'photo', true, null),
  ((select id from q), 3,
   'Beloved pets', 'The pet cemetery',
   'Along the line for the mansion, on the hillside garden. Stay with the line; don''t step into the garden.',
   'The mansion''s residents loved their pets, and the pets rest on the hillside with funny little headstones of their own.',
   'Watch the garden on the hill as the line winds toward the door.',
   'Take a photo of a headstone you like.', 'photo', true, null),
  ((select id from q), 4,
   'Keep out (politely)', 'The iron gates',
   'The walkway in front of the mansion grounds, off to the side so others can pass.',
   'Tall iron gates and a fence keep the mansion''s grounds just so. Look closely at the ironwork: who would build gates this grand for a house nobody leaves?',
   'Look at the fence and gates along the front of the grounds.',
   'Take a photo of the ironwork.', 'photo', true, null);
