/**
 * slotsService — subscribes to Firestore slot configs across all shelves.
 *
 * Firestore path:
 *   networks/{networkId}/locations/{locationId}/shelves/{shelfId}/slots/{slotId}
 *
 * Strategy: listens to the shelves collection, dynamically spawning
 * per-shelf slot listeners. Returns domain SlotConfig objects.
 */
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { SlotConfig, SlotConfigStatus } from '@/domain/inventory';

function toSlotConfig(
  docId: string,
  data: DocumentData,
  ctx: { shelfId: string; locationId: string; networkId: string },
): SlotConfig {
  return {
    slotId:            docId,
    shelfId:           ctx.shelfId,
    locationId:        ctx.locationId,
    networkId:         ctx.networkId,
    name:              String(data.name ?? ''),
    nodeId:            String(data.node_id ?? ''),
    skuId:             String(data.sku_id ?? ''),
    tareG:             Number(data.tare_g ?? 0),
    calibrationFactor: Number(data.calibration_factor ?? 0),
    hysteresisG:       Number(data.hysteresis_g ?? 0),
    minQtyStep:        Number(data.min_qty_step ?? 1),
    status:            (data.status as SlotConfigStatus) ?? 'provisioning',
  };
}

export type SlotConfigCallback = (configs: Map<string, SlotConfig>) => void;

/**
 * Subscribe to all slot configs for a location across all shelves.
 *
 * Listens to `shelves` collection and spawns per-shelf `slots` listeners.
 *
 * @returns unsubscribe function
 */
export function subscribeSlotConfigs(
  networkId: string,
  locationId: string,
  callback: SlotConfigCallback,
): Unsubscribe {
  const shelvesPath = `networks/${networkId}/locations/${locationId}/shelves`;
  const shelvesRef = collection(firestore, shelvesPath);

  const allConfigs = new Map<string, SlotConfig>();
  const shelfUnsubscribes: Unsubscribe[] = [];
  const configsByShelf = new Map<string, Set<string>>();

  const shelvesUnsub = onSnapshot(shelvesRef, (shelvesSnapshot) => {
    const activeShelfIds = new Set<string>();

    for (const shelfDoc of shelvesSnapshot.docs) {
      const shelfId = shelfDoc.id;
      activeShelfIds.add(shelfId);

      if (configsByShelf.has(shelfId)) continue;
      configsByShelf.set(shelfId, new Set());

      const slotsPath = `${shelvesPath}/${shelfId}/slots`;
      const slotsRef = collection(firestore, slotsPath);
      const ctx = { shelfId, locationId, networkId };

      const slotUnsub = onSnapshot(slotsRef, (slotsSnapshot) => {
        const shelfSlotIds = new Set<string>();

        for (const slotDoc of slotsSnapshot.docs) {
          allConfigs.set(slotDoc.id, toSlotConfig(slotDoc.id, slotDoc.data(), ctx));
          shelfSlotIds.add(slotDoc.id);
        }

        const previousIds = configsByShelf.get(shelfId) ?? new Set();
        for (const oldId of previousIds) {
          if (!shelfSlotIds.has(oldId)) allConfigs.delete(oldId);
        }
        configsByShelf.set(shelfId, shelfSlotIds);

        callback(new Map(allConfigs));
      });

      shelfUnsubscribes.push(slotUnsub);
    }

    // Clean up removed shelves
    for (const [shelfId, slotIds] of configsByShelf.entries()) {
      if (!activeShelfIds.has(shelfId)) {
        for (const slotId of slotIds) allConfigs.delete(slotId);
        configsByShelf.delete(shelfId);
      }
    }

    callback(new Map(allConfigs));
  });

  return () => {
    shelvesUnsub();
    shelfUnsubscribes.forEach((u) => u());
  };
}

/** Create a new slot under a shelf. */
export async function createSlot(
  networkId: string,
  locationId: string,
  shelfId: string,
  data: Omit<SlotConfig, 'slotId' | 'shelfId' | 'locationId' | 'networkId'>,
): Promise<string> {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/shelves/${shelfId}/slots`);
  const docRef = await addDoc(ref, {
    name: data.name,
    node_id: data.nodeId,
    sku_id: data.skuId,
    tare_g: data.tareG,
    calibration_factor: data.calibrationFactor,
    hysteresis_g: data.hysteresisG,
    min_qty_step: data.minQtyStep,
    status: data.status,
  });
  return docRef.id;
}

/** Update a slot. */
export async function updateSlot(
  networkId: string,
  locationId: string,
  shelfId: string,
  slotId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<void> {
  const ref = doc(firestore, `networks/${networkId}/locations/${locationId}/shelves/${shelfId}/slots/${slotId}`);
  await updateDoc(ref, updates);
}

/** Delete a slot. */
export async function deleteSlot(
  networkId: string,
  locationId: string,
  shelfId: string,
  slotId: string,
): Promise<void> {
  const ref = doc(firestore, `networks/${networkId}/locations/${locationId}/shelves/${shelfId}/slots/${slotId}`);
  await deleteDoc(ref);
}
