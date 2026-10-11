// Prints a 6-digit sign-in code for an email WITHOUT sending an email —
// for signing in on the hosted project before custom email (SMTP) is set up.
//   npm run auth:code -- you@example.com            (hosted project)
//   npm run auth:code -- you@example.com --local    (local stack)
// Creates the account if it doesn't exist yet. The code is valid for 1 hour.
import { adminClient, ensureUser, parseArgs } from './supabase-admin.mjs';

const { email, local } = parseArgs('Usage: npm run auth:code -- you@example.com [--local]');
const { client, target } = adminClient(local);
await ensureUser(client, email);
const { data, error } = await client.auth.admin.generateLink({ type: 'magiclink', email });
if (error) throw error;
console.log(`\nSign-in code for ${email} on the ${target} database:\n\n    ${data.properties.email_otp}\n`);
console.log('In the app: enter this email, tap "Send my code", then type this code. It expires in 1 hour.');
console.log('(If an email also arrives, ignore it — the code above is what you need.)\n');
