import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import type { Coords } from '@/lib/location';

/** Signed difference a − b in degrees, in (−180, 180]. */
function angleDiff(a: number, b: number): number {
  const d = (((a - b) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

/**
 * Live heading (degrees from north) while enabled, smoothed so markers and
 * cards don't jitter. Null when there's no compass. Foreground only.
 */
export function useHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (raw < 0) return;
      const prev = last.current;
      const next = prev === null ? raw : (prev + 0.3 * angleDiff(raw, prev) + 360) % 360;
      last.current = next;
      setHeading(next);
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => setHeading(null));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);
  return heading;
}

/** Live position while enabled (foreground only; stops as soon as it's turned off). */
export function useLivePosition(enabled: boolean) {
  const [position, setPosition] = useState<Coords | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5 }, (p) =>
      setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
    )
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => setPosition(null));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);
  return position;
}
