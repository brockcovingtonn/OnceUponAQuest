# Once Upon a Quest — starter kit

Everything Claude Code needs to build Phase 1: the Main Street, U.S.A. quest pilot.

## What's inside
| File | What it is |
| --- | --- |
| `CLAUDE.md` | Project brief Claude Code reads automatically: stack, folder structure, brand, and the legal/safety rules it must never break |
| `docs/PRODUCT_SPEC.md` | What Phase 1 does and doesn't do, data model, success metrics |
| `docs/WIREFRAMES.md` | Layout of all 9 screens plus the navigation map |
| `docs/BUILD_PLAN.md` | 10 steps, each a prompt to paste into Claude Code with a "done when" check |
| `supabase/migrations/20261010000000_init.sql` | Database: tables, security rules, the `check_in` function, photo storage |
| `supabase/seed.sql` | The 4 quests and 20 Main Street spots, with answer keys |
| `supabase/tests/manual_checks.sql` | Checks that answer keys stay hidden, check-ins validate, badges award |

## How to start
1. Do Step 0 in `docs/BUILD_PLAN.md` (installs and accounts).
2. Unzip this folder, open it in VS Code, start Claude Code.
3. Paste Step 1 from the build plan. Work through one step at a time.

## Tested
The migration, seed and checks were run against PostgreSQL 16 with Supabase's auth and storage stubbed. Verified: users can't read answer keys or insert check-ins directly; wrong answers, parade-paused spots, out-of-range locations and photos in someone else's folder are rejected; completing a quest awards its badge; friends see each other's progress only after accepting; signed-out users can't call anything.

## Before launch
The 20 spots are researched but not yet confirmed in person, and none have GPS pins. Step 10 covers the field walk. The name, icon, store screenshots and disclaimer should get an IP attorney's review.
