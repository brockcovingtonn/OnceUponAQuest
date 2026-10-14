/**
 * Passport milestones, worked out from progress the app already has: no extra
 * data is stored. Pure, so it can be tested on its own.
 */

import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type MilestoneKey = 'firstStamp' | 'firstSnack' | 'threeDays' | 'tenStamps' | 'firstLens';

export type Milestone = { key: MilestoneKey; icon: ComponentProps<typeof Ionicons>['name']; earned: boolean };

/** The park's calendar day (Anaheim time) for a timestamp, as YYYY-MM-DD. */
export function parkDay(iso: string): string {
  const date = new Date(iso);
  try {
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  } catch {
    // Without time-zone support, Pacific time is close enough for counting visits.
    return new Date(date.getTime() - 8 * 3600 * 1000).toISOString().slice(0, 10);
  }
}

/** Distinct park days with at least one stamp. */
export function countParkDays(foundAt: Iterable<string>): number {
  const days = new Set<string>();
  for (const iso of foundAt) days.add(parkDay(iso));
  return days.size;
}

export function computeMilestones(input: { foundAt: string[]; snackCount: number; lensCount: number }): Milestone[] {
  const stamps = input.foundAt.length;
  const days = countParkDays(input.foundAt);
  return [
    { key: 'firstStamp', icon: 'star', earned: stamps >= 1 },
    { key: 'firstSnack', icon: 'ice-cream', earned: input.snackCount >= 1 },
    { key: 'threeDays', icon: 'calendar', earned: days >= 3 },
    { key: 'tenStamps', icon: 'ribbon', earned: stamps >= 10 },
    { key: 'firstLens', icon: 'aperture', earned: input.lensCount >= 1 },
  ];
}
