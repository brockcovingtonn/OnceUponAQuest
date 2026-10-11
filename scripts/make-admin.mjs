// Makes an account an admin so the Field tools appear for it.
//   npm run admin:add -- you@example.com            (hosted project)
//   npm run admin:add -- you@example.com --local    (local stack)
// Creates the sign-in account first if it doesn't exist yet.
import { execFileSync } from 'node:child_process';

import { adminClient, ensureUser, parseArgs } from './supabase-admin.mjs';

const { email, local } = parseArgs('Usage: npm run admin:add -- you@example.com [--local]');
const { client, target } = adminClient(local);
const userId = await ensureUser(client, email);
if (!/^[0-9a-f-]{36}$/.test(userId)) throw new Error('Unexpected user id');
const sql = `insert into private.admins (user_id) values ('${userId}') on conflict do nothing;`;
execFileSync('supabase', ['db', 'query', local ? '--local' : '--linked', sql], { stdio: ['ignore', 'ignore', 'inherit'] });
console.log(`${email} is an admin on the ${target} database. Field tools will appear on spot and quest screens.`);
