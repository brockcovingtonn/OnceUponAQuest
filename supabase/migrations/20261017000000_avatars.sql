-- Explorer avatars, Wishing Stars and the wardrobe.
--
-- Everyone makes a chibi avatar (profiles.avatar). Progress earns Wishing
-- Stars, recorded in a ledger by triggers on the progress tables, so the app
-- can't award itself stars. Stars buy wardrobe items through buy_avatar_item().
-- Stars are earned only: they can never be bought, sold or traded (hard rule 4).

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create type public.avatar_slot as enum ('hat', 'outfit', 'back', 'held');

create table public.avatar_items (
  id              text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  slot            public.avatar_slot not null,
  name            text not null,
  description     text not null,
  story           text,                                   -- the public-domain book it comes from
  land_id         text references public.lands (id),      -- wearing it there earns the dress-the-part bonus
  price           int  not null default 0 check (price >= 0),
  is_starter      boolean not null default false,          -- free for everyone
  unlock_land_id  text references public.lands (id),      -- finish every quest in this land first
  unlock_quest_id uuid references public.quests (id),     -- or finish this quest first
  sort_order      int  not null default 0,
  is_active       boolean not null default true
);
alter table public.avatar_items enable row level security;
create policy avatar_items_read on public.avatar_items for select to authenticated using (is_active);

create table public.avatar_owned (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  item_id     text not null references public.avatar_items (id) on delete cascade,
  price_paid  int  not null default 0,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.avatar_owned enable row level security;
-- You see only your own wardrobe; items arrive only through buy_avatar_item().
create policy avatar_owned_read on public.avatar_owned for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Wishing Stars ledger
-- ---------------------------------------------------------------------------
create table public.star_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     int  not null check (amount <> 0),
  reason     text not null check (reason in ('welcome', 'spot', 'badge', 'land', 'lens', 'dress_the_part', 'purchase')),
  ref        text not null,                                 -- spot / badge / land / landmark / item id
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);
create index star_ledger_user_idx on public.star_ledger (user_id, created_at desc);
alter table public.star_ledger enable row level security;
create policy star_ledger_read on public.star_ledger for select to authenticated using (user_id = auth.uid());

-- What each kind of progress is worth.
create or replace function private.star_value(p_reason text)
returns int language sql immutable set search_path = '' as $$
  select case p_reason
    when 'welcome' then 60
    when 'spot' then 10
    when 'badge' then 50
    when 'land' then 200
    when 'lens' then 15
    when 'dress_the_part' then 5
  end
$$;

create or replace function private.award_stars(p_user uuid, p_reason text, p_ref text)
returns void language sql security definer set search_path = '' as $$
  insert into public.star_ledger (user_id, amount, reason, ref)
  select p_user, private.star_value(p_reason), p_reason, p_ref
  where exists (select 1 from public.profiles where id = p_user)
  on conflict (user_id, reason, ref) do nothing
$$;
revoke all on function private.award_stars(uuid, text, text) from public, anon, authenticated;

-- True once you have the badge for every live quest in a land.
create or replace function private.land_complete(p_user uuid, p_land text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.quests q
           where q.land_id = p_land and q.status = 'live' and q.badge_id is not null)
     and not exists (
           select 1 from public.quests q
           where q.land_id = p_land and q.status = 'live' and q.badge_id is not null
             and not exists (select 1 from public.user_badges ub where ub.user_id = p_user and ub.badge_id = q.badge_id))
$$;
revoke all on function private.land_complete(uuid, text) from public, anon, authenticated;

create or replace function private.star_balance(p_user uuid)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(sum(amount), 0)::int from public.star_ledger where user_id = p_user
$$;
revoke all on function private.star_balance(uuid) from public, anon, authenticated;

-- Earning triggers ------------------------------------------------------------

create or replace function private.stars_on_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.award_stars(new.id, 'welcome', 'welcome');
  return new;
end $$;
create trigger profiles_award_welcome after insert on public.profiles
  for each row execute function private.stars_on_profile();

-- A found spot, plus the dress-the-part bonus when something you're wearing
-- comes from that spot's land.
create or replace function private.stars_on_checkin()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_land text;
  v_avatar jsonb;
begin
  perform private.award_stars(new.user_id, 'spot', new.spot_id::text);
  select q.land_id into v_land
  from public.spots s join public.quests q on q.id = s.quest_id
  where s.id = new.spot_id;
  select avatar into v_avatar from public.profiles where id = new.user_id;
  if v_avatar is not null and exists (
       select 1 from public.avatar_items i
       where i.land_id = v_land
         and i.id in (v_avatar ->> 'hat', v_avatar ->> 'outfit', v_avatar ->> 'back', v_avatar ->> 'held')) then
    perform private.award_stars(new.user_id, 'dress_the_part', new.spot_id::text);
  end if;
  return new;
end $$;
create trigger checkins_award_stars after insert on public.checkins
  for each row execute function private.stars_on_checkin();

-- A quest badge, plus the land bonus when it completes the land.
create or replace function private.stars_on_badge()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_land text;
begin
  perform private.award_stars(new.user_id, 'badge', new.badge_id::text);
  for v_land in select distinct q.land_id from public.quests q where q.badge_id = new.badge_id loop
    if private.land_complete(new.user_id, v_land) then
      perform private.award_stars(new.user_id, 'land', v_land);
    end if;
  end loop;
  return new;
end $$;
create trigger user_badges_award_stars after insert on public.user_badges
  for each row execute function private.stars_on_badge();

create or replace function private.stars_on_lens()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.award_stars(new.user_id, 'lens', new.landmark_id::text);
  return new;
end $$;
create trigger lens_stamps_award_stars after insert on public.lens_stamps
  for each row execute function private.stars_on_lens();

-- ---------------------------------------------------------------------------
-- The avatar on the profile
-- ---------------------------------------------------------------------------
alter table public.profiles add column avatar jsonb;

-- Checks the avatar's shape and that every worn item is a starter or yours.
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
                where k not in ('v', 'skin', 'hair', 'hairColor', 'eyes', 'freckles', 'hat', 'outfit', 'back', 'held'))
     or (a ->> 'v') is distinct from '1'
     or (a ->> 'skin') not in ('s1', 's2', 's3', 's4', 's5', 's6')
     or (a ->> 'hair') not in ('crop', 'swoop', 'bob', 'long', 'curls', 'ponytail', 'braids', 'shaved')
     or (a ->> 'hairColor') not in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7')
     or (a ->> 'eyes') not in ('dot', 'happy', 'sparkle')
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
create trigger profiles_guard_avatar before insert or update of avatar on public.profiles
  for each row execute function private.guard_profile_avatar();

-- ---------------------------------------------------------------------------
-- Wardrobe RPCs
-- ---------------------------------------------------------------------------

-- Your balance and every item, with whether you own it and whether it's unlocked.
create or replace function public.my_wardrobe()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'balance', private.star_balance(auth.uid()),
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
               'owned', i.is_starter or exists (select 1 from public.avatar_owned o where o.user_id = auth.uid() and o.item_id = i.id),
               'unlocked', (i.unlock_land_id is null or private.land_complete(auth.uid(), i.unlock_land_id))
                       and (i.unlock_quest_id is null or exists (
                              select 1 from public.quests q join public.user_badges ub on ub.badge_id = q.badge_id
                              where q.id = i.unlock_quest_id and ub.user_id = auth.uid()))
             ) order by i.sort_order, i.id)
      from public.avatar_items i where i.is_active), '[]'::jsonb)
  )
$$;
revoke all on function public.my_wardrobe() from public, anon;
grant execute on function public.my_wardrobe() to authenticated;

-- Buys an item with Wishing Stars. Returns {status, balance}; status is
-- 'ok', 'owned', 'locked', 'short' (not enough stars) or 'not_found'.
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
  -- One purchase at a time per explorer, so two taps can't overspend.
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
revoke all on function public.buy_avatar_item(text) from public, anon;
grant execute on function public.buy_avatar_item(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Wardrobe catalog. Generic names with a storybook-park feel; story items
-- follow the public-domain books, never a film's designs or trademarked names.
-- ---------------------------------------------------------------------------
insert into public.avatar_items (id, slot, name, description, story, land_id, price, is_starter, unlock_land_id, unlock_quest_id, sort_order)
select v.id, v.slot::public.avatar_slot, v.name, v.description, v.story, v.land_id, v.price, v.is_starter, v.unlock_land_id,
       (select q.id from public.quests q where q.slug = v.unlock_quest), v.sort_order
from (values
  -- Starters
  ('explorer-tee', 'outfit', 'Explorer''s Tee', 'A golden tee and comfy shorts for a full day of finding things.', null, null, 0, true, null, null, 1),
  ('picnic-overalls', 'outfit', 'Picnic Overalls', 'Green overalls with deep pockets for maps and snacks.', null, null, 0, true, null, null, 2),
  ('cozy-sweater', 'outfit', 'Cozy Sweater', 'A rose-pink sweater for cool evenings on the street.', null, null, 0, true, null, null, 3),
  ('explorer-cap', 'hat', 'Explorer''s Cap', 'A green cap to keep the sun out of your eyes.', null, null, 0, true, null, null, 4),
  ('day-pack', 'back', 'Day Pack', 'A trusty backpack for the walk between lands.', null, null, 0, true, null, null, 5),
  ('folded-map', 'held', 'Folded Map', 'Your own park map, with the route already drawn in.', null, null, 0, true, null, null, 6),
  -- Main Street, U.S.A.
  ('straw-boater', 'hat', 'Straw Boater', 'A flat-topped straw hat for harmonizing on the corner.', null, 'dlp-main-street', 60, false, null, null, 10),
  ('quartet-stripes', 'outfit', 'Barbershop Stripes', 'A candy-striped vest and bow tie, ready for four-part harmony.', null, 'dlp-main-street', 120, false, null, null, 11),
  ('engineer-cap', 'hat', 'Engineer''s Cap', 'A striped railroad cap for riding the steam train around the park.', null, 'dlp-main-street', 60, false, null, null, 12),
  ('balloon-bouquet', 'held', 'Balloon Bouquet', 'Four round balloons in storybook colors.', null, 'dlp-main-street', 50, false, null, null, 13),
  ('lamplighter-coat', 'outfit', 'Lamplighter''s Coat', 'The long green coat of the folks who light the gas lamps at dusk.', null, 'dlp-main-street', 160, false, 'dlp-main-street', null, 14),
  -- Adventureland
  ('skipper-hat', 'hat', 'River Skipper Hat', 'A wide-brim bush hat for a jungle river cruise, terrible puns included.', null, 'dlp-adventureland', 70, false, null, 'jungle-expedition', 20),
  ('skipper-khakis', 'outfit', 'River Skipper Khakis', 'Pocketed khakis for steering through the jungle.', null, 'dlp-adventureland', 130, false, null, null, 21),
  ('wishing-lamp', 'held', 'Wishing Lamp', 'An old brass oil lamp, like the one in the Arabian Nights. Give it a rub.', 'One Thousand and One Nights', 'dlp-adventureland', 90, false, null, null, 22),
  ('pineapple-swirl', 'held', 'Pineapple Swirl Cone', 'A cold, tangy swirl for a hot jungle afternoon.', null, 'dlp-adventureland', 45, false, null, null, 23),
  ('flying-carpet', 'back', 'Flying Carpet', 'A tasseled carpet that flies, from the tale of Prince Ahmed in the Arabian Nights.', 'One Thousand and One Nights', 'dlp-adventureland', 200, false, 'dlp-adventureland', null, 24),
  -- New Orleans Square
  ('tricorn', 'hat', 'Pirate Captain''s Tricorn', 'A gold-trimmed three-cornered hat for a captain of the high seas.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 90, false, null, null, 30),
  ('buccaneer-coat', 'outfit', 'Buccaneer Coat', 'A long coat with a rose sash, fit for a sea cook with a secret.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 150, false, null, null, 31),
  ('treasure-map', 'held', 'Treasure Map', 'An old chart where X marks the spot.', 'Treasure Island (1883)', 'dlp-new-orleans-square', 50, false, null, null, 32),
  ('beignet', 'held', 'Powdered Beignets', 'Warm square pastries under a snowfall of sugar.', null, 'dlp-new-orleans-square', 35, false, null, null, 33),
  ('shoulder-parrot', 'back', 'Shoulder Parrot', 'A green parrot like Captain Flint, who squawks "Pieces of eight!"', 'Treasure Island (1883)', 'dlp-new-orleans-square', 140, false, 'dlp-new-orleans-square', null, 34),
  ('jack-o-lantern', 'held', 'Jack-o''-Lantern', 'A glowing pumpkin, as tossed by the Headless Horseman of Sleepy Hollow.', 'The Legend of Sleepy Hollow (1820)', 'dlp-new-orleans-square', 40, false, null, null, 35),
  -- Bayou Country
  ('fishing-hat', 'hat', 'Bayou Fishing Hat', 'A floppy hat with a lucky lure for slow days on the water.', null, 'dlp-bayou-country', 50, false, null, null, 40),
  ('rowing-jumper', 'outfit', 'Riverbank Rowing Jumper', 'A striped jumper for messing about in boats, as the Water Rat would say.', 'The Wind in the Willows (1908)', 'dlp-bayou-country', 110, false, null, null, 41),
  ('honey-pot', 'held', 'Honey Pot', 'For a bear of very little brain who is always ready for a little something.', 'Winnie-the-Pooh (1926)', 'dlp-bayou-country', 60, false, null, null, 42),
  ('canoe-paddle', 'back', 'Canoe Paddle', 'Pull together and the whole canoe glides.', null, 'dlp-bayou-country', 60, false, null, null, 43),
  ('honey-bear-hoodie', 'outfit', 'Honey-Bear Hoodie', 'A golden hoodie as cozy as a honey tree.', 'Winnie-the-Pooh (1926)', 'dlp-bayou-country', 150, false, 'dlp-bayou-country', null, 44),
  -- Frontierland
  ('ten-gallon', 'hat', 'Ten-Gallon Hat', 'A tall frontier hat with a curled brim.', null, 'dlp-frontierland', 70, false, null, null, 50),
  ('prospector', 'outfit', 'Prospector''s Duds', 'A flannel shirt, leather vest and bandana for panning the river.', null, 'dlp-frontierland', 120, false, null, null, 51),
  ('gold-pan', 'held', 'Gold Pan', 'Swirl, rinse, and look for the glint.', null, 'dlp-frontierland', 50, false, null, null, 52),
  ('whitewash-brush', 'held', 'Whitewash Brush', 'Tom Sawyer made painting a fence look like the best fun in town.', 'The Adventures of Tom Sawyer (1876)', 'dlp-frontierland', 40, false, null, null, 53),
  ('riverboat-pilot', 'outfit', 'Riverboat Pilot''s Jacket', 'A navy jacket with gold buttons, as worn by the young Mark Twain at the wheel.', 'Life on the Mississippi (1883)', 'dlp-frontierland', 160, false, 'dlp-frontierland', null, 54),
  -- Galaxy's Edge
  ('desert-wrap', 'outfit', 'Desert Wanderer Wrap', 'Layers of sand-colored cloth for a dusty outpost.', null, 'dlp-galaxys-edge', 120, false, null, null, 60),
  ('spacer-goggles', 'hat', 'Spacer Goggles', 'Amber goggles for bright suns and long flights.', null, 'dlp-galaxys-edge', 60, false, null, null, 61),
  ('robot-pal', 'back', 'Robot Pal', 'A little helper robot that beeps hello.', null, 'dlp-galaxys-edge', 160, false, 'dlp-galaxys-edge', null, 62),
  -- Fantasyland
  ('looking-glass-pinafore', 'outfit', 'Looking-Glass Pinafore', 'A yellow dress and white pinafore, as Alice wears in The Nursery Alice (1890).', 'Alice''s Adventures in Wonderland (1865)', 'dlp-fantasyland', 160, false, 'dlp-fantasyland', null, 70),
  ('hatters-topper', 'hat', 'Hatter''s Topper', 'A towering hat that still has its price card: "In this style 10/6."', 'Alice''s Adventures in Wonderland (1865)', 'dlp-fantasyland', 110, false, null, null, 71),
  ('pocket-watch', 'held', 'Late Rabbit''s Pocket Watch', '"Oh dear! Oh dear! I shall be late!"', 'Alice''s Adventures in Wonderland (1865)', 'dlp-fantasyland', 70, false, null, 'clockwork-wonders', 72),
  ('skeleton-leaf-tunic', 'outfit', 'Skeleton-Leaf Tunic', 'Peter was "clad in skeleton leaves and the juices that ooze out of trees."', 'Peter and Wendy (1911)', 'dlp-fantasyland', 130, false, null, null, 73),
  ('fairy-wings', 'back', 'Fairy Wings', 'Shimmering wings for flying second to the right, and straight on till morning.', 'Peter and Wendy (1911)', 'dlp-fantasyland', 150, false, null, null, 74),
  ('riding-hood-cape', 'back', 'Riding Hood Cape', 'A red hooded cape for the walk to Grandmother''s house. Mind the wolf.', 'Little Red Riding Hood (Perrault, 1697)', 'dlp-fantasyland', 100, false, null, null, 75),
  ('glass-slipper', 'held', 'Glass Slipper', 'One glass slipper, left on the palace stairs at midnight.', 'Cinderella (Perrault, 1697)', 'dlp-fantasyland', 90, false, null, null, 76),
  ('briar-rose-crown', 'hat', 'Briar-Rose Crown', 'A golden circlet wound with roses from the hedge that grew for a hundred years.', 'Little Briar Rose (Grimm, 1812)', 'dlp-fantasyland', 120, false, null, null, 77),
  ('motor-goggles', 'hat', 'Motor-Car Goggles', 'For racing along the open road. "Poop-poop!"', 'The Wind in the Willows (1908)', 'dlp-fantasyland', 80, false, null, null, 78),
  ('shiny-apple', 'held', 'Shiny Red Apple', 'Red on one side, white on the other. Think twice before you bite.', 'Little Snow-White (Grimm, 1812)', 'dlp-fantasyland', 30, false, null, null, 79),
  -- Toontown
  ('propeller-beanie', 'hat', 'Propeller Beanie', 'A rainbow beanie that spins when you run (please walk).', null, 'dlp-toontown', 50, false, null, null, 80),
  ('squeaky-mallet', 'held', 'Squeaky Mallet', 'Bonk! It only ever squeaks.', null, 'dlp-toontown', 50, false, null, null, 81),
  ('jellybean-suspenders', 'outfit', 'Jelly-Bean Suspenders', 'Gold suspenders studded with jelly-bean buttons.', null, 'dlp-toontown', 90, false, 'dlp-toontown', null, 82),
  -- Tomorrowland
  ('diving-helmet', 'hat', 'Brass Diving Helmet', 'A riveted helmet for a walk on the sea floor, as in Captain Nemo''s undersea forest.', 'Twenty Thousand Leagues Under the Seas (1870)', 'dlp-tomorrowland', 140, false, 'dlp-tomorrowland', null, 90),
  ('nautilus-coat', 'outfit', 'Submarine Captain''s Coat', 'A navy coat with brass buttons. Motto: Mobilis in mobili.', 'Twenty Thousand Leagues Under the Seas (1870)', 'dlp-tomorrowland', 150, false, null, null, 91),
  ('rocket-cadet', 'outfit', 'Rocket Cadet Suit', 'A silver suit with a ringed-planet patch, straight from the world of tomorrow.', null, 'dlp-tomorrowland', 120, false, null, null, 92),
  ('rocket-pack', 'back', 'Rocket Pack', 'Twin tanks for imaginary flights.', null, 'dlp-tomorrowland', 130, false, null, 'retro-rockets', 93),
  -- More storybook classics (no land bonus)
  ('laurel-crown', 'hat', 'Hero''s Laurel Crown', 'A crown of laurel leaves for finishing twelve labors.', 'Greek myths', null, 90, false, null, null, 100),
  ('archer-cap', 'hat', 'Sherwood Archer''s Cap', 'A feathered green cap for the merry men of Sherwood Forest.', 'The ballads of Robin Hood', null, 70, false, null, null, 101),
  ('mermaid-tail', 'outfit', 'Sea-Foam Mermaid Tail', 'A shimmering tail from far out at sea, where the water is as blue as cornflowers.', 'The Little Mermaid (Andersen, 1837)', null, 150, false, null, null, 102)
) as v (id, slot, name, description, story, land_id, price, is_starter, unlock_land_id, unlock_quest, sort_order);

-- ---------------------------------------------------------------------------
-- Back-fill stars for progress made before stars existed.
-- ---------------------------------------------------------------------------
insert into public.star_ledger (user_id, amount, reason, ref)
select id, private.star_value('welcome'), 'welcome', 'welcome' from public.profiles
on conflict do nothing;
insert into public.star_ledger (user_id, amount, reason, ref)
select user_id, private.star_value('spot'), 'spot', spot_id::text from public.checkins
on conflict do nothing;
insert into public.star_ledger (user_id, amount, reason, ref)
select user_id, private.star_value('badge'), 'badge', badge_id::text from public.user_badges
on conflict do nothing;
insert into public.star_ledger (user_id, amount, reason, ref)
select ls.user_id, private.star_value('lens'), 'lens', ls.landmark_id::text
from public.lens_stamps ls where exists (select 1 from public.profiles p where p.id = ls.user_id)
on conflict do nothing;
insert into public.star_ledger (user_id, amount, reason, ref)
select p.id, private.star_value('land'), 'land', l.id
from public.profiles p cross join public.lands l
where private.land_complete(p.id, l.id)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Leaderboard rows carry each friend's avatar.
-- ---------------------------------------------------------------------------
drop function public.friends_leaderboard();
create function public.friends_leaderboard()
returns table (user_id uuid, username text, avatar_key text, avatar_url text,
               spots_found bigint, badges bigint, is_me boolean, avatar jsonb)
language sql stable security definer set search_path = ''
as $$
  with people as (
    select auth.uid() as id
    union
    select case when f.requester = auth.uid() then f.addressee else f.requester end
    from public.friendships f
    where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
  )
  select p.id, p.username, p.avatar_key, p.avatar_url,
         (select count(*) from public.checkins c where c.user_id = p.id),
         (select count(*) from public.user_badges b where b.user_id = p.id),
         p.id = auth.uid(),
         p.avatar
  from people x join public.profiles p on p.id = x.id
  order by 5 desc, 6 desc, p.username
$$;
revoke all on function public.friends_leaderboard() from public, anon;
grant execute on function public.friends_leaderboard() to authenticated;
