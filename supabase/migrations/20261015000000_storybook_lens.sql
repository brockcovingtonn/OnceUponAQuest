-- Storybook Lens: the design and history behind park landmarks.
--
-- Each landmark has a "Look for…" detail and up to four layers (architecture,
-- story, history, engineering). Anyone signed in can read them anywhere; a
-- Lens stamp in the Passport needs the explorer to be near the landmark once
-- it has a GPS pin (same rule as check-ins). Written in our own words from
-- public research (source_url is internal only); every landmark starts
-- unverified and unpinned until the field walk.

create table public.landmarks (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  land_id          text not null references public.lands (id),
  sort_order       int  not null,
  title            text not null,
  teaser           text not null,
  look_for         text not null,
  architecture     text,
  story            text,
  history          text,
  engineering      text,
  lat              double precision,
  lng              double precision,
  radius_m         int not null default 60 check (radius_m between 10 and 300),
  photo_path       text,
  verified_on_site boolean not null default false,
  status           public.quest_status not null default 'live',
  source_url       text,
  created_at       timestamptz not null default now(),
  unique (land_id, sort_order),
  check ((lat is null) = (lng is null)),
  check (num_nonnulls(architecture, story, history, engineering) >= 2)
);
alter table public.landmarks enable row level security;
create policy landmarks_read on public.landmarks for select to authenticated using (status = 'live');

-- A spot can point at the landmark it belongs to ("Story behind this").
alter table public.spots add column landmark_id uuid references public.landmarks (id) on delete set null;
create index spots_landmark_idx on public.spots (landmark_id);

create table public.lens_stamps (
  user_id     uuid not null references auth.users (id) on delete cascade,
  landmark_id uuid not null references public.landmarks (id) on delete cascade,
  stamped_at  timestamptz not null default now(),
  primary key (user_id, landmark_id)
);
alter table public.lens_stamps enable row level security;
-- You see your own stamps and your friends'; writes only through stamp_landmark().
create policy lens_stamps_read on public.lens_stamps for select to authenticated
  using (user_id = auth.uid() or private.are_friends(auth.uid(), user_id));

create or replace function public.stamp_landmark(
  p_landmark_id uuid,
  p_lat         double precision default null,
  p_lng         double precision default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_lm   public.landmarks%rowtype;
  v_dist double precision;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into v_lm from public.landmarks where id = p_landmark_id and status = 'live';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if exists (select 1 from public.lens_stamps where user_id = v_uid and landmark_id = p_landmark_id) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  if v_lm.lat is not null then
    if p_lat is null or p_lng is null then
      return jsonb_build_object('ok', false, 'reason', 'location_required');
    end if;
    v_dist := private.distance_m(v_lm.lat, v_lm.lng, p_lat, p_lng);
    if v_dist > v_lm.radius_m + 25 then
      return jsonb_build_object('ok', false, 'reason', 'too_far', 'distance_m', round(v_dist));
    end if;
  end if;
  insert into public.lens_stamps (user_id, landmark_id) values (v_uid, p_landmark_id)
  on conflict do nothing;
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;
revoke all on function public.stamp_landmark(uuid, double precision, double precision) from public, anon;
grant execute on function public.stamp_landmark(uuid, double precision, double precision) to authenticated;

-- Field tools: pin, photo (under landmarks/ in spot-photos) and verified flag.
create or replace function public.admin_update_landmark(
  p_landmark_id uuid,
  p_lat         double precision default null,
  p_lng         double precision default null,
  p_photo_path  text default null,
  p_verified    boolean default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception 'set lat and lng together' using errcode = '22023';
  end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> 'landmarks' then
    raise exception 'landmark photos live under landmarks/' using errcode = '22023';
  end if;
  update public.landmarks
  set lat              = coalesce(p_lat, lat),
      lng              = coalesce(p_lng, lng),
      photo_path       = coalesce(p_photo_path, photo_path),
      verified_on_site = coalesce(p_verified, verified_on_site)
  where id = p_landmark_id;
  if not found then
    raise exception 'landmark not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_update_landmark(uuid, double precision, double precision, text, boolean) from public, anon;
grant execute on function public.admin_update_landmark(uuid, double precision, double precision, text, boolean) to authenticated;

-- Edit landmark text from the app; logged like spot edits.
alter table private.content_edits drop constraint content_edits_target_check;
alter table private.content_edits add constraint content_edits_target_check
  check (target in ('spot', 'quest', 'landmark'));

-- p_changes keys (all optional): title, teaser, look_for (blank ignored);
-- architecture, story, history, engineering (blank clears; at least two must
-- remain); radius_m (10–300).
create or replace function public.admin_update_landmark_content(p_landmark_id uuid, p_changes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb;
  v_after  jsonb;
begin
  if not private.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  select to_jsonb(l) - 'source_url' into v_before from public.landmarks l where l.id = p_landmark_id;
  if v_before is null then
    raise exception 'landmark not found' using errcode = 'P0002';
  end if;
  update public.landmarks set
    title        = coalesce(nullif(btrim(p_changes->>'title'), ''), title),
    teaser       = coalesce(nullif(btrim(p_changes->>'teaser'), ''), teaser),
    look_for     = coalesce(nullif(btrim(p_changes->>'look_for'), ''), look_for),
    architecture = case when p_changes ? 'architecture' then nullif(btrim(p_changes->>'architecture'), '') else architecture end,
    story        = case when p_changes ? 'story' then nullif(btrim(p_changes->>'story'), '') else story end,
    history      = case when p_changes ? 'history' then nullif(btrim(p_changes->>'history'), '') else history end,
    engineering  = case when p_changes ? 'engineering' then nullif(btrim(p_changes->>'engineering'), '') else engineering end,
    radius_m     = coalesce((p_changes->>'radius_m')::int, radius_m)
  where id = p_landmark_id;
  select to_jsonb(l) - 'source_url' into v_after from public.landmarks l where l.id = p_landmark_id;
  insert into private.content_edits (editor, target, target_id, before, after)
  values (auth.uid(), 'landmark', p_landmark_id, v_before, v_after);
end;
$$;
revoke all on function public.admin_update_landmark_content(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_landmark_content(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Landmarks (40)
-- ---------------------------------------------------------------------------
-- Main Street's land row lives in seed.sql, which runs after migrations locally.
insert into public.parks (id, name, resort) values
  ('disneyland-park', 'Disneyland Park', 'Disneyland Resort')
on conflict (id) do nothing;
insert into public.lands (id, park_id, name, sort_order) values
  ('dlp-main-street', 'disneyland-park', 'Main Street, U.S.A.', 1)
on conflict (id) do nothing;

insert into public.landmarks
  (slug, land_id, sort_order, title, teaser, look_for, architecture, story, history, engineering, source_url)
values
  -- Main Street, U.S.A.
  ('main-street-station', 'dlp-main-street', 1,
   'The Train Station', 'Where every visit begins.',
   'Look back at the station from Town Square: it sits on top of the grassy berm that circles the whole park.',
   'A Victorian-style depot crowns the berm, an earth wall that wraps the park so the outside world disappears once you pass through the tunnels below.',
   'The entrance works like a theater: you walk under the station, through a short tunnel, and the curtain rises on the street.',
   'Steam trains have circled the park since it opened in 1955. Walt Disney loved railroads so much that he ran a miniature live-steam train around his own backyard.',
   'The locomotives are real working steam engines. Two were built for the park in 1955; others are antique engines from the 1890s to the 1920s, restored to run here.',
   'https://en.wikipedia.org/wiki/Disneyland_Railroad'),
  ('town-square', 'dlp-main-street', 2,
   'Town Square', 'Words from opening day.',
   'The bronze plaque at the foot of the flagpole, and the date cast into it.',
   'Laid out like a real town green, with a city hall, a fire station, a bandstand and a flagpole at the center.',
   'On opening day, Walt read a short dedication welcoming young and old to a happy place. His words are cast in bronze here.',
   'The park opened on July 17, 1955, with a live television broadcast seen by millions of viewers.',
   null,
   'https://en.wikipedia.org/wiki/Main_Street,_U.S.A.'),
  ('main-street-facades', 'dlp-main-street', 3,
   'Shrinking Second Stories', 'Look up — the buildings are playing a trick.',
   'Compare a ground-floor window with the windows on the floors above it.',
   'Only the ground floors are built at full size. The floors above get smaller as they rise, a trick called forced perspective that makes the street feel tall but cozy.',
   'The street celebrates small-town America around 1900, the age of gas lamps, streetcars and ice cream parlors.',
   'Art director Harper Goff drew on his hometown of Fort Collins, Colorado, while Walt remembered his boyhood town of Marceline, Missouri.',
   'The upper floors aren''t just scenery: Walt asked for real second stories so there would be room for offices and storage.',
   'https://duchessofdisneyland.com/tips-and-trivia/forced-perspective/'),
  ('firehouse-apartment', 'dlp-main-street', 4,
   'The Firehouse Apartment', 'A light that''s always on.',
   'The lamp glowing in the upstairs window above the fire station.',
   'The small apartment was furnished in late-Victorian style to match the street below.',
   'Walt kept a private apartment above the firehouse so he could stay overnight and watch guests enjoy the park.',
   'After Walt passed away in 1966, the lamp in the window was kept lit in his memory.',
   null,
   'https://en.wikipedia.org/wiki/Main_Street,_U.S.A.'),
  ('horse-drawn-streetcars', 'dlp-main-street', 5,
   'Horse-Drawn Streetcars', 'The slowest ride in the park.',
   'The rails running down the middle of the street.',
   null,
   'Before automobiles, horse-drawn streetcars carried townsfolk up and down Main Street. The street keeps that era rolling.',
   'Streetcars have clip-clopped down the street since opening day in 1955.',
   'The rails are set flush into the pavement, and the cars roll so easily that a single draft horse can pull a full car.',
   'https://en.wikipedia.org/wiki/Main_Street_Vehicles'),

  -- Adventureland
  ('tiki-room', 'dlp-adventureland', 1,
   'The Tiki Room', 'Where the birds first learned to sing.',
   'The perches and carved poles above the waiting garden.',
   'A thatched-roof theater with a garden preshow, styled after an island meeting house.',
   'It was first imagined as a restaurant with a bird show. The show became the star.',
   'Opened in 1963, it was the first show to use the park''s new Audio-Animatronics figures: singing birds, flowers and carved poles moving in time with the music.',
   'The early figures were driven by signals recorded on tape, so sound and movement stayed in sync for dozens of performers at once.',
   'https://en.wikipedia.org/wiki/Walt_Disney%27s_Enchanted_Tiki_Room'),
  ('jungle-river', 'dlp-adventureland', 2,
   'The Jungle River', 'A world tour on one river.',
   'Plants from different continents growing side by side on the riverbank.',
   'The jungle was planted from scratch on former farmland, mixing tropical-looking plants that could survive Southern California.',
   'Skippers steer past rivers of Asia, Africa and South America in a single trip, and the jokes have been part of the show for decades.',
   'One of the park''s opening-day attractions in 1955, designed by art director Harper Goff.',
   'The boats follow an underwater guide rail. The skipper controls the speed, not the steering.',
   'https://en.wikipedia.org/wiki/Jungle_Cruise'),
  ('treehouse-tree', 'dlp-adventureland', 3,
   'The Treehouse Tree', 'A tree that never grew.',
   'The bamboo bucket waterwheel at the base of the tree.',
   null,
   'Imagineers gave the tree a playful scientific name meaning "large ever-blooming Disney tree."',
   'A treehouse first opened here in 1962. It has been redressed for new stories over the years and reopened as the Adventureland Treehouse in 2023.',
   'The tree is entirely man-made: concrete roots, steel limbs coated in concrete, and leaves attached by hand.',
   'https://d23.com/a-to-z/swiss-family-treehouse/'),
  ('jungle-temple', 'dlp-adventureland', 4,
   'The Jungle Temple', 'Don''t pull the rope.',
   'Writing in a made-up alphabet carved along the queue walls.',
   'Crumbling stone, collapsed beams and rope bridges were sculpted to look centuries old.',
   'The queue is a story you walk through: an archaeologist''s dig, cryptic warnings and an ancient language you can decode.',
   'The attraction opened in 1995.',
   'The ride vehicles are motion simulators on wheels: the body tilts and bucks on its own while the chassis travels the track.',
   'https://en.wikipedia.org/wiki/Indiana_Jones_Adventure'),

  -- New Orleans Square
  ('new-orleans-square-land', 'dlp-new-orleans-square', 1,
   'A Land of Its Own', 'The first new land added to the park.',
   'Iron-lace balconies, hidden courtyards and hanging ferns.',
   'Narrow streets, courtyards and wrought-iron balconies were scaled to feel intimate, inspired by the French Quarter of the mid-1800s.',
   'Walt dedicated the land alongside the mayor of New Orleans.',
   'New Orleans Square opened in 1966, the first new land since the park opened, and the last opening Walt attended.',
   null,
   'https://en.wikipedia.org/wiki/New_Orleans_Square'),
  ('pirate-bayou', 'dlp-new-orleans-square', 2,
   'The Pirate Ride''s Bayou', 'A restaurant inside a ride.',
   'Diners at candlelit tables beside the water as boats drift past.',
   'The huge show building hides behind New Orleans facades. Boats drop down and travel under the train tracks to reach it.',
   'A restaurant sits inside the ride''s bayou, where it is always a warm evening and fireflies glow.',
   'Opened in 1967, it was the last attraction Walt personally worked on; he passed away a few months before it opened.',
   'Boats float through a long flume and plunge down two waterfalls to reach the show below.',
   'https://en.wikipedia.org/wiki/Pirates_of_the_Caribbean_(attraction)'),
  ('mansion-on-the-hill', 'dlp-new-orleans-square', 3,
   'The Mansion on the Hill', 'Finished in 1963, haunted in 1969.',
   'The tidy white columns and neat gardens — this haunted house is kept spotless outside.',
   'The antebellum-style exterior was inspired by an 1803 house near Baltimore. It was finished in 1963 but stood empty for six years.',
   'The designers kept the outside pristine and let the ghosts do the scaring inside.',
   'The attraction finally opened in 1969.',
   'The famous stretching room is actually an elevator. It carries guests below the train tracks to a show building outside the berm.',
   'https://theunofficialguides.com/2022/03/10/disneylands-haunted-mansion-the-history-the-ride-and-13-fun-facts/'),
  ('dream-suite', 'dlp-new-orleans-square', 4,
   'The Dream Suite', 'An apartment no one moved into.',
   'The WD and RD initials curled into a balcony railing above the pirate ride.',
   'Its balconies use the same cast-iron lace as the rest of the land.',
   'The rooms have had many lives since, including an art gallery and a one-of-a-kind guest suite.',
   'Walt planned a larger apartment here for his family, but he passed away before it was finished.',
   null,
   'https://d23.com/find-these-9-disney-details-down-in-new-orleans-square/'),

  -- Bayou Country
  ('bears-to-bayou', 'dlp-bayou-country', 1,
   'From Bears to Bayou', 'One corner, three names.',
   'Rustic cabins with wide porches along the water.',
   'Rough-hewn wood, tin roofs and porches give it the feel of a small backwoods settlement.',
   'Each new name brought a new story, but the sleepy riverside mood stayed.',
   'This corner opened in 1972 as Bear Country, became Critter Country in 1988, and was renamed Bayou Country in 2024.',
   null,
   'https://laughingplace.com/w/?p=2165295'),
  ('log-flume-hill', 'dlp-bayou-country', 2,
   'The Log Flume Hill', 'A mountain made for splashing.',
   'Logs pausing at the top of the hill before the big drop.',
   'The hill is sculpted rockwork over a steel frame, planted so it looks like it has always been there.',
   null,
   'A log flume ride opened here in 1989 and was reimagined with a new story in 2024.',
   'Logs float in a water channel and ride conveyor lifts up the hill before gravity takes over on the drops.',
   'https://en.wikipedia.org/wiki/Tiana%27s_Bayou_Adventure'),
  ('explorer-canoes', 'dlp-bayou-country', 3,
   'The Explorer Canoes', 'The only ride you power yourself.',
   'Guests paddling in time with the guide at the back of the canoe.',
   null,
   'A guide steers from the back and calls the strokes; everyone else paddles.',
   'Guests have paddled canoes around the river since 1956.',
   'There is no track and no motor: the canoes go exactly as fast as their crews paddle.',
   'https://en.wikipedia.org/wiki/Davy_Crockett%27s_Explorer_Canoes'),
  ('riverside-restaurant', 'dlp-bayou-country', 4,
   'The Riverside Restaurant', 'Two decks over the water.',
   'The lower deck right at the water''s edge.',
   'Built into the riverbank on two levels, with wide porches looking out over the water.',
   'Diners can watch the riverboat and the tall ship drift past.',
   'A hearty country restaurant has served here since 1977.',
   null,
   'https://laughingplace.com/w/?p=2165295'),

  -- Frontierland
  ('the-riverboat', 'dlp-frontierland', 1,
   'The Riverboat', 'A steamboat built for a park.',
   'The paddle wheel churning at the stern.',
   'Gingerbread trim, twin smokestacks and a wheelhouse up top echo the steamboats of the Mississippi in the 1800s.',
   null,
   'The riverboat has sailed since opening day in 1955.',
   'Like the river''s other boats, it follows a hidden underwater rail while the crew controls the speed and the whistle.',
   'https://en.wikipedia.org/wiki/Mark_Twain_Riverboat'),
  ('the-tall-ship', 'dlp-frontierland', 2,
   'The Tall Ship', 'A replica with a record.',
   'The cramped crew quarters below deck.',
   null,
   'Below deck, a small museum shows how sailors lived on a voyage of three years.',
   'Launched here in 1958, it is a full-size replica of the first American ship to sail around the world, between 1787 and 1790.',
   'It travels the river on the same kind of hidden underwater rail as the riverboat.',
   'https://en.wikipedia.org/wiki/Sailing_Ship_Columbia'),
  ('red-rock-mountain', 'dlp-frontierland', 3,
   'The Red-Rock Mountain', 'Rocks you''d swear were real.',
   'Antique mining equipment scattered around the little town and the queue.',
   'Its spires were modeled on the hoodoos and buttes of the American Southwest.',
   'The town of Rainbow Ridge at its foot was kept from an earlier train ride through the desert.',
   'The mine train coaster opened in 1979.',
   'Behind the rockwork, a steel coaster track winds through and around the mountain.',
   'https://en.wikipedia.org/wiki/Big_Thunder_Mountain_Railroad'),
  ('saloon-stage', 'dlp-frontierland', 4,
   'The Saloon Stage', 'A show with a record run.',
   'The box seats on either side of the stage.',
   'Gilded trim, a horseshoe-shaped balcony and a polished bar recreate a grand Old West music hall.',
   'Walt is said to have had a favorite box seat close to the stage.',
   'The saloon opened in 1955, and its original show ran for decades, earning a place among the longest-running stage shows anywhere.',
   null,
   'https://en.wikipedia.org/wiki/Golden_Horseshoe_Saloon'),
  ('river-island', 'dlp-frontierland', 5,
   'The River Island', 'An island Walt drew himself.',
   'The rafts that ferry explorers across the river.',
   null,
   'Caves, rope bridges and a fort invite you to explore at your own pace. Pirates moved in for a new look in 2007.',
   'The island opened in 1956. The story goes that Walt sketched its layout himself when the designers were stuck.',
   null,
   'https://en.wikipedia.org/wiki/Tom_Sawyer_Island'),

  -- Galaxy's Edge
  ('outpost-spires', 'dlp-galaxys-edge', 1,
   'The Stone Spires', 'Rockwork with a backstory.',
   'Layers, cracks and stains sculpted into the spires, just like real stone.',
   'The towering spires are sculpted rockwork over steel frames, shaped to look like ancient trunks turned to stone.',
   'In the land''s story, settlers built their village among the spires, and the darkest one gave the outpost its name.',
   'The land opened at this park on May 31, 2019, the largest single expansion in its history.',
   null,
   'https://d23.com/hidden-gems-attention-detail-create-authenticity-star-wars-galaxys-edge/'),
  ('outpost-market', 'dlp-galaxys-edge', 2,
   'The Marketplace', 'Shopping in a far-off bazaar.',
   'Cloth awnings, hanging lanterns and stalls full of curiosities.',
   'Designers drew on real marketplaces around the world: winding lanes, patterned awnings and weathered stone.',
   'Every stall has a proprietor and a backstory, from a creature keeper to a toymaker.',
   null,
   'Hidden speakers and props make the stalls feel busy even when the lanes are quiet.',
   'https://disneyexperiences.com/disneyworld-press/?p=56298'),
  ('full-size-freighter', 'dlp-galaxys-edge', 3,
   'The Full-Size Freighter', 'Parked at the spaceport.',
   'Steam venting from beneath the ship.',
   null,
   'Inside, crews of six take the controls as pilots, gunners and engineers.',
   'It opened with the land in 2019.',
   'The ship is built at full size, so it fills the docking bay just as it would on screen.',
   'https://en.wikipedia.org/wiki/Millennium_Falcon:_Smugglers_Run'),
  ('resistance-base', 'dlp-galaxys-edge', 4,
   'The Resistance Base', 'Several rides in one.',
   'Starfighters parked among the trees near the base.',
   null,
   'Guests join as new recruits, and the adventure keeps changing direction until the very end.',
   'It opened in January 2020, a few months after the rest of the land.',
   'The attraction combines trackless vehicles, a motion simulator and walk-through scenes into one long adventure.',
   'https://en.wikipedia.org/wiki/Star_Wars:_Rise_of_the_Resistance'),

  -- Fantasyland
  ('the-castle', 'dlp-fantasyland', 1,
   'The Castle', 'Smaller than it looks.',
   'The stones getting smaller toward the tops of the towers.',
   'The castle is only about 77 feet tall. Its stones shrink as they rise, a forced-perspective trick that makes it seem far taller.',
   'Designers modeled it on castles of medieval Europe, especially one in Bavaria.',
   'The drawbridge really works. It has been lowered only twice: on opening day in 1955 and when Fantasyland reopened in 1983.',
   null,
   'https://en.wikipedia.org/wiki/Sleeping_Beauty_Castle'),
  ('the-carrousel', 'dlp-fantasyland', 2,
   'The Carrousel', 'Every horse is leaping.',
   'Look for a horse standing still. You won''t find one.',
   null,
   'The carousel Walt bought had other animals too, but he wanted only horses, and only jumping ones. Extra jumpers came from other old carousels.',
   'Walt bought an antique carousel from an amusement park in Toronto for opening day in 1955.',
   'Each horse is hand-carved and hand-painted, and many have their names on the saddle.',
   'https://d23.com/a-to-z/king-arthur-carrousel/'),
  ('small-world-facade', 'dlp-fantasyland', 3,
   'The Clock-Tower Facade', 'From a World''s Fair to here.',
   'The clock that comes alive every quarter hour.',
   'The white-and-gold facade is a collage of stylized landmarks from around the world, in the bold, flat style of artist Mary Blair.',
   null,
   'The boat ride premiered at the 1964–65 New York World''s Fair and moved here in 1966.',
   'Every 15 minutes, machinery inside the clock tower sends a parade of figures out through little doors.',
   'https://en.wikipedia.org/wiki/It%27s_a_Small_World'),
  ('snowy-peak', 'dlp-fantasyland', 4,
   'The Snowy Peak', 'A coaster that changed coasters.',
   'Bobsleds vanishing into the mountain''s ice caves.',
   'It is a 147-foot model of a famous Swiss peak at about 1/100 scale, with forced perspective making the summit seem far away.',
   null,
   'It opened in 1959, along with the monorail and the submarines.',
   'It was the first roller coaster built with tubular steel track, which can bend into tight curves. Coasters everywhere have used the idea since.',
   'https://en.wikipedia.org/wiki/Matterhorn_Bobsleds'),
  ('miniature-canal', 'dlp-fantasyland', 5,
   'The Miniature Canal', 'Tiny villages, real plants.',
   'Little trees trimmed to stay small beside tiny houses.',
   null,
   'Little villages from favorite stories line the banks of a winding canal.',
   'Canal boats first sailed here in 1955; the miniature villages arrived soon after.',
   'Gardeners keep the landscapes in scale by pruning real trees and shrubs into miniature shapes.',
   'https://en.wikipedia.org/wiki/Storybook_Land_Canal_Boats'),

  -- Toontown
  ('no-straight-lines', 'dlp-toontown', 1,
   'A Town Without Straight Lines', 'Even the buildings are bendy.',
   'Doors, windows and rooftops that bulge, lean and wiggle.',
   'Every building was designed as if it were drawn in a cartoon: leaning walls, squashy roofs and hardly a right angle anywhere.',
   null,
   'The town opened in 1993 and reopened in 2023 with more green space and places to play.',
   null,
   'https://d23.com/our-favorite-almost-hidden-gems-from-mickeys-toontown/'),
  ('town-park', 'dlp-toontown', 2,
   'The Town Park', 'Water, grass and play.',
   'The fountain with musical buttons around its base.',
   null,
   'A place to slow down, with a lawn, a fountain and spots for the littlest explorers.',
   'The park was added in the 2023 reimagining, giving the town a green center.',
   'Buttons around the fountain trigger the sounds of different instruments.',
   'https://d23.com/our-favorite-almost-hidden-gems-from-mickeys-toontown/'),
  ('gags-around-town', 'dlp-toontown', 3,
   'Gags Around Town', 'Everything is a joke waiting to happen.',
   'Things to push, lift or open that answer back with a funny sound.',
   null,
   'Mailboxes, crates and doors are rigged with gags, so the town rewards curious hands.',
   null,
   'Hidden sensors and speakers make ordinary-looking props talk back.',
   'https://d23.com/our-favorite-almost-hidden-gems-from-mickeys-toontown/'),
  ('town-depot', 'dlp-toontown', 4,
   'The Town Depot', 'The train''s cartoon stop.',
   'The station''s wobbly roofline next to the real railroad track.',
   'The depot''s playful shapes match the town, even though the trains that stop here are real steam engines.',
   null,
   'The station opened with the town in 1993, giving the park''s railroad a new stop.',
   null,
   'https://en.wikipedia.org/wiki/Disneyland_Railroad'),

  -- Tomorrowland
  ('white-spire', 'dlp-tomorrowland', 1,
   'The White Spire', 'A mountain made of tomorrow.',
   'The ribs running up the spire''s sides.',
   'Its white cone of ribs became a symbol of Tomorrowland.',
   null,
   'The indoor coaster opened here in 1977, two years after a larger version in Florida.',
   'Almost the whole ride happens in the dark, so curves and drops feel sudden. The track is much smaller than it seems.',
   'https://en.wikipedia.org/wiki/Space_Mountain_(Disneyland)'),
  ('the-monorail', 'dlp-tomorrowland', 2,
   'The Monorail', 'A first for the Western Hemisphere.',
   'The concrete beam the train rides on.',
   null,
   'It was meant as a preview of how cities might travel in the future.',
   'When it opened in 1959, it was the first monorail in the Western Hemisphere to run every day.',
   'The trains straddle a single concrete beam, with rubber tires gripping its top and sides.',
   'https://en.wikipedia.org/wiki/Disneyland_Monorail'),
  ('empty-track', 'dlp-tomorrowland', 3,
   'The Empty Track', 'A ride that left its track behind.',
   'The track and old station winding above the walkways.',
   null,
   null,
   'A gentle tour of Tomorrowland ran on this track from 1967 to 1995. After a short-lived ride in the late 1990s, it has stood empty.',
   'Its cars had no motors: spinning tires built into the track pushed them along.',
   'https://en.wikipedia.org/wiki/PeopleMover'),
  ('little-freeway', 'dlp-tomorrowland', 4,
   'The Little Freeway', 'Drive the future of 1955.',
   'The rail down the middle of each lane that keeps cars on course.',
   null,
   'For many kids, it is the first time behind the wheel.',
   'It opened with the park in 1955, when real freeways were brand new.',
   'A center guide rail keeps each car in its lane while the driver handles the gas and steering.',
   'https://en.wikipedia.org/wiki/Autopia'),
  ('rocket-spinner', 'dlp-tomorrowland', 5,
   'The Rocket Spinner', 'Rockets have orbited here since 1956.',
   'The planets turning at the top of the tower.',
   'Its brass-and-copper look comes from a 1998 makeover that imagined the future the way artists of the past saw it.',
   null,
   'Rocket rides have spun in Tomorrowland since 1956. The current one moved to the land''s entrance in 1998.',
   null,
   'https://en.wikipedia.org/wiki/Astro_Orbiter');

-- Link quest spots to the story behind them. (Main Street's spots come from
-- seed.sql, which repeats its links for fresh local databases.)
update public.spots s set landmark_id = l.id
from public.quests q, public.landmarks l,
  (values
    ('walt-was-here', 1, 'firehouse-apartment'), ('walt-was-here', 2, 'firehouse-apartment'),
    ('walt-was-here', 3, 'town-square'), ('windows-of-legends', 1, 'main-street-facades'),
    ('tiki-garden', 1, 'tiki-room'), ('tiki-garden', 2, 'tiki-room'), ('tiki-garden', 3, 'tiki-room'),
    ('jungle-expedition', 2, 'jungle-river'), ('jungle-expedition', 3, 'jungle-temple'),
    ('jungle-expedition', 4, 'treehouse-tree'),
    ('royal-street-secrets', 4, 'dream-suite'), ('royal-street-secrets', 1, 'new-orleans-square-land'),
    ('bayou-bend', 1, 'bears-to-bayou'), ('bayou-bend', 2, 'explorer-canoes'),
    ('bayou-critters', 2, 'riverside-restaurant'), ('bayou-critters', 3, 'log-flume-hill'),
    ('bayou-critters', 4, 'log-flume-hill'),
    ('frontier-fort', 3, 'saloon-stage'),
    ('river-life', 1, 'the-riverboat'), ('river-life', 4, 'the-riverboat'), ('river-life', 2, 'the-tall-ship'),
    ('river-life', 5, 'red-rock-mountain'),
    ('outpost-wanderer', 1, 'outpost-spires'), ('outpost-wanderer', 2, 'outpost-spires'),
    ('docking-bay-days', 1, 'full-size-freighter'),
    ('knights-and-carrousel', 2, 'the-carrousel'), ('knights-and-carrousel', 3, 'the-carrousel'),
    ('knights-and-carrousel', 4, 'snowy-peak'),
    ('clockwork-wonders', 1, 'small-world-facade'), ('clockwork-wonders', 3, 'small-world-facade'),
    ('clockwork-wonders', 4, 'miniature-canal'),
    ('gags-and-gadgets', 1, 'gags-around-town'), ('gags-and-gadgets', 2, 'town-park'),
    ('gags-and-gadgets', 3, 'gags-around-town'), ('gags-and-gadgets', 4, 'town-depot'),
    ('retro-rockets', 1, 'rocket-spinner'), ('retro-rockets', 3, 'empty-track'),
    ('retro-rockets', 4, 'the-monorail'), ('retro-rockets', 5, 'white-spire'),
    ('future-garden', 3, 'little-freeway')
  ) as link(quest_slug, spot_order, landmark_slug)
where q.slug = link.quest_slug and s.quest_id = q.id and s.sort_order = link.spot_order
  and l.slug = link.landmark_slug;
