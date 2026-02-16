/**
 * slotConfigService — subscribes to Firestore slot configs across all shelves.
 *
 * Firestore path:
 *   networks/{networkId}/locations/{locationId}/shelves/{shelfId}/slots/{slotId}
 *
 * Strategy: uses collectionGroup('slots') scoped by a location's shelf parents.
 * Since collectionGroup queries are global, we filter client-side by locationId + networkId.
 *
 * Alternative: subscribe per-shelf if collectionGroup security rules are restrictive.
 */
import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { SlotConfig } from '@/domain/inventory';

function toSlotConfig(docId: string, data: DocumentData, shelfRef: { shelfId: string; shelfLabel?: string }): SlotConfig {
  return {
    slotId:               docId,
    shelfId:              shelfRef.shelfId,
    locationId:           String(data.locationId ?? ''),
    networkId:            String(data.networkId ?? ''),
    shelfLabel:           String(data.shelfLabel ?? shelfRef.shelfLabel ?? ''),
    skuId:                String(data.skuId ?? ''),
    skuName:              String(data.skuName ?? ''),
    unitWeightGrams:      Number(data.unitWeightGrams ?? 0),
    maxQuantity:          Number(data.maxQuantity ?? 0),
    lowThresholdPct:      Number(data.lowThresholdPct ?? 0.2),
    nodeId:               String(data.nodeId ?? ''),
    brainId:              String(data.brainId ?? ''),
    calibrationTareGrams: Number(data.calibrationTareGrams ?? 0),
    isActive:             Boolean(data.isActive ?? false),
    createdAt:            String(data.createdAt ?? ''),
  };
}

export type SlotConfigCallback = (configs: Map<string, SlotConfig>) => void;

/**
 * Subscribe to all slot configs for a specific location across all its shelves.
 *
 * Uses per-shelf listeners under:
 *   networks/{networkId}/locations/{locationId}/shelves
 *
 * Each shelf's `slots` sub-collection is listened to independently.
 * This avoids collectionGroup security rule complexity.
 *
 * @returns unsubscribe function that cleans up ALL shelf listeners
 */
export function subscribeSlotConfigs(
  networkId: string,
  locationId: string,
  callback: SlotConfigCallback,
): Unsubscribe {
  const shelvesPath = `networks/${networkId}/locations/${locationId}/shelves`;
  const shelvesRef = collection(firestore, shelvesPath);

  // Accumulated configs across all shelves
  const allConfigs = new Map<string, SlotConfig>();
  const shelfUnsubscribes: Unsubscribe[] = [];

  // Track per-shelf configs so we can remove stale ones on shelf changes
  const configsByShelf = new Map<string, Set<string>>();

  // Listen to the shelves collection to discover shelf IDs
  const shelvesUnsub = onSnapshot(shelvesRef, (shelvesSnapshot) => {
    const activeShelfIds = new Set<string>();

    for (const shelfDoc of shelvesSnapshot.docs) {
      const shelfId = shelfDoc.id;
      const shelfLabel = String(shelfDoc.data().label ?? shelfDoc.data().shelfLabel ?? '');
      activeShelfIds.add(shelfId);

      // Skip if we already have a listener for this shelf
      if (configsByShelf.has(shelfId)) continue;

      configsByShelf.set(shelfId, new Set());

      // Subscribe to this shelf's slots
      const slotsPath = `${shelvesPath}/${shelfId}/slots`;
      const slotsRef = collection(firestore, slotsPath);

      const slotUnsub = onSnapshot(slotsRef, (slotsSnapshot) => {
        const shelfSlotIds = new Set<string>();

        for (const slotDoc of slotsSnapshot.docs) {
          const config = toSlotConfig(slotDoc.id, slotDoc.data(), { shelfId, shelfLabel });
          // Ensure locationId/networkId are set even if not stored in doc
          config.locationId = config.locationId || locationId;
          config.networkId = config.networkId || networkId;
          allConfigs.set(slotDoc.id, config);
          shelfSlotIds.add(slotDoc.id);
        }

        // Remove slots that were deleted from this shelf
        const previousIds = configsByShelf.get(shelfId) ?? new Set();
        for (const oldId of previousIds) {
          if (!shelfSlotIds.has(oldId)) {
            allConfigs.delete(oldId);
          }
        }
        configsByShelf.set(shelfId, shelfSlotIds);

        // Emit updated full map
        callback(new Map(allConfigs));
      });

      shelfUnsubscribes.push(slotUnsub);
    }

    // Clean up removed shelves
    for (const [shelfId, slotIds] of configsByShelf.entries()) {
      if (!activeShelfIds.has(shelfId)) {
        for (const slotId of slotIds) {
          allConfigs.delete(slotId);
        }
        configsByShelf.delete(shelfId);
      }
    }

    callback(new Map(allConfigs));
  });

  return () => {
    shelvesUnsub();
    shelfUnsubscribes.forEach((unsub) => unsub());
  };
}
