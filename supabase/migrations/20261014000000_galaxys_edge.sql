-- Galaxy's Edge: two quests (10 spots), slotted between Frontierland and
-- Fantasyland in walking order.
--
-- Same rules as 20261013000000_more_lands.sql: clues in our own words from
-- public research (source_url is internal only), verified_on_site = false and
-- no GPS pins until the field walk. Shown as "Galaxy's Edge" (plain text
-- describing the location); no film characters, ships or droids are named in
-- titles, and the art is original and generic.

-- Make room in the walking order: lands after Frontierland and their quests move back.
update public.lands set sort_order = sort_order + 1
where park_id = 'disneyland-park' and sort_order >= 6;
update public.quests set sort_order = sort_order + 2
where land_id in ('dlp-fantasyland', 'dlp-toontown', 'dlp-tomorrowland');

insert into public.lands (id, park_id, name, sort_order) values
  ('dlp-galaxys-edge', 'disneyland-park', 'Galaxy''s Edge', 6)
on conflict (id) do nothing;

insert into public.badges (slug, title, description, art_key) values
  ('outpost-wanderer', 'Spire Seeker',  'Wandered the outpost from its stone spires to its secret tracks.', 'badge_spire'),
  ('docking-bay-days', 'Cargo Captain', 'Found the freighter, the numbered crates and the two-color milk.',  'badge_mug')
on conflict (slug) do nothing;

insert into public.quests (slug, land_id, badge_id, title, story, est_minutes, sort_order, status) values
  ('outpost-wanderer', 'dlp-galaxys-edge', (select id from public.badges where slug = 'outpost-wanderer'),
   'Outpost Wanderer',
   'A village at the edge of the galaxy, built among trees that turned to stone. Greet the locals and look closely — even the pavement has a story.',
   20, 13, 'live'),
  ('docking-bay-days', 'dlp-galaxys-edge', (select id from public.badges where slug = 'docking-bay-days'),
   'Docking Bay Days',
   'Ships come and go, cargo piles up and something is always roasting. Explore the busiest corner of the spaceport.',
   20, 14, 'live')
on conflict (slug) do nothing;

with q as (select id, slug from public.quests)
insert into public.spots
  (quest_id, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method,
   pause_during_parades, holiday_note, source_url)
values
  -- Outpost Wanderer
  ((select id from q where slug = 'outpost-wanderer'), 1,
   'Trees of stone', 'The petrified spires',
   'Any walkway in Galaxy''s Edge with a clear view of the tall rock spires.',
   'The towering spires around this village are the trunks of ancient trees that turned to stone long ago. The first settlers built their homes among them.',
   null,
   'Take a photo of the spires.', 'photo', false, null,
   'https://kennythepirate.com/2018/05/31/galaxys-edge-welcome-to-black-spire-outpost'),
  ((select id from q where slug = 'outpost-wanderer'), 2,
   'The darkest trunk', 'The black spire',
   'Walkway near the center of the village, out of the way of shop doors.',
   'One petrified trunk at the heart of the village is darker than all the rest, and the whole outpost is named after it.',
   'Look for the darkest stone trunk near the middle of the village.',
   'What is the outpost named after?', 'answer', false, null,
   'https://d23.com/hidden-gems-attention-detail-create-authenticity-star-wars-galaxys-edge/'),
  ((select id from q where slug = 'outpost-wanderer'), 3,
   'Say hello like a local', 'The local greeting',
   'Anywhere in the marketplace — listen to how the villagers greet travelers.',
   'The people who work here greet travelers with a sunny local hello by day, and a different one once the moons come out.',
   'It''s two words, and the second one is about what''s in the sky by day.',
   'Type the daytime greeting.', 'answer', false, null,
   'https://wdwnt.com/2019/05/a-guide-to-the-vocabulary-of-batuu-at-star-wars-galaxys-edge'),
  ((select id from q where slug = 'outpost-wanderer'), 4,
   'Tracks in the pavement', 'The little wheel tracks',
   'Walkway near the droid workshop, off to the side so others can pass.',
   'Before the pavement here dried, a little cart with special wheels was rolled through it. Its tracks are still there, as if a small robot just trundled by.',
   'Look down at the walkway near the workshop that builds little robots.',
   'Take a photo of the tracks.', 'photo', false, null,
   'https://spectrumnews1.com/ca/la/entertainment/2019/05/30/star-wars--galaxy-s-edge-easter-eggs-to-look-for-at-disneyland'),
  ((select id from q where slug = 'outpost-wanderer'), 5,
   'Something in the water', 'The creature in the fountain tank',
   'Beside one of the village drinking fountains — let others get a drink.',
   'At one of the drinking fountains, a tank above the water hides a creature that peeks out with a single eye on a stalk.',
   'Check the tanks above the drinking fountains.',
   'Take a photo of the creature.', 'photo', false, null,
   'https://kutv.com/news/local/what-hidden-easter-eggs-to-look-for-when-visiting-disneys-star-wars-galaxys-edge'),

  -- Docking Bay Days
  ((select id from q where slug = 'docking-bay-days'), 1,
   'A famous freighter', 'The freighter in the docking bay',
   'The open viewing area outside Millennium Falcon: Smugglers Run, away from the queue entrance.',
   'A battered old freighter is parked right here in the spaceport, steam drifting around its hull.',
   null,
   'Take a photo of the freighter.', 'photo', false, null,
   'https://disneyexperiences.com/disneyworld-press/?p=56298'),
  ((select id from q where slug = 'docking-bay-days'), 2,
   'Numbered cargo', 'The cargo containers',
   'Walkway outside Docking Bay 7 Food and Cargo — look up.',
   'Three cargo containers stacked above the food hall each carry a two-digit number. Fans say the numbers are years.',
   'Look above the food hall''s entrance.',
   'Type the number on any one of the containers.', 'answer', false, null,
   'https://kutv.com/news/local/what-hidden-easter-eggs-to-look-for-when-visiting-disneys-star-wars-galaxys-edge'),
  ((select id from q where slug = 'docking-bay-days'), 3,
   'Cooked by an engine', 'The roaster''s engine',
   'Walkway in front of Ronto Roasters, out of the line.',
   'The grill at this stall is heated by a racing engine hanging from the ceiling, and an old smelting robot turns the spit.',
   'Look up above the grill.',
   'Take a photo of the engine.', 'photo', false, null,
   'https://www.wdwinfo.com/?p=84835'),
  ((select id from q where slug = 'docking-bay-days'), 4,
   'A two-color treat', 'The milk stand',
   'Walkway near the Milk Stand, out of the line.',
   'A little stand here sells frosty milk in two colors you won''t find on any farm.',
   'Read the stand''s menu.',
   'Name a color of milk on the menu.', 'answer', false, null,
   'https://www.disneyfoodblog.com/2019/05/29/were-live-at-star-wars-galaxys-edge-in-disneyland/'),
  ((select id from q where slug = 'docking-bay-days'), 5,
   'Spaceport snack', 'The popcorn kettle',
   'In line at Kat Saka''s Kettle.',
   'A kettle stall in the marketplace pops a sweet-and-savory snack for hungry travelers.',
   null,
   'Treat yourself at the kettle stall.', 'snack', false, null,
   'https://orlandoinformer.com/disney/kat-sakas-kettle/');

insert into private.spot_answers (spot_id, accepted)
select s.id, a.accepted
from public.spots s
join public.quests q on q.id = s.quest_id
join (values
  ('outpost-wanderer', 2, array['Black Spire', 'The Black Spire', 'Black Spire Outpost', 'a black spire', 'the black spire tree']),
  ('outpost-wanderer', 3, array['Bright suns', 'Bright sun', 'Bright suns traveler']),
  ('docking-bay-days', 2, array['77', '80', '83', '1977', '1980', '1983', '77 80 83']),
  ('docking-bay-days', 4, array['Blue', 'Green', 'Blue and green', 'Green and blue', 'Blue milk', 'Green milk'])
) as a(quest_slug, sort_order, accepted)
  on a.quest_slug = q.slug and a.sort_order = s.sort_order
on conflict (spot_id) do nothing;
