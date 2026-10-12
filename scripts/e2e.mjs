// Smoke tests with Maestro on the iOS Simulator, against the local Supabase stack.
//   npm run e2e:build   build a Release app for the simulator (pointed at local Supabase); rerun after app changes
//   npm run e2e         run .maestro/smoke.yaml, then delete the test accounts it created
// Needs: Docker + `npm run db:start`, Xcode with an iPhone simulator, Maestro, and Java 17
// (Homebrew's openjdk@17 is picked up automatically).
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SIMULATOR = process.env.E2E_SIMULATOR ?? 'iPhone 17';
const run = (cmd, opts = {}) => execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();

function localStack() {
  try {
    return JSON.parse(run('supabase status -o json'));
  } catch {
    console.error('The local Supabase stack is not running. Start Docker Desktop, then run: npm run db:start');
    process.exit(1);
  }
}

function javaEnv() {
  const brewJava = '/opt/homebrew/opt/openjdk@17';
  if (process.env.JAVA_HOME || !existsSync(brewJava)) return process.env;
  return { ...process.env, JAVA_HOME: brewJava, PATH: `${brewJava}/bin:${process.env.PATH}` };
}

function bootSimulator() {
  spawnSync('xcrun', ['simctl', 'boot', SIMULATOR], { stdio: 'ignore' });
  spawnSync('open', ['-a', 'Simulator'], { stdio: 'ignore' });
}

function cleanup() {
  const sql = "delete from auth.users where email like 'e2e-%@example.com'";
  const result = spawnSync('docker', ['exec', '-i', 'supabase_db_once-upon-a-quest', 'psql', '-U', 'postgres', '-At', '-c', sql]);
  console.log(`Cleaned up test accounts: ${result.stdout.toString().trim() || 'none'}`);
}

const command = process.argv[2];
const stack = localStack();

if (command === 'build') {
  bootSimulator();
  const env = {
    ...process.env,
    // The simulator shares the Mac's network, so 127.0.0.1 reaches the local stack.
    EXPO_PUBLIC_SUPABASE_URL: stack.API_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: stack.ANON_KEY,
  };
  const result = spawnSync('npx', ['expo', 'run:ios', '--configuration', 'Release', '--device', SIMULATOR, '--no-bundler'], {
    stdio: 'inherit',
    env,
  });
  process.exit(result.status ?? 1);
} else if (command === 'test') {
  bootSimulator();
  const result = spawnSync('maestro', ['test', '.maestro/smoke.yaml', ...process.argv.slice(3)], {
    stdio: 'inherit',
    env: javaEnv(),
  });
  cleanup();
  process.exit(result.status ?? 1);
} else {
  console.error('Usage: node scripts/e2e.mjs <build|test>');
  process.exit(1);
}
