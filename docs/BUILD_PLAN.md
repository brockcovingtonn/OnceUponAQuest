# Once Upon a Quest — build plan for Claude Code

Paste one step at a time into Claude Code. Don't start the next step until the "Done when" checks pass on your phone. Each step ends with a git commit.

---

## Step 0 — Before you open Claude Code (you do this, ~30 min)
1. Install **Node.js LTS**, **Git**, **VS Code** with the Claude Code extension.
2. Install **Expo Go** on your iPhone or Android phone.
3. Create a free **Supabase** account and a new project named `once-upon-a-quest` (region: West US). Save the database password somewhere safe.
4. Install the Supabase CLI and Docker Desktop (needed for the local database).
5. Unzip this kit into an empty folder, open that folder in VS Code, start Claude Code.

---

## Step 1 — Create the app shell
> Read CLAUDE.md and all files in docs/. Create a new Expo app with Expo Router and TypeScript **in this folder**, keeping the existing CLAUDE.md, docs/ and supabase/ files. Use the current recommended Expo template. Set up the folder structure from CLAUDE.md with placeholder screens for every route (each just shows its name). Add the brand tokens in src/theme/, load Fraunces and Inter with expo-font, and create src/copy.ts holding the disclaimer text from CLAUDE.md. Initialize git and commit.

**Done when:** `npx expo start` runs, the app opens in Expo Go, and you can tap through all four tabs.

---

## Step 2 — Database
> Initialize Supabase in this repo (keep the existing supabase/migrations and supabase/seed.sql). Start the local stack, apply the migration and seed, and confirm 4 quests and 20 spots exist. Then turn supabase/tests/manual_checks.sql into a test script that runs against the local stack and confirms: answer keys can't be read by a signed-in user, wrong answers are rejected, parade mode pauses flagged spots, finishing a quest awards its badge. Generate TypeScript types into src/types/database.ts. Commit.

**Done when:** the test script passes and `src/types/database.ts` exists.

Then push to your hosted project (you'll need the database password from Step 0):
> Link this repo to my hosted Supabase project and push the migration and seed. Put the project URL and anon key in .env as EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, and make sure .env is in .gitignore.

---

## Step 3 — Sign in and onboarding
> Build src/lib/supabase.ts (session persisted with secure storage) and the auth gate in app/_layout.tsx exactly as described at the bottom of docs/WIREFRAMES.md. Build the sign-in screen (email one-time code) and the 3-step onboarding screen from WIREFRAMES.md sections 1 and 2. Use the username_available RPC for the live username check. Under-13 users see a polite stop screen and no profile is created. Commit.

**Done when:** you can sign in with your email, pick a username, finish onboarding, land on the Quests tab, quit the app and reopen it still signed in.

---

## Step 4 — Quests home and quest detail
> Build the Quests home (WIREFRAMES section 3) and Quest detail (section 4) with react-query hooks in src/lib/queries.ts. Show progress from the checkins table. Add the Parade mode toggle, stored on the device, and show paused spots. Spot teasers show until a spot is found; found spots show their title and a gold stamp. Handle loading, empty and error states. Commit.

**Done when:** all 4 Main Street quests show with correct spot counts, and Parade mode marks the flagged spots as paused.

---

## Step 5 — Check-in (the core of the app)
> Build the spot screen (WIREFRAMES section 5) with all four method variants. Get the user's location with expo-location (foreground permission only, asked the first time it's needed, with a friendly explanation first). For photo check-ins, use expo-image-picker with the camera, compress to under 1 MB, upload to the checkin-photos bucket at `<user id>/<spot id>-<timestamp>.jpg`, then call the check_in RPC. Map every reason the RPC can return (not_found, paused, too_far, location_required, wrong_answer, photo_required) to friendly copy in src/copy.ts. Show "Need a hint?" after 2 wrong answers. On success: haptic, stamp animation, then back to the quest, or open the badge modal (section 6) if the quest is complete. Add "Report a problem" writing to spot_reports. Commit.

**Done when:** at home (no GPS pins set yet) you can finish the "Ears Everywhere" quest with 4 photos and see the badge modal, and a wrong answer on "Windows of Legends" spot 4 shows the retry message.

---

## Step 6 — Passport
> Build the Passport tab (WIREFRAMES section 7): badges row, stamp grid per land, Snack Passport list. Tapping a found stamp opens the spot in read-only mode with the date found. Commit.

---

## Step 7 — Friends and leaderboard
> Build the Friends tab (WIREFRAMES section 8): add by username, pending requests with accept/decline, leaderboard from the friends_leaderboard RPC with the current user highlighted. Commit.

**Done when:** two test accounts (yours plus a second email) can friend each other and see each other on the leaderboard.

---

## Step 8 — Profile, settings, account deletion
> Build the Profile tab (WIREFRAMES section 9). Settings rows open the permission settings, safety rules, Terms, Privacy Policy and an About screen with the full disclaimer. "Delete my account" asks for confirmation, calls delete_my_account, and signs out. Commit.

---

## Step 9 — Polish pass
> Review every screen against WIREFRAMES.md and the hard rules in CLAUDE.md. Check: every touchable has an accessibility label, text scales with system font size, touch targets are at least 44pt, nothing uses Disney logos, character art or a three-circle shape, and the disclaimer appears on sign-in and About. Create 8 original stamp avatars and 4 original badge illustrations as simple SVGs (window, lamp, magnifier, envelope) in the brand colors. List anything you couldn't fix. Commit.

---

## Step 10 — Field walk, then TestFlight
You do this in the park with the app installed:
1. Walk the street in order. At each spot, stand where a guest should stand.
2. Use a dev-only "Set pin here" button (ask Claude Code to add it, visible only in development builds) to save lat/lng for each spot.
3. Take your own hint photo for each spot.
4. Confirm the cannon count, candy shop names and every answer; fix any that changed.
5. Set `verified_on_site = true` for each confirmed spot.

Then:
> Set up EAS Build for iOS and Android, and walk me through submitting a TestFlight build and a Google Play internal test.

Apple's developer program is a yearly fee and Google Play is a one-time fee; check current prices on their sites.

---

## Later phases (not now)
Phase 2 pins and trade matching · Phase 3 outfit closet · Phase 4 audio history tours and group meetups (18+). Each gets its own spec before any code.
