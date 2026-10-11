// Point the app at the local Supabase stack (reachable from your phone over Wi-Fi)
// or back at the hosted project.
//   npm run db:use-local   -> writes .env.local (overrides .env; git-ignored)
//   npm run db:use-hosted  -> removes .env.local so .env (hosted) applies
// Then restart Expo with `npx expo start --clear` (Metro caches the old values).
import { execSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const target = process.argv[2];

if (target === 'hosted') {
  if (existsSync('.env.local')) rmSync('.env.local');
  console.log('Using the hosted Supabase project from .env. Restart Expo with: npx expo start --clear');
  process.exit(0);
}

if (target !== 'local') {
  console.error('Usage: node scripts/use-supabase.mjs <local|hosted>');
  process.exit(1);
}

const lanIp = Object.values(networkInterfaces())
  .flat()
  .find((iface) => iface && iface.family === 'IPv4' && !iface.internal)?.address;
if (!lanIp) {
  console.error('No Wi-Fi/LAN address found. Connect this computer to the same network as your phone.');
  process.exit(1);
}

let status;
try {
  status = JSON.parse(execSync('supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
} catch {
  console.error('The local Supabase stack is not running. Start Docker Desktop, then run: npm run db:start');
  process.exit(1);
}

writeFileSync(
  '.env.local',
  `# Written by scripts/use-supabase.mjs — local Supabase over Wi-Fi\n` +
    `EXPO_PUBLIC_SUPABASE_URL=http://${lanIp}:54321\n` +
    `EXPO_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}\n`,
);
console.log(`Using local Supabase at http://${lanIp}:54321. Restart Expo with: npx expo start --clear`);
console.log('Sign-in codes arrive in the local inbox: http://127.0.0.1:54324');
