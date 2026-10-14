// Creates (or updates) the shared tester accounts user1@ … user4@onceuponaquest.com
// with one 6-digit test code. The app recognizes these addresses on the
// sign-in screen and checks the code directly instead of emailing one
// (see src/lib/testAccounts.ts).
//
//   TEST_CODE=123456 node scripts/create-test-accounts.mjs           hosted project
//   TEST_CODE=123456 node scripts/create-test-accounts.mjs --local   local stack
//
// Without TEST_CODE a random code is generated and printed. The code is never
// written to disk: keep it somewhere private, and rerun with a new code to change it.
import { randomInt } from 'node:crypto';

import { adminClient } from './supabase-admin.mjs';

const EMAILS = [1, 2, 3, 4].map((n) => `user${n}@onceuponaquest.com`);
const local = process.argv.includes('--local');
const code = process.env.TEST_CODE ?? String(randomInt(0, 1_000_000)).padStart(6, '0');
if (!/^\d{6}$/.test(code)) {
  console.error('TEST_CODE must be exactly 6 digits.');
  process.exit(1);
}

const { client, target } = adminClient(local);
const existing = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  for (const u of data.users) if (u.email) existing.set(u.email.toLowerCase(), u.id);
  if (data.users.length < 200) break;
}

for (const email of EMAILS) {
  const attrs = { password: code, email_confirm: true, user_metadata: { test_account: true } };
  const id = existing.get(email);
  const { error } = id
    ? await client.auth.admin.updateUserById(id, attrs)
    : await client.auth.admin.createUser({ email, ...attrs });
  if (error) throw error;
  console.log(`${id ? 'Updated' : 'Created'} ${email}`);
}
console.log(`\nTest code for all four accounts on ${target}: ${code}`);
