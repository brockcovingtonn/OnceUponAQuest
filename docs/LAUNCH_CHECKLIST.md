# Once Upon a Quest — come back later

The single list of everything still open before the app goes public. Items marked **(code)** need more building; Claude can do those. Everything else needs you, a visit to the park, or your attorney.

_Last updated: October 14, 2026_

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
- [ ] After pinning a few spots, open the **Map** tab: stamps should sit on the right side of the street. If they're off, adjust the two anchor points in `src/lib/mapGeometry.ts`.
- [ ] Same for the whole-park map: after pinning spots in a few lands, check they land in the right land on the storybook map. If not, nudge `PARK_BOUNDS` in `src/lib/mapGeometry.ts` (the park drawing is loosely geographic, not to scale).
- [ ] **New lands (added Oct 13, 2026) are live but tagged "Being verified on site."** They were written from public research, so check these first:
  - Typed answers: Jungle Cruise boat names; the tiki figures' names (spellings vary — add any you hear); the Orleans St / Royal St sign; the number on the green door (33); the WD/RD balcony initials; the year in the riverfront brick wall (1764); the petrified tree plaque (September 1957); the riverboat and sailing ship names; the carrousel lead horse (Jingles).
  - Things that may have moved or changed: the edible plants and blue eggs in Tomorrowland planters, the keelboat by the river, the bear tributes in Bayou Country, Toontown's crates, fountain, mailboxes and fire station window, the 21 Royal Street address.
  - Parade flags: only the clock-tower lawn spots in Fantasyland pause in Parade mode. Flag any others that sit on the parade route.
  - The "Being verified" tag on a quest goes away by itself once every spot in it is **Mark verified**.
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
- [ ] App icon, logo, stamp avatars, badge art and storybook scenes (all original, in `src/art/`).
- [ ] Disclaimer wording (sign-in, About, Terms, store listings).
- [ ] Spot titles naming real people or places, e.g. "Elias Disney window", "Walt's window", "Walt's lamp", "The Dominguez Palm", "Jingles", the WD/RD initials. Attraction and land names appear only as plain text describing locations (e.g. "Jungle Cruise boat names", "Toontown"). The land is shown as "Toontown", leaving the character name out of the app's headings.
- [ ] **Galaxy's Edge content** — the most sensitive land for IP. The app shows it as "Galaxy's Edge" (no franchise name in headings), names no film characters, ships or droids in titles, and uses only original generic art (no recognizable ships, droids or weapons). Attraction and venue names (e.g. Millennium Falcon: Smugglers Run, Docking Bay 7 Food and Cargo, Ronto Roasters, Kat Saka's Kettle) appear only in "where to stand" text. Ask whether to keep the in-world names "Black Spire" and "Bright suns" as typed answers.
- [ ] The "Ears Everywhere" quest concept (finding hidden three-circle shapes — described in text only; the app never draws the shape).
- [ ] Menu item names in the Snack Passport (e.g. "Walt's Chili").
- [ ] Store screenshots before submission.

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

- [ ] Before each TestFlight build, run the smoke test on the simulator: `npm run db:start`, `npm run e2e:build` (after app changes), then `npm run e2e`. It signs up a brand-new explorer, onboards, checks in, and visits every tab, then deletes its test accounts.
- [ ] Listen to the stamp, badge chime and "saved" sounds on a real phone (with the ringer on); turn Sounds / Vibration off in Profile → Settings and confirm they go quiet.
- [ ] Walkthrough (Profile → How quests work, or the ? on the Quests banner): all 8 pages read well, the animations loop smoothly, nothing overlaps at the largest text size, and with Reduce Motion on each page shows a still final picture.
- [ ] Offline: open each quest once with signal, then turn on Airplane mode — quests, spots, Passport and Friends should still open; check in at a photo spot and a typed-answer spot (both say "Saved for later"); turn Airplane mode off and confirm the "synced" banner, the stamps, and any badge.
- [ ] Largest system text size on every screen (iOS: Settings → Accessibility → Display & Text Size → Larger Text; Android: Font size).
- [ ] VoiceOver (iOS) and TalkBack (Android) through sign-in, a check-in and the Passport.
- [ ] Reduce Motion on: the intro should just show the logo briefly and fade.
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
- Automated smoke tests (Maestro, .maestro/smoke.yaml) on the iOS Simulator against the local stack: sign-in via the local inbox, onboarding, walkthrough, a check-in, Passport, Map, Friends, Profile.
- Map tab: original storybook map of the street (offline, numbered stamps in walking order per quest, found stamps gold, parade pauses, 'you are here' once pins exist) with a switch to the real map (Apple Maps / Google Maps) showing pinned spots and your location.
- First-time walkthrough "How quests work": 8 pages with looping animated examples (quest progress, finding a spot, four check-in types, stamps and badges, hints and Parade mode, offline sync, friends, safety); shown once after onboarding, reopen from Profile or the ? on the Quests banner; respects Reduce Motion.
- Crash reporting (first-party, in Supabase) with a friendly error screen, and the admin Insights screen (Profile → Insights): the spec's success metrics in park time, funnel, per-quest progress, most-reported spots and grouped app errors. Offline check-ins keep their real time.
- Offline mode: quest content, progress, profile and friends cached on the device (7 days); check-ins (with photos and GPS captured at the spot) queue offline and sync when the connection returns; typed answers are checked at sync time.
- Over-the-air updates (EAS Update) with channels per build profile and the fingerprint runtime policy.
- EAS Build set up: project `@brockieboy/once-upon-a-quest`, app ID `app.onceuponaquest`, profiles development / development-simulator / preview / production, hosted Supabase values stored as EAS environment variables.
