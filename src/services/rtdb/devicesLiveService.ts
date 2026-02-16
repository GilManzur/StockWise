/**
 * devicesLiveService — subscribes to RTDB devices_live for a location.
 *
 * Path: tenants/{locationId}/devices_live
 *
 * Returns BrainLiveState domain objects.
 */
import { ref, onValue, off, type DataSnapshot } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { BrainLiveState } from '@/domain/devices';

function toBrainLiveState(brainId: string, raw: Record<string, unknown>): BrainLiveState {
  return {
    brainId,
    last_seen:        Number(raw.last_seen ?? 0),
    firmware_version: String(raw.firmware_version ?? ''),
    ip:               String(raw.ip ?? ''),
    queue_depth:      Number(raw.queue_depth ?? 0),
    error_count:      Number(raw.error_count ?? 0),
  };
}

export type DevicesLiveCallback = (brains: Map<string, BrainLiveState>) => void;

/**
 * Subscribe to all devices_live (brains) for a location.
 *
 * @returns unsubscribe function
 */
export function subscribeDevicesLive(
  locationId: string,
  callback: DevicesLiveCallback,
): () => void {
  const path = `tenants/${locationId}/devices_live`;
  const dbRef = ref(database, path);

  const handler = (snapshot: DataSnapshot) => {
    const map = new Map<string, BrainLiveState>();

    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, Record<string, unknown>>;
      for (const [brainId, raw] of Object.entries(data)) {
        map.set(brainId, toBrainLiveState(brainId, raw));
      }
    }

    callback(map);
  };

  onValue(dbRef, handler);

  return () => off(dbRef, 'value', handler);
}
