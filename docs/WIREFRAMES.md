# Once Upon a Quest — Phase 1 wireframes

Low-fidelity layouts for every Phase 1 screen. Build the structure and behavior shown here; apply colors and fonts from `CLAUDE.md` → Brand. Phone width ~390pt. `[ Button ]` = primary button, `( Button )` = secondary, `[x]` = checkbox, `▸` = tappable row.

---

## 1. Sign in — `app/(auth)/sign-in.tsx`
```
┌──────────────────────────────────┐
│                                  │
│        ✦  (original logo:        │
│           open storybook + star) │
│                                  │
│      Once Upon a Quest           │  Fraunces, 32
│   Find the stories hiding in     │
│        plain sight.              │
│                                  │
│  Email                           │
│  ┌────────────────────────────┐  │
│  │ you@example.com            │  │
│  └────────────────────────────┘  │
│  [      Send my code         ]   │
│                                  │
│  ── after send ──                │
│  Enter the 6-digit code          │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐        │
│  └──┘└──┘└──┘└──┘└──┘└──┘        │
│  [          Sign in          ]   │
│  ( Resend code in 0:30 )         │
│                                  │
│  Independent fan app. Not        │  small, secondary text
│  affiliated with, endorsed or    │  (full disclaimer from CLAUDE.md)
│  sponsored by The Walt Disney    │
│  Company or its affiliates.      │
└──────────────────────────────────┘
```
States: invalid email → inline error; code wrong → "That code didn't work. Try again."; network error → banner.

---

## 2. Onboarding — `app/onboarding.tsx` (3 steps, progress dots)
```
Step 1 of 3 ● ○ ○                 Step 2 of 3 ○ ● ○               Step 3 of 3 ○ ○ ●
┌────────────────────────┐        ┌────────────────────────┐      ┌────────────────────────┐
│ Pick your explorer     │        │ Three quest rules      │      │ One more thing         │
│ name                   │        │                        │      │                        │
│ ┌────────────────────┐ │        │ 🚶 Walk, never run.    │      │ Once Upon a Quest is   │
│ │ @ lampLighter      │ │        │ 🛑 Stay on sidewalks — │      │ an independent fan     │
│ └────────────────────┘ │        │    never stand in the  │      │ app. [full disclaimer] │
│ ✓ available            │        │    street or block a   │      │                        │
│                        │        │    doorway.            │      │ [x] I'm 13 or older    │
│ Choose a stamp avatar  │        │ 🎆 Turn on Parade mode │      │ [x] I agree to the     │
│ (◯)(◯)(◯)(◯)           │        │    during parades and  │      │     Terms and Privacy  │
│ (◯)(◯)(◯)(◯)           │        │    fireworks.          │      │     Policy ▸           │
│ ( Use my own photo )   │        │                        │      │                        │
│                        │        │                        │      │                        │
│ [       Next        ]  │        │ [  Got it, next   ]    │      │ [ Start exploring ]    │
└────────────────────────┘        └────────────────────────┘      └────────────────────────┘
```
Username check is live (debounced 400 ms). Under 13 → polite stop screen, no account created.

---

## 3. Quests home — `app/(tabs)/index.tsx`
```
┌──────────────────────────────────┐
│ Good morning, lampLighter        │
│ ┌──────────────────────────────┐ │
│ │ 🎆 Parade mode       ( off ) │ │  toggle; when on, gold banner below
│ └──────────────────────────────┘ │
│                                  │
│ MAIN STREET, U.S.A.              │  section header (land)
│ ┌──────────────────────────────┐ │
│ │ ▒▒▒ cover photo ▒▒▒▒▒▒▒▒▒▒▒▒ │ │  QuestCard
│ │ Windows of Legends           │ │
│ │ 7 spots · ~20 min            │ │
│ │ ◔ 3/7 found       Continue ▸ │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Walt Was Here                │ │
│ │ 5 spots · ~15 min   Start ▸  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Ears Everywhere      ✓ Badge │ │  completed state
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Main Street Senses           │ │
│ └──────────────────────────────┘ │
│                                  │
│ More lands coming soon ✦         │
├──────────────────────────────────┤
│ Quests  Passport  Friends  Me    │  tab bar
└──────────────────────────────────┘
```
Empty state: "No quests here yet." Error: retry button. Pull to refresh.

---

## 4. Quest detail — `app/quest/[slug].tsx`
```
┌──────────────────────────────────┐
│ ‹ Back                           │
│ ▒▒▒▒▒▒ cover photo ▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│ Windows of Legends               │  Fraunces, 26
│ The names painted on the upper   │  story intro, 2–3 lines
│ windows belong to the people who │
│ built this street. Find them.    │
│                                  │
│      ◔  3 of 7      ~20 min      │  ProgressRing
│                                  │
│ ✓ 1  Elias Disney window      ▸  │  SpotRow (found = gold stamp)
│ ✓ 2  Walt's own window        ▸  │
│ ✓ 3  Broggie and Baxter       ▸  │
│ ○ 4  The music shop door      ▸  │  not found
│ ○ 5  The animators' windows   ▸  │
│ ⏸ 6  Orange grove window      ▸  │  paused (parade mode on)
│ ○ 7  A first-ever pair        ▸  │
│                                  │
│ Badge for finishing:  (stamp)    │
└──────────────────────────────────┘
```
Spot titles shown before check-in are teasers (`title`); the full name shows after it's found.

---

## 5. Spot check-in — `app/spot/[id].tsx` (one layout, four method variants)
```
┌──────────────────────────────────┐
│ ‹ Windows of Legends     4 of 7  │
│                                  │
│ ▒▒▒ hint photo (founder's own) ▒ │
│                                  │
│ The music shop door              │  Fraunces, 24
│ 📍 Where to stand                │
│ Sidewalk between the magic shop  │
│ and the cinema.                  │
│                                  │
│ Clue                             │
│ Two brothers who wrote famous    │
│ songs are honored on a door, not │
│ a window.                        │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ What business name is on     │ │  prompt
│ │ the door?                    │ │
│ │ ┌──────────────────────────┐ │ │
│ │ │                          │ │ │  answer variant
│ │ └──────────────────────────┘ │ │
│ │ [        Check in         ]  │ │
│ └──────────────────────────────┘ │
│ ( Need a hint? )   after 2 misses│
│ Report a problem ▸               │
└──────────────────────────────────┘

Method variants for the bottom card:
  photo  →  [ 📷 Take a photo ]  → preview → [ Use this photo ]
  listen →  "Pick up a phone and listen."  [ I heard it ]
  snack  →  "Order it, enjoy it, log it."  ( 📷 Add photo, optional )  [ Stamp my passport ]
```
Location states (spot has a GPS pin):
```
 ┌──────────────────────────────┐    ┌──────────────────────────────┐
 │ 📍 You're about 180 m away.  │    │ 📍 Location is off. Turn it  │
 │ Walk closer to check in.     │    │ on to check in here.         │
 │                              │    │ ( Open settings )            │
 └──────────────────────────────┘    └──────────────────────────────┘
```
Paused state: gold banner "Paused during parades and fireworks — check back after." Check-in disabled.
Wrong answer: shake + "Not quite — look again." Correct: haptic success → stamp animation → back to quest (or badge modal if quest complete).

---

## 6. Badge earned — `app/badge/[slug].tsx` (modal)
```
┌──────────────────────────────────┐
│                                  │
│          ✦  ✦  ✦                 │
│        ┌─────────┐               │
│        │  STAMP  │               │  original badge art, scales in
│        └─────────┘               │
│   Quest complete!                │
│   Windows of Legends             │
│   You found all 7 spots.         │
│                                  │
│  [   Share my badge   ]          │  share sheet with badge image
│  (   Next quest  ▸    )          │
│  ( Done )                        │
└──────────────────────────────────┘
```

---

## 7. Passport — `app/(tabs)/passport.tsx`
```
┌──────────────────────────────────┐
│ My Passport                      │
│ 12 spots · 2 badges · 1 snack    │
│                                  │
│ BADGES                           │
│ (◉) (◉) (◌) (◌)                  │  earned = gold, locked = outline
│                                  │
│ MAIN STREET, U.S.A. STAMPS       │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐             │
│ │✦ ││✦ ││✦ ││  ││  │             │  4-5 per row, tap to see spot +
│ └──┘└──┘└──┘└──┘└──┘             │  date found
│ ┌──┐┌──┐┌──┐┌──┐┌──┐             │
│ │✦ ││  ││✦ ││  ││  │             │
│ └──┘└──┘└──┘└──┘└──┘             │
│                                  │
│ SNACK PASSPORT                   │
│ ▸ Walt's Chili · Oct 12, 2026    │
└──────────────────────────────────┘
```

---

## 8. Friends — `app/(tabs)/friends.tsx`
```
┌──────────────────────────────────┐
│ Friends                          │
│ ┌────────────────────────────┐   │
│ │ 🔍 Add by username         │   │
│ └────────────────────────────┘   │
│                                  │
│ REQUESTS (1)                     │
│ (◯) castleCrumb   (✓) (✕)        │
│                                  │
│ LEADERBOARD                      │
│ 1  (◯) castleCrumb   15 · 3 ◉    │  spots · badges
│ 2  (◯) You           12 · 2 ◉    │  current user highlighted
│ 3  (◯) mainStMo       7 · 1 ◉    │
│                                  │
│ Empty: "Add a friend to compare  │
│ passports."                      │
└──────────────────────────────────┘
```

---

## 9. Profile and settings — `app/(tabs)/profile.tsx`
```
┌──────────────────────────────────┐
│        (◯ avatar)                │
│        lampLighter               │
│        Exploring since Oct 2026  │
│ ( Edit profile )                 │
│                                  │
│ SETTINGS                         │
│ ▸ Location permission            │
│ ▸ Camera permission              │
│ ▸ Quest safety rules             │
│ ▸ Terms of Service               │
│ ▸ Privacy Policy                 │
│ ▸ About & disclaimer             │
│ ▸ Send feedback                  │
│ ( Sign out )                     │
│ Delete my account                │  red text, confirm dialog
└──────────────────────────────────┘
```

---

## Navigation map
```
sign-in ─▶ onboarding ─▶ (tabs)
                          ├─ Quests ─▶ quest/[slug] ─▶ spot/[id] ─▶ badge/[slug] (modal)
                          ├─ Passport ─▶ spot/[id] (read-only when found)
                          ├─ Friends
                          └─ Profile
```
Auth gate in `app/_layout.tsx`: no session → sign-in; session but no profile row → onboarding; else tabs.
