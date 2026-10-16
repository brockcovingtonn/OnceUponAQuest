# Once Upon a Quest — Phase 1 product spec

## Goal
Prove one thing: **guests who finish a first quest come back and do another one on their next park visit.**

Scope is one street (Main Street, U.S.A. + Town Square, Disneyland Park), 4 quests, 20 spots. Everything else waits.

## Users
- **Explorer (primary):** annual passholder or repeat visitor, 18–45, loves details and history, visits several times a year.
- **Family planner:** parent running quests with kids (13+ account holder; kids play along on the parent's phone).

## Core loop
Open app in the park → pick a quest → walk to a spot → check in → collect a stamp → finish quest → earn badge → compare with friends → come back next visit for the next quest.

## Features (Phase 1)

### 1. Accounts and onboarding
- Sign in with email one-time code.
- Onboarding: pick username (3–24 chars, unique), confirm age 13+, read 3 safety rules, accept disclaimer.
- Profile: username, display name, avatar (own photo or one of 8 original stamp avatars).

### 2. Quests
- Quests home lists live quests grouped by land (only "Main Street, U.S.A." in Phase 1), with progress (e.g. 3/5).
- Quest detail: title, short story intro, estimated time (15–20 min), spot list in walking order, progress ring.
- Quest content comes from the database, so new quests ship without an app update.

### 3. Spots and check-in
Each spot has: title, where-to-stand hint, clue, check-in prompt, method, optional GPS pin + radius, optional holiday note, and a parade-pause flag.

Check-in methods:
| Method | What the user does | How it's verified |
| --- | --- | --- |
| `answer` | Types a short answer seen on site | Server compares to accepted answers (case/punctuation-insensitive) |
| `photo` | Takes a photo of the spot | Photo uploaded to private storage; accepted automatically in Phase 1 |
| `listen` | Listens to something on site and taps "I heard it" | Honor system |
| `snack` | Logs a snack, optional photo | Honor system; also adds a Snack Passport stamp |

Location rule: if a spot has a GPS pin, the user must be within `radius_m` (+25 m tolerance) to check in. Spots without pins (until the field walk sets them) skip the location check.

Wrong answer: friendly retry message, unlimited tries, "Need a hint?" reveals the clue's second line after 2 misses. Never reveal the answer.

### 4. Passport
- Grid of stamps: one per spot found, grey outline for spots not yet found.
- Badges row: one badge per completed quest.
- Snack Passport section: snack check-ins.

### 5. Friends
- Add friends by username; accept or decline requests.
- Leaderboard: you + accepted friends, ranked by spots found, then badges.

### 6. Safety and trust
- **Parade mode** toggle on Quests home: when on, spots with `pause_during_parades` show a paused banner and can't be checked in.
- Disclaimer on sign-in screen and in Settings.
- Report a problem on any spot ("this spot changed / is unsafe / answer is wrong") → saved to `spot_reports` for review.
- Delete account (required by both app stores).

### 7. Explorer avatar, Wishing Stars and wardrobe (added October 2026)
- Onboarding step "Make your explorer": an original chibi avatar (skin tone, hairstyle, hair color, eyes, freckles, starter outfit). Shown on Profile, Friends and the leaderboard; a profile photo is optional.
- **Wishing Stars** are earned only (never bought, sold or traded): welcome 60, spot 10, quest badge 50, whole land 200, Lens stamp 15, dress-the-part +5. Recorded server-side in `star_ledger` by triggers.
- **Wardrobe**: hats, outfits, backs and in-hand items for every land, with generic, storybook-park names; story items follow public-domain books. Some unlock only by finishing a land or quest. `buy_avatar_item()` checks unlocks and balance.
- **Story companions**: a public-domain character per land who talks to your explorer on spots (lines, the hint, a quote from the book).
- Your explorer appears on stamp and badge screens, share cards, and the Map (live position plus a compass arrow, foreground only, never shared with others).
- **Lantern Keep**: our own original castle on the Map (see hard rule 2 for castle rules).

### 8. Quest Pass and outfit packs (added October 2026)
- **Quest Pass** (in-app purchase through Apple / Google via RevenueCat): monthly ($3.99), yearly ($24.99, auto-renewing) or a 3-day Trip Pass ($4.99, non-renewing); store prices are set in App Store Connect / Play Console. Unlocks premium quests (`quests.is_premium`, first: Hollow Haunts in New Orleans Square), a free outfit gift each month (`avatar_items.pass_month`, claimed once and kept), and a Pass ribbon on the profile.
- All free quests stay free. Premium quests never count toward finishing a land, so land bonuses and land-locked items stay reachable for free.
- **Outfit packs**: non-consumable purchases (about $1.99 to $2.99): Sleepy Hollow, Holiday Lights, Pirate Captain. Pack items are never sold for stars.
- Server is the source of truth: RevenueCat's webhook → `revenuecat-webhook` Edge Function → `apply_store_event()` updates `entitlements` and `pack_owned`, ignores repeats, and handles renewals, cancellations and refunds. Premium spots are hidden by RLS without the Pass, and `check_in` returns `pass_required`.
- Wishing Stars are never sold.

## Not in Phase 1
Pins and trading, outfit closet, audio tours, camera recognition, meetups, push notifications, Walt Disney World content, other lands.

## Data model (see `supabase/migrations/`)
- `parks`, `lands` — locations.
- `quests` — title, story, land, badge, status (`draft`/`live`/`retired`), `is_premium`, `season`.
- `spots` — per quest, ordered; method, prompt, clue, hint, GPS pin, radius, parade flag, holiday note, `verified_on_site`.
- `private.spot_answers` — accepted answers; never exposed to the API.
- `checkins` — one per user per spot.
- `badges`, `user_badges` — badge awarded automatically when a quest is complete.
- `profiles`, `friendships`, `spot_reports`.
- RPC `check_in(...)` — validates location + answer, records the check-in, awards the badge, returns the result.
- RPC `friends_leaderboard()` — ranks you and your friends.
- Storage bucket `checkin-photos` (private, each user writes only to their own folder).

## Success metrics (track from day 1)
- % of new users who finish a quest on their first visit.
- % of quest finishers who start another quest on a later day.
- Average check-ins per park visit.
- Spot reports per spot (content quality signal).

## Before launch (non-code)
- Field walk: confirm all 20 spots, set GPS pins, take original photos, set `verified_on_site = true`.
- App name trademark search and IP attorney review of name, icon, screenshots and disclaimer.
- Privacy policy and terms (location, photos, account deletion).
