# Once Upon a Quest — open items before launch

What's left after the Step 9 polish pass. Code is done for everything in Steps 1–9 except the items marked **(code)**.

## Needs the field walk (Step 10)
- [ ] GPS pin (`lat`, `lng`) for all 20 spots — the dev-only "Set pin here" button comes in Step 10. Until then, no spot checks location.
- [ ] Confirm every answer, the cannon count and the candy shop names on site; fix any that changed.
- [ ] Your own hint photo for each spot. **(code)** Spots have a `photo_path` column, but there's no storage bucket or screen section for hint photos yet.
- [ ] Your own cover photo for each quest. **(code)** Needs a `cover_photo_path` column on `quests` and a public content bucket; the cards and quest screen are text-only today.
- [ ] Set `verified_on_site = true` for each confirmed spot.

## Needs a decision or content from you
- [ ] **Terms of Service** and **Privacy Policy** text (location, photos, account deletion, 13+). The screens exist and show a placeholder.
- [ ] **Feedback email** — set `feedbackEmail` in `src/copy.ts` to show "Send feedback" in Settings.
- [ ] **"Use my own photo" avatar** (wireframe, onboarding step 1) — left out. **(code)** Needs an avatars bucket that friends can read.
- [ ] Review the three extra tips in `copy.safety.extra` (Quest safety rules screen) — written by Claude.

## Hosted Supabase (before real users)
- [ ] Custom SMTP sender (e.g. Resend) — the free built-in sender only reaches your team's emails and can't use custom templates.
- [ ] Then set the **Confirm signup** and **Magic Link** templates to `supabase/templates/otp-code.html` (shows the 6-digit `{{ .Token }}`).
- [ ] Switch the app back with `npm run db:use-hosted` and restart Expo with `--clear`.

## IP attorney review (README "Before launch")
- [ ] App name "Once Upon a Quest" — trademark search.
- [ ] App icon, logo, stamp avatars and badge art (all original, `src/art/shapes.ts`).
- [ ] Disclaimer wording (sign-in, About, store listings).
- [ ] Spot titles that name real people or places, e.g. "Elias Disney window", "Walt's window", "Walt's lamp".
- [ ] The "Ears Everywhere" quest: it asks players to find hidden three-circle shapes. The app describes them in text only and never draws the shape, but the concept itself should be reviewed.
- [ ] Menu item names in the Snack Passport (e.g. "Walt's Chili").
- [ ] Store screenshots before submission.

## Check on real phones
- [ ] Largest system text size (iOS: Settings → Accessibility → Display & Text Size → Larger Text; Android: Font size) — every screen should still read and nothing should be cut off.
- [ ] VoiceOver (iOS) and TalkBack (Android) pass through sign-in, a check-in and the Passport.
