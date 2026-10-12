# Once Upon a Quest — come back later

The single list of everything still open before the app goes public. Items marked **(code)** need more building; Claude can do those. Everything else needs you, a visit to the park, or your attorney.

_Last updated: October 11, 2026_

---

## 1. Field walk (in the park)

The walk happens on cellular, so use the **hosted** database (pins and photos land in the real project). `covington.brock@gmail.com` is already an admin on both local and hosted (`npm run admin:add -- email` adds others). Each spot screen shows a dashed **Field tools** panel; each quest screen has **Take cover photo**.

- [ ] Pick how the app reaches your phone on cellular:
  - **Option A — "field" build (recommended; needs the Apple Developer Program):** `npm run build:field`, install it on your iPhone from the EAS link. Standalone, no Mac needed.
  - **Option B — free, Mac stays home:** `npm run db:use-hosted`, then `caffeinate -dis npx expo start --tunnel --clear`; open it in Expo Go before you leave. Works on cellular while the Mac stays awake and online.
- [ ] Sign in on the hosted database before you leave home: in the app enter your email and tap **Send my code**, then on the Mac run `npm run auth:code -- covington.brock@gmail.com` and type the code it prints (valid 1 hour). You'll finish onboarding once; the sign-in then lasts the whole walk.
- [ ] At each of the 20 spots, stand where a guest should stand, then:
  - [ ] **Set pin here** (it refuses GPS fixes worse than 25 m — step into open sky and retry)
  - [ ] **Take hint photo** (replaces the storybook placeholder)
  - [ ] Confirm the answer, the cannon count and candy shop names; tell Claude about anything that changed so the answer keys can be updated
  - [ ] **Mark verified**
- [ ] On each of the 4 quest screens: **Take cover photo** (replaces the storybook scene on the card and quest page)
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
- [ ] Spot titles naming real people or places, e.g. "Elias Disney window", "Walt's window", "Walt's lamp".
- [ ] The "Ears Everywhere" quest concept (finding hidden three-circle shapes — described in text only; the app never draws the shape).
- [ ] Menu item names in the Snack Passport (e.g. "Walt's Chili").
- [ ] Store screenshots before submission.

## 4. Required before App Store / Google Play submission

- [ ] **(code) Report and block users.** Usernames and profile photos are user-generated content, and Apple (Guideline 1.2) requires a way to report offensive content and block abusive users, plus a way for you to act on reports within 24 hours.
- [ ] **(code) Photo moderation plan** — profile photos are visible to every signed-in user. Either add reporting + review (above) or limit profile photos to accepted friends.
- [ ] Enroll in the **Apple Developer Program** (yearly fee) — needed for any iPhone build you install, TestFlight and the App Store.
- [ ] Create a **Google Play Console** account (one-time fee) — needed for Play internal testing and the store. (Android test builds can be installed without it.)
- [ ] First builds — run these in the VS Code terminal, because they ask questions (Apple sign-in, signing keys):
  - `npm run build:dev:android` — development build for Android (works today, no store account needed)
  - `npm run build:dev:ios` — development build for iPhone (needs the Apple Developer Program; registers your phone)
  - `npm run build:preview` — standalone test builds (sign-in needs the hosted email set up first — section 2)
  - `npm run build:production` then `npm run submit:ios` / `npm run submit:android` — store builds
- [ ] Preview and production builds use the **hosted** Supabase project (values stored in EAS, not in the repo). Sign-in there needs the custom SMTP + code templates from section 2.
- [ ] App Store privacy "nutrition label" and Google Play Data safety form: email, user ID, photos, precise location (app functionality only, not stored), user content; no tracking, no ads.
- [ ] Age rating questionnaires (13+, user-generated content, location).

## 5. Check on real phones

- [ ] Largest system text size on every screen (iOS: Settings → Accessibility → Display & Text Size → Larger Text; Android: Font size).
- [ ] VoiceOver (iOS) and TalkBack (Android) through sign-in, a check-in and the Passport.
- [ ] Reduce Motion on: the intro should just show the logo briefly and fade.
- [ ] Intro and sparkle animations feel smooth on an older phone.

## 6. Small decisions you can make any time

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
- Over-the-air updates (EAS Update) with channels per build profile and the fingerprint runtime policy.
- EAS Build set up: project `@brockieboy/once-upon-a-quest`, app ID `app.onceuponaquest`, profiles development / development-simulator / preview / production, hosted Supabase values stored as EAS environment variables.
