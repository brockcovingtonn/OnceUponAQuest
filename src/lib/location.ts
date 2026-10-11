import * as Location from 'expo-location';
import { Linking } from 'react-native';

export type LocationPermission = 'granted' | 'undetermined' | 'denied';

export type Coords = { lat: number; lng: number };

/** Foreground permission only. "undetermined" means we may still ask. */
export async function getLocationPermission(): Promise<LocationPermission> {
  const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  return canAskAgain ? 'undetermined' : 'denied';
}

export async function requestLocationPermission(): Promise<boolean> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  return granted;
}

const LOCATION_TIMEOUT_MS = 15_000;

export async function getCurrentCoords(): Promise<Coords> {
  const position = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Location timed out')), LOCATION_TIMEOUT_MS),
    ),
  ]);
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

/** Great-circle distance in meters (same formula as private.distance_m). */
export function distanceMeters(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Server allows radius_m plus this tolerance (see check_in in the migration). */
export const LOCATION_TOLERANCE_M = 25;

export function openAppSettings() {
  Linking.openSettings();
}
