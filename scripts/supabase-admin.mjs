// Shared helper for admin scripts: a Supabase client with the service role,
// for the hosted project (default) or the local stack (--local). The key is
// read from the Supabase CLI at run time and never written to disk.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const run = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();

export function parseArgs(usage) {
  const args = process.argv.slice(2);
  const local = args.includes('--local');
  const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
  if (!email || !/^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/.test(email)) {
    console.error(usage);
    process.exit(1);
  }
  return { email, local };
}

export function adminClient(local) {
  if (local) {
    const status = JSON.parse(run('supabase status -o json'));
    return { url: status.API_URL, client: createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } }), target: 'local' };
  }
  const ref = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
  const keys = JSON.parse(run(`supabase projects api-keys --project-ref ${ref} -o json`));
  const list = Array.isArray(keys) ? keys : (keys.keys ?? keys.api_keys ?? []);
  const service = list.find((k) => k.name === 'service_role');
  if (!service) throw new Error('Could not read the service_role key. Run `supabase login` first.');
  const url = `https://${ref}.supabase.co`;
  return { url, client: createClient(url, service.api_key, { auth: { persistSession: false } }), target: `hosted (${ref})` };
}

/** Make sure a sign-in account exists for this email; returns its id. */
export async function ensureUser(client, email) {
  const created = await client.auth.admin.createUser({ email, email_confirm: true });
  if (!created.error) return created.data.user.id;
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) throw created.error;
  }
}
