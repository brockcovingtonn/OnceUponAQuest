import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * First-party crash and error reporting: errors go to the client_errors table
 * (admins read them on the Insights screen). Off in development builds.
 */
const ENABLED = !__DEV__;
const PENDING_KEY = 'once-upon-a-quest:pending-errors';
const MAX_PENDING = 20;

type ErrorReport = {
  message: string;
  stack: string | null;
  screen: string | null;
  fatal: boolean;
  occurred_at: string;
  app_version: string | null;
  update_id: string | null;
  runtime_version: string | null;
  platform: string;
};

let currentScreen: string | null = null;

/** Called by the root layout whenever the route changes. */
export function setCurrentScreen(pathname: string) {
  currentScreen = pathname.slice(0, 200);
}

function describe(error: unknown): { message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      message: `${error.name}: ${error.message}`.slice(0, 1000) || 'Unknown error',
      stack: error.stack ? error.stack.slice(0, 6000) : null,
    };
  }
  return { message: String(error).slice(0, 1000) || 'Unknown error', stack: null };
}

function build(error: unknown, fatal: boolean): ErrorReport {
  const { message, stack } = describe(error);
  return {
    message,
    stack,
    screen: currentScreen,
    fatal,
    occurred_at: new Date().toISOString(),
    app_version: Constants.expoConfig?.version ?? null,
    update_id: Updates.updateId ?? null,
    runtime_version: Updates.runtimeVersion ?? null,
    platform: `${Platform.OS} ${String(Platform.Version)}`.slice(0, 40),
  };
}

async function readPending(): Promise<ErrorReport[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as ErrorReport[]) : [];
  } catch {
    return [];
  }
}

async function savePending(reports: ErrorReport[]) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(reports.slice(-MAX_PENDING)));
}

async function send(report: ErrorReport): Promise<boolean> {
  if (!onlineManager.isOnline()) return false;
  const { error } = await supabase.from('client_errors').insert(report);
  return !error;
}

/** Report an error; kept on the phone and retried later if it can't be sent now. */
export async function reportError(error: unknown, options: { fatal?: boolean } = {}) {
  if (!ENABLED) return;
  const report = build(error, options.fatal ?? false);
  try {
    if (await send(report)) return;
  } catch {
    // fall through to saving it for later
  }
  await savePending([...(await readPending()), report]).catch(() => {});
}

/** Send reports saved earlier (after a crash, or while offline). */
export async function flushPendingErrors() {
  if (!ENABLED) return;
  const pending = await readPending();
  if (pending.length === 0) return;
  const unsent: ErrorReport[] = [];
  for (const report of pending) {
    const ok = await send(report).catch(() => false);
    if (!ok) unsent.push(report);
  }
  await savePending(unsent).catch(() => {});
}

/** Catch uncaught JS errors app-wide. A crash is saved to the phone first, then sent on the next launch. */
export function installGlobalErrorHandler() {
  if (!ENABLED) return;
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    const report = build(error, Boolean(isFatal));
    const saved = readPending()
      .then((pending) => savePending([...pending, report]))
      .catch(() => {});
    // Give the save a moment before the default handler takes over (a fatal error ends the app).
    Promise.race([saved, new Promise((resolve) => setTimeout(resolve, 500))]).then(() => {
      if (!isFatal) flushPendingErrors();
      previous(error, isFatal);
    });
  });
}
