# Once Upon a Quest — come back later

The single list of everything still open before the app goes public. Items marked **(code)** need more building; Claude can do those. Everything else needs you, a visit to the park, or your attorney.

_Last updated: October 15, 2026_

---

## 1. Field walk (in the park)

The walk happens on cellular, so use the **hosted** database (pins and photos land in the real project). `covington.brock@gmail.com` is already an admin on both local and hosted (`npm run admin:add -- email` adds others). Each spot screen shows a dashed **Field tools** panel; each quest screen has **Take cover photo**.

- [ ] Pick how the app reaches your phone on cellular:
  - **Option A — "field" build (recommended; needs the Apple Developer Program):** `npm run build:field`, install it on your iPhone from the EAS link. Standalone, no Mac needed.
  - **Option B — free, Mac stays home:** `npm run db:use-hosted`, then `caffeinate -dis npx expo start --tunnel --clear`; open it in Expo Go before you leave. Works on cellular while the Mac stays awake and online.
- [ ] Sign in on the hosted database before you leave home: in the app enter your email and tap **Send my code**, then on the Mac run `npm run auth:code -- covington.brock@gmail.com` and type the code it prints (valid 1 hour). You'll finish onboarding once; the sign-in then lasts the whole walk.
- [ ] Open **Profile → Field walk (0 of 93 done)** — the checklist shows every spot's Pin / Photo / Verified status; tap a spot to open it, and turn on "Show only unfinished" as you go.
- [ ] At each of the 93 spots (20 on Main Street, 73 across the eight other lands — plan several visits), stand where a guest should stand, then:
  - [ ] **Set pin here** (it refuses GPS fixes worse than 25 m — step into open sky and retry)
  - [ ] **Take hint photo** (replaces the storybook placeholder)
  - [ ] Confirm the answer, the cannon count and candy shop names — fix anything on the spot with **Edit text & answers** (clue, hint, where to stand, accepted answers, parade flag, radius). Every edit is logged so it can be undone.
  - [ ] **Mark verified**
- [ ] On each of the 20 quest screens: **Take cover photo** (and **Edit title & story** if needed) (replaces the storybook scene on the card and quest page)
- [ ] After pinning a few spots, open the **Map** tab, tap **Main Street, U.S.A.** and zoom in: stamps should sit on the right side of the street. Main Street now uses the same to-scale park map as every other land, so pinned spots land where you stood.
- [ ] The whole-park map is drawn to scale from OpenStreetMap, so pins should land exactly where you stood. If a land has been rebuilt since the map data was last refreshed, run `node scripts/build-park-map.mjs --refresh` (downloads fresh OpenStreetMap data and regenerates `src/art/parkGeo.ts`), check the map, and publish an update.
- [ ] **New lands (added Oct 13, 2026) are live but tagged "Being verified on site."** They were written from public research, so check these first:
  - Typed answers: Jungle Cruise boat names; the tiki figures' names (spellings vary — add any you hear); the Orleans St / Royal St sign; the number on the green door (33); the WD/RD balcony initials; the year in the riverfront brick wall (1764); the petrified tree plaque (September 1957); the riverboat and sailing ship names; the carrousel lead horse (Jingles).
  - Things that may have moved or changed: the edible plants and blue eggs in Tomorrowland planters, the keelboat by the river, the bear tributes in Bayou Country, Toontown's crates, fountain, mailboxes and fire station window, the 21 Royal Street address.
  - Parade flags: only the clock-tower lawn spots in Fantasyland pause in Parade mode. Flag any others that sit on the parade route.
  - The "Being verified" tag on a quest goes away by itself once every spot in it is **Mark verified**.
- [ ] **California Adventure (added Oct 16, 2026)** — 16 free quests (2 per land) and 2 Quest Pass quests (Lost Lands of the Park, Pier Lights), 72 spots, all marked "not yet checked in person". Pin, photograph and verify each one in Profile → Field walk like the Disneyland spots. Facts to double-check first: the newspaper and Laugh-O-Gram sticker on the storytellers statue, the 2037 time capsule, the eight-sided tower, the "Miles" graffiti, the squid sign behind the bakery tour, the Condor Gas pumps, the Bountiful Valley Farm bottles, and which snack stands are open (hot dog, fruit market, smoothie, chicken bucket, corn dog, smokejumpers' grill). Snack spots name stands generically; update them if names change.
- [ ] **New Disneyland Quest Pass quests (Oct 16, 2026)** — Hollow Haunts now has 6 spots (the unconfirmed weathervane was replaced with the stone griffin; new: the stone cat on the birdbath tombstone and the raven's three-story birdhouse). Island of Lost Treasure (Tom Sawyer Island; closes at dusk) and All Aboard the Grand Circle (the railroad: telegraph at the New Orleans Square station, the canyon and dinosaur scenes, seated only). Verify on site.
- [ ] **Storybook Lens landmarks (added Oct 15, 2026)** — 40 landmarks, listed under the quests in **Profile → Field walk**. At each one: **Set pin here** where a guest would stand to look at it (the Lens shows a landmark once you're within 500 m, and stamping needs you within its radius, 60 m by default), **Take landmark photo**, read the Look for… line and each layer, fix anything with **Edit story text**, then **Mark verified**. Facts to double-check first: Main Street's antique locomotive dates, the 77-foot castle and its two drawbridge lowerings, the 147-foot snowy peak, the 1977 restaurant date in Bayou Country, and the island and box-seat stories (marked "the story goes" / "is said to").
- [ ] Try the Lens in Point mode once a few landmarks in a land are pinned: cards should float over the right landmark as you turn. If they lean left or right, check the phone's compass calibration first.
- [ ] **Galaxy's Edge (added Oct 14, 2026)**, same "Being verified" status. Check the typed answers: the outpost's name (the darkest spire → "Black Spire"), the daytime greeting ("Bright suns" — cast members may vary), the three container numbers above the food hall (77, 80, 83), and the two milk colors. Also confirm the wheel tracks near the droid workshop and the creature in the drinking-fountain tank are still there.
- [ ] Note: once a spot has a pin, check-ins there require being on site — test at-home check-ins on unpinned spots.

## 2. Domain, email and web pages (after you buy the domain)

- [ ] Buy the domain (e.g. `onceuponaquest.app`).
- [ ] Set up a custom SMTP sender (e.g. Resend) for the hosted Supabase project → Authentication → Emails → SMTP Settings. The free built-in sender only reaches your Supabase team's emails and blocks custom templates.
- [ ] Then set **Confirm signup** and **Magic Link** templates to `supabase/templates/otp-code.html` (subject "Your Once Upon a Quest code"). It shows the 6-digit `{{ .Token }}`.
- [ ] Host the Terms and Privacy Policy on the domain (`npm run legal:export` writes `docs/legal/TERMS.md` and `docs/legal/PRIVACY.md`). Both app stores require a privacy policy URL.
- [ ] Optional: switch the feedback/contact address from `higherthinkingconsulting@gmail.com` to a domain address — change `feedbackEmail` in `src/copy.ts` and `contactEmail` in `src/legal/info.ts`, then re-export.
- [ ] Point the app at hosted: `npm run db:use-hosted`, then `npx expo start --clear`.

## 3. Attorney review (before going public)

- [ ] **Terms of Service** and **Privacy Policy** (`src/legal/terms.ts`, `src/legal/privacy.ts`). Drafted by Claude to match how the app actually works — not legal advice.
- [ ] Confirm the facts in `src/legal/info.ts`: operator legal name (**"Higher Thinking Consulting"** was assumed — add LLC/Inc. if applicable), governing state (**California**), court venue (**Orange County**), effective date.
- [ ] Decide whether to add an arbitration clause / class-action waiver (left out on purpose).
- [ ] App name "Once Upon a Quest" — trademark search.
- [ ] **New logo (Oct 2026)** — a golden keyhole on an open storybook, with fireworks and a wishing star glowing through it (`src/art/logoMark.ts`). Original artwork with no castle, characters or three-circle shapes. Include the mark in the trademark search. To change it, edit `logoMark.ts`, run `node scripts/generate-icons.mjs`, and make a new build (icons and the splash are native).
- [ ] App icon, logo, stamp avatars, badge art and storybook scenes (all original, in `src/art/`).
- [ ] Disclaimer wording (sign-in, About, Terms, store listings).
- [ ] Spot titles naming real people or places, e.g. "Elias Disney window", "Walt's window", "Walt's lamp", "The Dominguez Palm", "Jingles", the WD/RD initials. Attraction and land names appear only as plain text describing locations (e.g. "Jungle Cruise boat names", "Toontown"). The land is shown as "Toontown", leaving the character name out of the app's headings.
- [ ] **Park map data** — the storybook park map is generated from OpenStreetMap (© OpenStreetMap contributors, ODbL). The credit is shown on the map and in About. Confirm the attribution is enough for the store listings too. The castle footprint is drawn as a plain block and the famous freighter as a round landing pad, so no protected silhouettes appear.
- [ ] **Storybook Lens** — the feature is named "Storybook Lens" because "Imagineer" is a Disney trademark. Its 40 landmark stories are written in our own words from public sources (links kept internally in `landmarks.source_url`); they mention real people (Walt Disney, Harper Goff, Mary Blair) and attraction names as plain text. No castle art is drawn — the castle story is text only. The Privacy Policy and Terms were updated for the live camera view, compass, location while the Lens is open, and Lens stamps.
- [ ] **Galaxy's Edge content** — the most sensitive land for IP. The app shows it as "Galaxy's Edge" (no franchise name in headings), names no film characters, ships or droids in titles, and uses only original generic art (no recognizable ships, droids or weapons). Attraction and venue names (e.g. Millennium Falcon: Smugglers Run, Docking Bay 7 Food and Cargo, Ronto Roasters, Kat Saka's Kettle) appear only in "where to stand" text. Ask whether to keep the in-world names "Black Spire" and "Bright suns" as typed answers.
- [ ] **Avatars, wardrobe and story companions (added Oct 15, 2026)** — all original art (`src/art/avatar.ts`, `avatarItems.ts`, `companions.ts`). Wardrobe items have generic names; story items follow the public-domain books, not any film's designs (a yellow Looking-Glass pinafore as in The Nursery Alice, Peter's skeleton-leaf tunic, a gray-tabby Cheshire Cat), with no mouse ears, three-circle shapes or trademarked names (no "Tinker Bell", "Winnie the Pooh", "Spirit Jersey", "Dole Whip", "lightsaber" or "droid"). Companions: Tom Sawyer, Huckleberry Finn, Bagheera, Captain Flint the parrot, Ratty the Water Rat, the Cheshire Cat, Mr. Toad, Captain Nemo, and our own Cog. Quotes are copied from the original texts. Things to ask about: (1) **A. A. Milne's 1926 bear stories are public domain in the US but still under copyright in the UK and EU until January 1, 2027.** The Honey Pot and Honey-Bear Hoodie only mention "a bear of very little brain", but either sell the app only in the US until then or reword those two items. (2) Peter Pan has a special perpetual royalty right in the UK; we use Barrie's novel text (skeleton leaves, fairy wings) only. (3) Wishing Stars are earned only, can't be bought or traded and have no cash value (in the Terms), so they aren't in-app purchases and aren't gambling.
- [ ] **California Adventure content (Oct 16, 2026)** — franchise lands (Avengers Campus, Cars Land, Pixar Pier, San Fransokyo Square) are handled like Galaxy's Edge: land and attraction names only as plain text describing a location; no character or film names in quest titles or badges (clues describe things generically, e.g. "a talking potato-shaped barker", "a big, friendly, puffy robot"); all art (covers, badges, the California Adventure map) is original and generic. Ask about the few clue lines that mention a film-adjacent detail (the shawarma lunch, the squid chef sign, the "Miles" graffiti).
- [ ] **Avatar style (Oct 16, 2026)** — the explorer avatar now uses a general animated-movie look (big eyes, soft shading). It copies no studio's characters; confirm the attorney is comfortable with the style description in the store listing (avoid saying "Disney/Pixar style" anywhere public).
- [ ] **Lantern Keep (Oct 2026)** — our own castle on the Map (`src/art/lanternKeep.ts`): a grand Scottish baronial castle (curtain wall, stout round towers, crow-stepped halls, one lantern tower) in Midnight, Gold and Parchment, with no spires, no star, arc or fireworks near it, and in-app only (never the logo, icon, splash or store screenshots). CLAUDE.md hard rule 2 was updated to allow original castles under these conditions. Confirm the squint test and keep it out of store screenshots.
- [ ] The "Ears Everywhere" quest concept (finding hidden three-circle shapes — described in text only; the app never draws the shape).
- [ ] Menu item names in the Snack Passport (e.g. "Walt's Chili").
- [ ] Store screenshots before submission.

## 3b. Quest Pass and outfit packs: store setup (added Oct 15, 2026)

The app and server are built; nothing can be sold until these are done. Until the RevenueCat keys are set, the Quest Pass screen and packs say "coming soon".

- [ ] **Attorney first:** charging money makes the Disney trademark question more serious (see section 3). Get a yes before turning sales on.
- [ ] **App Store Connect → Agreements, Tax and Banking:** sign the Paid Apps agreement and add bank and tax info. Enroll in the **App Store Small Business Program** (15% fee instead of 30%). In Google Play Console, set up a payments profile (Google charges 15% on the first $1M automatically).
- [ ] **Create the products** with exactly these IDs:
  - App Store: auto-renewable subscriptions `oq_pass_monthly` ($3.99/month) and `oq_pass_yearly` ($24.99/year) in one subscription group "Quest Pass"; a non-renewing subscription `oq_pass_trip_3day` ($4.99); non-consumables `oq_pack_sleepy_hollow` ($1.99), `oq_pack_holiday_lights` ($1.99), `oq_pack_pirate_captain` ($2.99).
  - Google Play: subscription `oq_pass` with base plans `monthly` and `yearly`; one-time products `oq_pass_trip_3day`, `oq_pack_sleepy_hollow`, `oq_pack_holiday_lights`, `oq_pack_pirate_captain`.
- [ ] **RevenueCat** (free account): add the iOS and Android apps and import the products. Make an entitlement `quest_pass` with the three Pass products, and a default offering with packages **Monthly**, **Annual** and a custom package named **`trip`**. Packs need no offering.
- [ ] **RevenueCat → Integrations → Webhooks:** URL `https://fltecwypraoqgksjqrsg.supabase.co/functions/v1/revenuecat-webhook`, Authorization header `Bearer <the webhook secret Claude gave you>`. Send a test event: it should come back with "ignored: unknown user", which means it reached us.
- [ ] **Add the public SDK keys to EAS** (Project → Environment variables, for preview and production): `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (starts `appl_`) and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (starts `goog_`). They're public keys, safe in the app. Then publish an update; the store turns on.
- [ ] **Test with sandbox accounts** (App Store Connect → Users and Access → Sandbox; Play → License testing): buy monthly, cancel, buy the Trip Pass, buy a pack, refund one in RevenueCat, and check that Hollow Haunts unlocks, the gift can be claimed and a refunded pack comes off your explorer.
- [ ] **App Review:** the Quest Pass screen already shows the price and period, auto-renew terms, Terms and Privacy links, and Restore purchases. Add a sandbox login and steps in the review notes. Add the subscription to the App Privacy label (Purchases, linked to the user, not used for tracking).
- [ ] **Content:** Hollow Haunts (4 spots around the mansion in New Orleans Square) is live as the first premium quest, marked "not yet checked in person"; verify it on the field walk like the others. Add one Pass gift item per month in `avatar_items.pass_month` (October to December 2026 are done: lantern, autumn leaf cape, snow globe). Each needs art in `src/art/avatarItems.ts`.

## 4. Required before App Store / Google Play submission

- [ ] Check **Profile → Moderation** at least once a day once real users arrive (Apple expects action on reports within 24 hours). Actions: remove photo, reset name, suspend account, dismiss.
- [ ] **(code, optional)** Email or push alert to you when a new report arrives — needs the custom SMTP from section 2 (or push notifications).
- [ ] Add more words to the username / display-name filter in Supabase → SQL Editor: `insert into private.banned_name_words (word) values ('...');` (seeded with impersonation terms: disney, official, moderator, castmember, onceuponaquest).
- [ ] Enroll in the **Apple Developer Program** (yearly fee) — needed for any iPhone build you install, TestFlight and the App Store.
- [ ] Create a **Google Play Console** account (one-time fee) — needed for Play internal testing and the store. (Android test builds can be installed without it.)
- [ ] First builds — run these in the VS Code terminal, because they ask questions (Apple sign-in, signing keys):
  - `npm run build:dev:android` — development build for Android (works today, no store account needed)
  - `npm run build:dev:ios` — development build for iPhone (needs the Apple Developer Program; registers your phone)
  - `npm run build:preview` — standalone test builds (sign-in needs the hosted email set up first — section 2)
  - `npm run build:production` then `npm run submit:ios` / `npm run submit:android` — store builds
- [ ] Preview and production builds use the **hosted** Supabase project (values stored in EAS, not in the repo). Sign-in there needs the custom SMTP + code templates from section 2.
- [ ] **Google Maps API key for Android** (the real map uses Google Maps on Android; iPhone uses Apple Maps with no key). Create a key in Google Cloud with the Maps SDK for Android enabled, then add it as `android.config.googleMaps.apiKey` in app.json and rebuild.
- [ ] App Store privacy "nutrition label" and Google Play Data safety form: email, user ID, photos, precise location (app functionality only, not stored), user content; no tracking, no ads.
- [ ] Age rating questionnaires (13+, user-generated content, location).

## 5. Check on real phones

- [ ] **Get the app onto testers' phones** (testers use the user1–4 accounts until the custom SMTP from section 2 is set up):
  - **Android:** `npx eas-cli@latest build --profile preview --platform android`, then send testers the install link (an APK; they allow "install unknown apps" once). No Play account needed.
  - **iPhone, a few friends now:** `npx eas-cli@latest device:create`, send each tester the link to register their iPhone (Settings → General → VPN & Device Management → install the profile), then `npx eas-cli@latest build --profile preview --platform ios`, include their devices, and send the install link. Rebuild whenever you add a phone (100 iPhones a year).
  - **iPhone, a bigger group (TestFlight):** `npx eas-cli@latest build --profile production --platform ios`, then `npm run submit:ios`. In App Store Connect → TestFlight, add testers by email. Your own App Store Connect team (up to 100) can install right away; outside testers need a quick Apple beta review first (give the reviewer a tester account and the code). Publish fixes with `npm run update:preview`, or for TestFlight `npm run update:production`.
- [ ] **Tester accounts** user1@ … user4@onceuponaquest.com (on hosted and local) sign in with one shared 6-digit test code instead of an emailed code; the code is kept out of the repo. To change it: `TEST_CODE=<6 digits> node scripts/create-test-accounts.mjs` (add `--local` for the local stack). Before going public, either delete these accounts in Supabase → Authentication → Users or set a new code, and remove `src/lib/testAccounts.ts` if you no longer need it.

- [ ] Before each TestFlight build, run the smoke test on the simulator: `npm run db:start`, `npm run e2e:build` (after app changes), then `npm run e2e`. It signs up a brand-new explorer, onboards, checks in, and visits every tab, then deletes its test accounts.
- [ ] Storybook Lens on a real phone: the camera permission prompt reads well, the live view and brass bezel look right in daylight and at night, Point mode cards follow the compass smoothly, Browse mode works with the camera turned off, and the lens stops the camera when you open a story.
- [ ] **Avatar and Wishing Stars on a real phone:** make an explorer in onboarding, find a spot (+10 stars on the stamp screen), buy and wear an item in Profile → Wardrobe, then check in somewhere while wearing something from that land (+5 "dressed the part"). On the Map, tap the locate button: your explorer should stand where you are and follow you as you walk, and the gold arrow at its feet should point the way you're facing (the Map stops using location and the compass when you leave the tab). Check that friends see your explorer on the leaderboard, and that the story companion's lines read well on each land.
- [ ] Listen to the stamp, badge chime and "saved" sounds on a real phone (with the ringer on); turn Sounds / Vibration off in Profile → Settings and confirm they go quiet.
- [ ] Walkthrough (Profile → How quests work, or the ? on the Quests banner): all 9 pages read well, the animations loop smoothly, nothing overlaps at the largest text size, and with Reduce Motion on each page shows a still final picture.
- [ ] Offline: open each quest once with signal, then turn on Airplane mode — quests, spots, Passport and Friends should still open; check in at a photo spot and a typed-answer spot (both say "Saved for later"); turn Airplane mode off and confirm the "synced" banner, the stamps, and any badge.
- [ ] Largest system text size on every screen (iOS: Settings → Accessibility → Display & Text Size → Larger Text; Android: Font size).
- [ ] VoiceOver (iOS) and TalkBack (Android) through sign-in, a check-in and the Passport.
- [ ] Intro on a real phone (added Oct 15, 2026): the camera should glide smoothly through the keyhole into the night park, and the fireworks shouldn't stutter. Try an older iPhone too. Tapping skips it.
- [ ] Reduce Motion on: the intro should skip the camera move and fireworks, show the night park with the title for a moment, and fade.
- [ ] Intro and sparkle animations feel smooth on an older phone.

## 6. Small decisions you can make any time

- [ ] Look at **Profile → Insights** weekly once testers start: the three spec goals, the funnel, and app errors (fix anything marked Crash).
- [ ] **(code, optional)** Add Sentry if native-level crashes ever show up (the built-in reporting catches JavaScript errors and crashes, which is most of them). Needs a Sentry account; update the Privacy Policy if added.

- [ ] Review the three extra safety tips in `copy.safety.extra` (`src/copy.ts`).
- [ ] Review all wording in `src/copy.ts`.

---

## How to ship changes to installed apps

- **Design, text, screens, logic (JavaScript only):** publish an over-the-air update — no rebuild. Phones download it in the background and use it on the next launch (open the app, close it fully, open it again).
  - Field build: `npm run update:field`
  - Preview / TestFlight-style builds: `npm run update:preview`
  - App Store / Play builds: `npm run update:production`
- **New native packages or app.json changes** (permissions, icons, plugins): a new build is needed (`npm run build:field`, etc.). The fingerprint runtime policy makes sure old builds never receive an update they can't run.

---

## Done (for reference)

- Steps 1–9 of the build plan, plus Remove friend.
- Feedback email → `higherthinkingconsulting@gmail.com`.
- Terms of Service and Privacy Policy drafted (in-app + Markdown export).
- "Use my own photo" profile avatars (private storage, own-folder only, removed with the account).
- Storybook placeholder hint photos and quest covers, replaced automatically when real photos are uploaded.
- Animated intro, twinkling stars, sparkle bursts (respect Reduce Motion).
- Field-walk tools (pins, hint photos, covers, verified) — admin-only, enforced by the database.
- Hosted Supabase is up to date with all migrations (48 tests pass there).
- Report and block users (App Store Guideline 1.2): block/report from the … menu in Friends, Blocked explorers list, admin Moderation queue (remove photo, reset name, suspend, dismiss), suspended-account screen, banned words for names. Enforced in the database (72 tests).
- Field-walk checklist (Profile → Field walk) and on-phone content editing for admins (spot text, accepted answers, parade flag, radius; quest title and story), logged in private.content_edits. Hint photos and quest covers are saved on the phone ahead of time for offline use.
- Sounds and vibration: original synthesized stamp thunk, badge chime and "saved" tone (scripts/generate-sounds.mjs), with Sounds / Vibration switches in Profile → Settings; sounds follow the silent switch and mix with music.
- Automated smoke tests (Maestro, .maestro/smoke.yaml) on the iOS Simulator against the local stack: sign-in via the local inbox, onboarding (with the avatar maker), walkthrough, a check-in, Passport, Map, Friends, Profile, and buying a hat in the Wardrobe.
- Whole-park storybook map drawn to scale from OpenStreetMap data (real walkways, building footprints, water, rockwork, greenery, the train loop and land outlines; `node scripts/build-park-map.mjs`), in our own style, with an animated train, riverboat, rocket ride and balloon.
- Map tab: full-screen storybook park map (offline; pinch to zoom, drag to pan, double-tap to zoom in or back out; land chips glide to each land; stamps and markers stay the same size at any zoom; numbered stamps in walking order per quest, found stamps gold, parade pauses, 'you are here' once pins exist) with a switch to the real map (Apple Maps / Google Maps) showing pinned spots and your location. Main Street uses the same continuous park map as the other lands.
- "Your next adventure" after each badge (suggests a quest you've started, the next one in the same land, or the next land along the walk) with "Save for my next visit", which pins quests to the top of the Quests screen (private `saved_quests`, 7 tests). Quest pages have the same save toggle.
- Passport milestones (First Stamp, First Snack, Three Visits on separate park days, Ten Stamps, First Lens Page) and progress for each land ("7 of 20 stamps"), all worked out from existing progress.
- Storybook share cards: "Share this find" on found spots and "Share my Passport", previewed in a sheet and shared as images, alongside the badge share.
- Explorer avatars and Wishing Stars: chibi avatars made in onboarding (skin, 8 hairstyles, 7 hair colors, eyes, freckles, 3 starter outfits; "Surprise me"), shown on Profile, Friends and the leaderboard (a profile photo is optional). Stars are recorded in a ledger by database triggers, so the app can't award itself stars, and earlier progress was back-filled: welcome 60, spot 10, quest badge 50, whole land 200, Lens stamp 15, and dress-the-part +5 when something you're wearing comes from that spot's land. Wardrobe (Profile → Wardrobe, or the star chip on Quests): 49 items across 4 slots (hats, outfits, backs, in hand) for all 9 lands plus storybook classics, with try-on. 9 items unlock by finishing a land and 3 by finishing a quest, and purchases are checked in the database (22 tests). Finishing everything (and dressing the part) earns about enough to own it all. Story companions from public-domain books on every land give spot lines, the hint and a quote from the book. Your explorer cheers on the stamp and badge screens and poses on share cards. On the Map, your explorer follows your live position with a compass arrow (foreground only, while the Map tab is open). Lantern Keep, our own castle, stands on the map.
- California Adventure as a second park (Oct 16, 2026): park switch on Quests and Map (saved per device), 8 lands with 16 free quests and 2 Quest Pass quests, original badges and cover art, and a to-scale storybook map from OpenStreetMap (`node scripts/build-dca-map.mjs`). Disneyland gets 2 more Quest Pass quests (Island of Lost Treasure, All Aboard the Grand Circle) and Hollow Haunts grows to 6 spots. Next-adventure suggestions stay in the same park; the Passport groups pages by park.
- Animated-style avatars and Grand Lantern Keep (Oct 16, 2026): avatars redrawn as a big-headed animated-movie kid with large sparkly eyes, an eye-color choice, soft shading and glossy hair; every outfit fitted to the new body. Lantern Keep is now a grand baronial castle.
- Quest Pass and outfit packs (Oct 15, 2026), with store setup still to do (section 3b): RevenueCat (`react-native-purchases` 10.10.2, needs a new build), Quest Pass screen (plans, legal text, restore, manage), premium quests hidden by RLS and refused by `check_in` without the Pass, a monthly Pass gift (claim once, keep forever), Pass ribbon on Profile, three outfit packs in the Wardrobe (11 original items), and the `revenuecat-webhook` Edge Function → `apply_store_event()` (renewals, cancellations, refunds, Trip Pass time, pack refunds that take items off). Premium quests never count toward finishing a land. 24 database tests.
- Storybook Lens: 40 landmark stories (Look for… plus Architecture / Story / History / Engineering layers) across all 9 lands. Opened from the glowing Lens button on the Map: live camera with a brass compass bezel; Point mode floats story cards over pinned landmarks you're facing, Browse mode picks a land and swipes its stories (works without the camera, compass or pins). Stories are readable anywhere; Lens pages in the Passport are stamped near the landmark (checked in the database, 20 tests). Map shows story markers (Stories toggle); spots link to the story behind them; admins pin, photograph, verify and edit landmarks.
- First-time walkthrough "How quests work": 9 pages with looping animated examples (quest progress, finding a spot, four check-in types, stamps and badges, hints and Parade mode, offline sync, friends, Storybook Lens, safety); shown once after onboarding, reopen from Profile or the ? on the Quests banner; respects Reduce Motion.
- Crash reporting (first-party, in Supabase) with a friendly error screen, and the admin Insights screen (Profile → Insights): the spec's success metrics in park time, funnel, per-quest progress, most-reported spots and grouped app errors. Offline check-ins keep their real time.
- Offline mode: quest content, progress, profile and friends cached on the device (7 days); check-ins (with photos and GPS captured at the spot) queue offline and sync when the connection returns; typed answers are checked at sync time.
- Over-the-air updates (EAS Update) with channels per build profile and the fingerprint runtime policy.
- EAS Build set up: project `@brockieboy/once-upon-a-quest`, app ID `app.onceuponaquest`, profiles development / development-simulator / preview / production, hosted Supabase values stored as EAS environment variables.
