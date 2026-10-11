import * as ImagePicker from 'expo-image-picker';

import { getLocationPermission, type LocationPermission } from '@/lib/location';

export type PermissionState = LocationPermission;

export type PermissionStatuses = { location: PermissionState; camera: PermissionState };

/** Current location + camera permission, for the Settings rows. Never prompts. */
export async function getPermissionStatuses(): Promise<PermissionStatuses> {
  const [location, camera] = await Promise.all([
    getLocationPermission(),
    ImagePicker.getCameraPermissionsAsync(),
  ]);
  return {
    location,
    camera: camera.granted ? 'granted' : camera.canAskAgain ? 'undetermined' : 'denied',
  };
}
