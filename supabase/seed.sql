-- Once Upon a Quest — Phase 1 pilot content: Main Street, U.S.A. (Disneyland Park)
-- 4 quests, 20 spots. All spots start verified_on_site = false and with no GPS pin.
-- After the field walk: set lat/lng, upload hint photos, confirm answers, set verified_on_site = true.
-- Clues are written in our own words. source_url is for internal reference only; never show it in the app.

insert into public.parks (id, name, resort) values
  ('disneyland-park', 'Disneyland Park', 'Disneyland Resort')
on conflict (id) do nothing;

insert into public.lands (id, park_id, name, sort_order) values
  ('dlp-main-street', 'disneyland-park', 'Main Street, U.S.A.', 1)
on conflict (id) do nothing;

insert into public.badges (slug, title, description, art_key) values
  ('windows-of-legends', 'Window Watcher',   'Found every name on the windows of legends.', 'badge_window'),
  ('walt-was-here',      'Lamplighter',      'Found every trace of the street''s founder.',  'badge_lamp'),
  ('ears-everywhere',    'Sharp Eyes',       'Spotted every hidden ear shape on the street.', 'badge_magnifier'),
  ('main-street-senses', 'All Five Senses',  'Heard, smelled, mailed and tasted the street.', 'badge_envelope')
on conflict (slug) do nothing;

insert into public.quests (slug, land_id, badge_id, title, story, est_minutes, sort_order, status) values
  ('windows-of-legends', 'dlp-main-street', (select id from public.badges where slug = 'windows-of-legends'),
   'Windows of Legends',
   'The names painted on the upper windows aren''t shopkeepers. They belong to the people who built this place. Find them.',
   20, 1, 'live'),
  ('walt-was-here', 'dlp-main-street', (select id from public.badges where slug = 'walt-was-here'),
   'Walt Was Here',
   'The founder spent nights on this street. He left clues behind: a light, a wagon, a wall of mismatched bricks.',
   15, 2, 'live'),
  ('ears-everywhere', 'dlp-main-street', (select id from public.badges where slug = 'ears-everywhere'),
   'Ears Everywhere',
   'Three circles. A big one and two small ones. Once you see them, you can''t stop seeing them.',
   15, 3, 'live'),
  ('main-street-senses', 'dlp-main-street', (select id from public.badges where slug = 'main-street-senses'),
   'Main Street Senses',
   'This street was built to be heard, smelled and tasted, not just seen. Use everything you''ve got.',
   20, 4, 'live')
on conflict (slug) do nothing;

-- Spots ------------------------------------------------------------------------
with q as (select id, slug from public.quests)
insert into public.spots
  (quest_id, sort_order, teaser, title, where_to_stand, clue, hint, prompt, method,
   pause_during_parades, holiday_note, source_url)
values
  -- Windows of Legends
  ((select id from q where slug = 'windows-of-legends'), 1,
   'A father''s window', 'Elias Disney window',
   'Sidewalk across from the Emporium, looking up at its upper windows.',
   'The founder''s father has a window above the biggest shop on the street.',
   'Look above the Emporium, not the shops beside it.',
   'What was his first name?', 'answer', true, null,
   'https://mouseplanet.com/the-tribute-windows-and-other-salutes-to-disney-legends-at-disneyland/6883'),
  ((select id from q where slug = 'windows-of-legends'), 2,
   'The founder''s own window', 'Walt''s window',
   'Sidewalk facing Main Street Cinema.',
   'The man who built the park has his own window above the little movie house.',
   'The cinema is near the Town Square end of the street.',
   'Take a photo of his window.', 'photo', true, null,
   'https://mouseplanet.com/the-tribute-windows-and-other-salutes-to-disney-legends-at-disneyland/6883'),
  ((select id from q where slug = 'windows-of-legends'), 3,
   'Two makers of magic', 'Broggie and Baxter windows',
   'Sidewalk facing the Main Street Magic Shop, across from the Emporium.',
   'Two park builders, one from the early days and one from later years, share windows above the shop that sells tricks.',
   'One of them is often called the first Imagineer.',
   'Name either of them (last name is enough).', 'answer', true, null,
   'https://mouseplanet.com/the-tribute-windows-and-other-salutes-to-disney-legends-at-disneyland/6883'),
  ((select id from q where slug = 'windows-of-legends'), 4,
   'A door, not a window', 'Sherman Brothers door',
   'Sidewalk between the Magic Shop and the Cinema. Step aside after you look.',
   'Two brothers who wrote famous songs are honored on a door instead of a window.',
   'It''s styled as an old music business.',
   'What business name is on the door?', 'answer', false, null,
   'https://mouseplanet.com/the-tribute-windows-and-other-salutes-to-disney-legends-at-disneyland/6883'),
  ((select id from q where slug = 'windows-of-legends'), 5,
   'The animators'' windows', 'Marc and Alice Davis windows',
   'Sidewalk facing the Disneyana shop.',
   'A legendary animator and a costume designer, husband and wife, sit side by side above a collectibles shop.',
   null,
   'Take a photo of their windows.', 'photo', true, null,
   'https://mouseplanet.com/the-tribute-windows-and-other-salutes-to-disney-legends-at-disneyland/6883'),
  ((select id from q where slug = 'windows-of-legends'), 6,
   'Before the park, a grove', 'Ron Dominguez window',
   'Sidewalk facing Market House.',
   'This man was born on the land the park now stands on. His window jokes about what grew here first.',
   'Think citrus.',
   'What kind of grove does the window mention?', 'answer', true, null,
   'https://mouseplanet.com/the-tribute-windows-and-other-salutes-to-disney-legends-at-disneyland/6883'),
  ((select id from q where slug = 'windows-of-legends'), 7,
   'A first-ever pair', 'Leota Toombs and Kim Irvine window',
   'Sidewalk facing Crystal Arts.',
   'One of the newest windows honors two people at once, a first for this street.',
   'They are family.',
   'They''re the street''s first window for a ___ and ___ pair.', 'answer', true, null,
   'https://www.kennythepirate.com/2026/04/24/disney-installs-something-new-and-special-on-main-street/'),

  -- Walt Was Here
  ((select id from q where slug = 'walt-was-here'), 1,
   'A light that never goes out', 'Walt''s lamp',
   'Town Square, facing the Fire Station.',
   'The founder kept an apartment upstairs. When his lamp was on, everyone knew he was here. It''s still lit.',
   'Look at the upstairs window of the Fire Station.',
   'Take a photo of the lit window. Bonus: come back after dark.', 'photo', false,
   'During the holidays a lit Christmas tree takes the lamp''s place. Photograph the tree instead.',
   'https://disneyparks.disney.go.com/blog/2018/12/a-walk-in-the-park-walking-in-walts-footsteps-at-disneyland-park/'),
  ((select id from q where slug = 'walt-was-here'), 2,
   'Retired from duty', 'Horse-drawn fire wagon',
   'Inside the Fire Station.',
   'An old fire wagon once carried guests up and down the street. Now it rests downstairs.',
   'Read the signs near it.',
   'What year did it stop giving rides?', 'answer', false, null,
   'https://wdwnt.com/?p=1052783'),
  ((select id from q where slug = 'walt-was-here'), 3,
   'Guarding the square', 'Town Square cannons',
   'Town Square. Confirm exact spot on the field walk.',
   'A pair of old cannons has stood watch over the square since opening year.',
   null,
   'Take a photo of the cannons.', 'photo', false, null,
   'https://duchessofdisneyland.com/tag/hidden-gems/page/7/'),
  ((select id from q where slug = 'walt-was-here'), 4,
   'A wall that doesn''t match', 'Test-brick wall',
   'Near the Main Street lockers.',
   'Every brick in this wall is a little different, as if someone was trying them out.',
   null,
   'Take a photo of the wall.', 'photo', false, null,
   'https://mickeyvisit.com/hidden-disney-secrets-plain-sight-october-24-2025/'),
  ((select id from q where slug = 'walt-was-here'), 5,
   'One bulb, two colors', 'Half-and-half bulb',
   'Entrance of the Refreshment Corner. Look up.',
   'The row of bulbs had an odd number, so the founder had one painted to keep the pattern.',
   'Look along the edge of the awning.',
   'Which two colors is that bulb painted?', 'answer', false, null,
   'https://mickeyvisit.com/hidden-disney-secrets-plain-sight-october-24-2025/'),

  -- Ears Everywhere
  ((select id from q where slug = 'ears-everywhere'), 1,
   'The first one is easy', 'Floral welcome',
   'Entrance plaza, facing the train station.',
   'The very first one is made of flowers, and it''s not hidden at all.',
   null,
   'Take a photo of it.', 'photo', false, null,
   'https://mickeyvisit.com/hidden-mickeys-disneyland/'),
  ((select id from q where slug = 'ears-everywhere'), 2,
   'Windows with a face', 'Window profile',
   'Sidewalk facing Main Street Cinema, looking up.',
   'Some windows above the movie house line up into a familiar profile.',
   null,
   'Take a photo of it.', 'photo', true, null,
   'https://www.parksavers.com/hidden-mickey-hunting-a-complete-history-and-spotting-guide-for-disneyland/'),
  ((select id from q where slug = 'ears-everywhere'), 3,
   'On the stairs', 'Cinema stair post',
   'Inside Main Street Cinema, by the steps to the small stage.',
   'Look closely at the stairs leading to the little stage. Bonus: a duck is hiding here too.',
   'Check the post.',
   'Take a photo of it.', 'photo', false, null,
   'https://mickeyvisit.com/hidden-mickeys-disneyland/'),
  ((select id from q where slug = 'ears-everywhere'), 4,
   'Pick a card', 'Playing-card ears',
   'Outside the Magic Shop window. Step aside after your photo.',
   'A magician''s playing card in the window holds a secret shape.',
   null,
   'Take a photo of it.', 'photo', false, null,
   'https://mickeyvisit.com/hidden-mickeys-disneyland/'),

  -- Main Street Senses
  ((select id from q where slug = 'main-street-senses'), 1,
   'Party line', 'Party-line phones',
   'Inside Market House, on the walls.',
   'Old telephones on the wall still have people talking on them. Pick one up and eavesdrop.',
   null,
   'Pick up a phone and listen.', 'listen', false, null,
   'https://mickeyvisit.com/hidden-disney-secrets-plain-sight-october-24-2025/'),
  ((select id from q where slug = 'main-street-senses'), 2,
   'Follow your nose', 'Candy scent',
   'Sidewalk outside the candy shops.',
   'The sweet smell on this block isn''t an accident. Follow it to its source.',
   null,
   'Take a photo of where the smell leads you.', 'photo', false, null,
   'https://mickeyvisit.com/hidden-disney-secrets-plain-sight-october-24-2025/'),
  ((select id from q where slug = 'main-street-senses'), 3,
   'Real mail', 'Working mailbox',
   'Any mailbox along Main Street.',
   'These mailboxes really work. Stamped postcards get sent from right here.',
   null,
   'Mail a stamped postcard and take a photo.', 'photo', false, null,
   'https://mickeyvisit.com/hidden-disney-secrets-plain-sight-october-24-2025/'),
  ((select id from q where slug = 'main-street-senses'), 4,
   'The founder''s favorite', 'Walt''s Chili',
   'Carnation Cafe.',
   'A bowl of chili named for the founder is on the menu here.',
   null,
   'Order it, enjoy it, and stamp your Snack Passport.', 'snack', false, null,
   'https://allears.net/?p=227543')
on conflict (quest_id, sort_order) do nothing;

-- Answer keys (private) -----------------------------------------------------------
-- Matching ignores case, spaces and punctuation.
insert into private.spot_answers (spot_id, accepted)
select s.id, a.accepted
from (values
  ('windows-of-legends', 1, array['Elias', 'Elias Disney']),
  ('windows-of-legends', 3, array['Broggie', 'Roger Broggie', 'Baxter', 'Tony Baxter']),
  ('windows-of-legends', 4, array['20th Century Music Company', 'Twentieth Century Music Company',
                                  '20th Century Music', 'Twentieth Century Music',
                                  '20th Century Music Co', 'Twentieth Century Music Co']),
  ('windows-of-legends', 6, array['Orange', 'Orange grove', 'Oranges']),
  ('windows-of-legends', 7, array['mother and daughter', 'mother daughter', 'mother & daughter']),
  ('walt-was-here',      2, array['1960']),
  ('walt-was-here',      5, array['red and white', 'white and red', 'red white', 'white red', 'red & white'])
) as a(quest_slug, sort_order, accepted)
join public.quests q on q.slug = a.quest_slug
join public.spots s on s.quest_id = q.id and s.sort_order = a.sort_order
on conflict (spot_id) do update set accepted = excluded.accepted;

-- Storybook Lens: link Main Street spots to their stories (the migration does
-- this on databases that already had the seed).
update public.spots s set landmark_id = l.id
from public.quests q, public.landmarks l,
  (values
    ('walt-was-here', 1, 'firehouse-apartment'), ('walt-was-here', 2, 'firehouse-apartment'),
    ('walt-was-here', 3, 'town-square'), ('windows-of-legends', 1, 'main-street-facades')
  ) as link(quest_slug, spot_order, landmark_slug)
where q.slug = link.quest_slug and s.quest_id = q.id and s.sort_order = link.spot_order
  and l.slug = link.landmark_slug;
