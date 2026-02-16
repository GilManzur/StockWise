/**
 * inventoryLiveService — subscribes to RTDB inventory_live for a location.
 *
 * Path: tenants/{locationId}/inventory_live
 *
 * Returns SlotLiveState domain objects (no Firebase types leak out).
 */
import { ref, onValue, off, type DataSnapshot } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { SlotLiveState } from '@/domain/inventory';

/** Parse a single RTDB child into a SlotLiveState. */
function toSlotLiveState(slotId: string, raw: Record<string, unknown>): SlotLiveState {
  return {
    slotId,
    net_weight_g: Number(raw.net_weight_g ?? 0),
    quantity:     Number(raw.quantity ?? 0),
    updated_at:   Number(raw.updated_at ?? 0),
    confidence:   Number(raw.confidence ?? 0),
    flags:        Number(raw.flags ?? 0),
    source_node:  String(raw.source_node ?? ''),
    seq:          Number(raw.seq ?? 0),
  };
}

export type InventoryLiveCallback = (slots: Map<string, SlotLiveState>) => void;

/**
 * Subscribe to all inventory_live slots for a location.
 *
 * @returns unsubscribe function
 */
export function subscribeInventoryLive(
  locationId: string,
  callback: InventoryLiveCallback,
): () => void {
  const path = `tenants/${locationId}/inventory_live`;
  const dbRef = ref(database, path);

  const handler = (snapshot: DataSnapshot) => {
    const map = new Map<string, SlotLiveState>();

    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, Record<string, unknown>>;
      for (const [slotId, raw] of Object.entries(data)) {
        map.set(slotId, toSlotLiveState(slotId, raw));
      }
    }

    callback(map);
  };

  onValue(dbRef, handler);

  return () => off(dbRef, 'value', handler);
}
