-- More Quest Pass quests for Disneyland: Hollow Haunts grows to six spots, and
-- two new premium quests: around the island in the river, and all the way
-- around the park by steam train. Same rules as every quest: our own words,
-- not yet checked on site, no GPS pins until the field walk.

-- Hollow Haunts: the weathervane couldn't be confirmed, so spot 2 becomes the
-- stone griffin by the line. Two new spots.
update public.spots s
set teaser = 'A stone guardian',
    title = 'The griffin by the gate',
    where_to_stand = 'Near the start of the line for the mansion, off to the side of the walkway.',
    clue = 'A stone griffin, half eagle and half lion, keeps watch near where the line begins. It looks a lot like the ones guests meet inside.',
    hint = 'Look near the start of the line.',
    prompt = 'Take a photo of the griffin.'
from public.quests q
where q.id = s.quest_id and q.slug = 'hollow-haunts' and s.sort_order = 2;

insert into public.spots
  (quest_id, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method, pause_during_parades, source_url)
select q.id, v.sort_order, v.teaser, v.title, v.where_to_stand, v.clue, v.hint, v.prompt, v.method::public.checkin_method, true, v.source
from public.quests q
join (values
  (5, 'A cat on a birdbath', 'The cat on the tombstone',
   'Near the hearse at the start of the line. Stay with the line.',
   'Behind the hearse, a little tombstone shaped like a birdbath has a stone cat sitting on top. It was one of the newest additions to the grounds.',
   'Look just behind the hearse.', 'Take a photo of the stone cat.', 'photo',
   'https://www.micechat.com/287447-disneylands-haunted-mansion-gets-spirited-updates/'),
  (6, 'A home for a raven', 'The raven''s birdhouse',
   'Along the line for the mansion. Look for a tall, fancy birdhouse.',
   'The mansion''s raven needs a place to live outside, too. Look for a grand little birdhouse built just for it.',
   'Count its floors, from the bottom up.', 'How many stories tall is the birdhouse?', 'answer',
   'https://hauntedmansion.fandom.com/wiki/List_of_Secrets_and_Easter_Eggs_in_the_Haunted_Mansion')
) as v (sort_order, teaser, title, where_to_stand, clue, hint, prompt, method, source) on true
where q.slug = 'hollow-haunts'
on conflict (quest_id, sort_order) do nothing;

insert into public.badges (slug, title, description, art_key) values
  ('island-treasure', 'Treasure Finder', 'Rafted to the island and searched every cove and cave.', 'badge_chest'),
  ('grand-circle', 'Grand Circle Rider', 'Rode the steam train all the way around the park.', 'badge_steam')
on conflict (slug) do nothing;

insert into public.quests (slug, land_id, badge_id, title, story, est_minutes, sort_order, status, is_premium)
values
  ('island-treasure', 'dlp-frontierland', (select id from public.badges where slug = 'island-treasure'),
   'Island of Lost Treasure',
   'A raft carries you to an island in the river, where pirates are said to have hidden their treasure long ago. Walt designed this island himself.',
   40, (select max(sort_order) from public.quests where land_id = 'dlp-frontierland'), 'live', true),
  ('grand-circle', 'dlp-main-street', (select id from public.badges where slug = 'grand-circle'),
   'All Aboard the Grand Circle',
   'Steam trains have circled this park since opening day. Climb aboard for a ride past a canyon and a world of dinosaurs.',
   40, (select max(sort_order) from public.quests where land_id = 'dlp-main-street'), 'live', true)
on conflict (slug) do nothing;

with q as (select id, slug from public.quests)
insert into public.spots
  (quest_id, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method, pause_during_parades, source_url)
select q.id, v.sort_order, v.teaser, v.title, v.where_to_stand, v.clue, v.hint, v.prompt, v.method::public.checkin_method, v.pause, v.source
from (values
  -- Island of Lost Treasure (Frontierland)
  ('island-treasure', 1, 'Cast off!', 'The raft landing',
   'On the island, at the raft landing, once you''re off the raft. Step away from the dock so others can land.',
   'Walt designed this island himself. Days before construction began, he reshaped the plans at home, drawing in the coves and caves.',
   null, 'Take a photo from the raft landing.', 'photo', false,
   'https://disneyland.disney.go.com/attractions/disneyland/pirates-lair-on-tom-sawyer-island/'),
  ('island-treasure', 2, 'A hidden harbor', 'Smuggler''s Cove',
   'At the cove on the island. Stay on the paths.',
   'Pirates needed a quiet place to hide their boats. Find the island''s smugglers'' cove.',
   null, 'Take a photo of the cove.', 'photo', false,
   'https://disneyland.disney.go.com/attractions/disneyland/pirates-lair-on-tom-sawyer-island/'),
  ('island-treasure', 3, 'Into the dark', 'Dead Man''s Grotto',
   'Inside the grotto, keeping to the path. Walk slowly; it''s dark and narrow.',
   'A winding cave on the island is named for the pirates who never came back out. Listen for what echoes inside.',
   null, 'Listen inside the grotto.', 'listen', false,
   'https://disneyland.disney.go.com/attractions/disneyland/pirates-lair-on-tom-sawyer-island/'),
  ('island-treasure', 4, 'A mast in the city', 'The hidden mast',
   'A high spot on the island looking toward New Orleans Square. Stay on the path; don''t climb on rocks or rails.',
   'From a few high spots on the island, you can see a ship''s mast rising above the rooftops across the river. From the square itself, you''d never know it was there.',
   'Look across the river toward the rooftops of the square.', 'Take a photo of the mast.', 'photo', false,
   'https://www.disneytouristblog.com/disneyland-secrets'),
  ('island-treasure', 5, 'X marks the spot', 'The pirates'' treasure',
   'Anywhere on the island where you find signs of pirate treasure. Stay on the paths.',
   'The story goes that pirates hid a treasure here long ago and never came back for it. Keep your eyes open for chests, coins and clues.',
   null, 'Take a photo of a treasure clue.', 'photo', false,
   'https://disneyland.disney.go.com/attractions/disneyland/pirates-lair-on-tom-sawyer-island/'),

  -- All Aboard the Grand Circle (railroad)
  ('grand-circle', 1, 'All aboard!', 'The station above the square',
   'On the train platform of the station above the main square. Stand behind the yellow line.',
   'The main station sits high above the square, so every guest can see the trains from the street. It''s also a favorite spot to watch parades.',
   null, 'Take a photo of the station.', 'photo', true,
   'https://allearsnet.com/dlr/tp/dl/dlrr.htm'),
  ('grand-circle', 2, 'Dots and dashes', 'The telegraph',
   'On the platform of the station near the river square. Stand still and listen.',
   'The telegraph at this station clicks away in Morse code. The message it taps out is the speech given on the park''s opening day in 1955.',
   'Who dedicated the park on opening day?', 'Whose speech does the telegraph tap out?', 'answer', false, null),
  ('grand-circle', 3, 'A canyon on the line', 'The canyon scene',
   'Seated on the train, between the stations near the land of tomorrow and the main square. Stay seated.',
   'Between two stations, the train rolls past a huge painted canyon at sunset, with its plants and animals along the rim.',
   null, 'Seen the canyon? Tap the button when you''re safely seated.', 'listen', false,
   'https://allearsnet.com/dlr/tp/dl/dlrr.htm'),
  ('grand-circle', 4, 'Who''s fighting?', 'The prehistoric world',
   'Seated on the train, right after the canyon. Stay seated.',
   'Next, the train rolls back in time to a world of dinosaurs. A plated stegosaurus is locked in battle with a famous meat-eater, surrounded by lava.',
   'It''s the most famous dinosaur of all, the king of the lizards.', 'Which dinosaur is fighting the stegosaurus?', 'answer', false,
   'https://allearsnet.com/dlr/tp/dl/dlrr.htm'),
  ('grand-circle', 5, 'Born at a fair', 'Where the dinosaurs came from',
   'Anywhere after your ride. Think back on the dinosaurs.',
   'These dinosaurs were first built for a car company''s ride at a World''s Fair in 1964 and 1965 before they moved here.',
   'It''s the biggest city on the East Coast.', 'Which city held that World''s Fair?', 'answer', false,
   'https://allearsnet.com/dlr/tp/dl/dlrr.htm')
) as v (slug, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method, pause, source)
join q on q.slug = v.slug
on conflict (quest_id, sort_order) do nothing;

insert into private.spot_answers (spot_id, accepted)
select s.id, a.accepted
from public.spots s
join public.quests q on q.id = s.quest_id
join (values
  ('hollow-haunts', 6, array['3', 'three', 'three stories', '3 stories', 'three story', '3 story']),
  ('grand-circle', 2, array['Walt', 'Walt Disney', 'Walt Disney''s', 'Disney', 'Walts']),
  ('grand-circle', 4, array['Tyrannosaurus', 'Tyrannosaurus rex', 'T rex', 'T-rex', 'Trex', 'Rex', 'a T rex', 'T. rex']),
  ('grand-circle', 5, array['New York', 'New York City', 'NYC', 'NY', 'Queens', 'Flushing Meadows'])
) as a(quest_slug, sort_order, accepted)
  on a.quest_slug = q.slug and a.sort_order = s.sort_order
on conflict (spot_id) do nothing;
