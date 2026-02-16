/**
 * shelvesService — Firestore CRUD + subscribe for shelves.
 *
 * Firestore path: networks/{networkId}/locations/{locationId}/shelves/{shelfId}
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
import type { ShelfConfig } from '@/domain/network';

function toShelfConfig(docId: string, data: DocumentData, networkId: string, locationId: string): ShelfConfig {
  return {
    shelfId:    docId,
    locationId,
    networkId,
    name:       String(data.name ?? ''),
    orderIndex: Number(data.order_index ?? 0),
  };
}

export type ShelvesCallback = (shelves: ShelfConfig[]) => void;

export function subscribeShelves(
  networkId: string,
  locationId: string,
  callback: ShelvesCallback,
): Unsubscribe {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/shelves`);
  return onSnapshot(ref, (snap) => {
    const shelves = snap.docs
      .map((d) => toShelfConfig(d.id, d.data(), networkId, locationId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    callback(shelves);
  });
}

export async function createShelf(
  networkId: string,
  locationId: string,
  data: { name: string; orderIndex: number },
): Promise<string> {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/shelves`);
  const docRef = await addDoc(ref, { name: data.name, order_index: data.orderIndex });
  return docRef.id;
}

export async function updateShelf(
  networkId: string,
  locationId: string,
  shelfId: string,
  updates: Partial<{ name: string; order_index: number }>,
): Promise<void> {
  await updateDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/shelves/${shelfId}`), updates);
}

export async function deleteShelf(
  networkId: string,
  locationId: string,
  shelfId: string,
): Promise<void> {
  await deleteDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/shelves/${shelfId}`));
}
