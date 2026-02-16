/**
 * locationsService — Firestore CRUD + subscribe for locations.
 *
 * Firestore path: networks/{networkId}/locations/{locationId}
 */
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { LocationConfig, LocationStatus } from '@/domain/network';

function toLocationConfig(docId: string, data: DocumentData, networkId: string): LocationConfig {
  return {
    locationId: docId,
    networkId,
    name:       String(data.name ?? ''),
    timezone:   String(data.timezone ?? 'UTC'),
    createdAt:  String(data.created_at ?? ''),
    status:     (data.status as LocationStatus) ?? 'active',
  };
}

export type LocationsCallback = (locations: LocationConfig[]) => void;

export function subscribeLocations(networkId: string, callback: LocationsCallback): Unsubscribe {
  const ref = collection(firestore, `networks/${networkId}/locations`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => toLocationConfig(d.id, d.data(), networkId)));
  });
}

export async function createLocation(
  networkId: string,
  data: { name: string; timezone: string },
): Promise<string> {
  const ref = collection(firestore, `networks/${networkId}/locations`);
  const docRef = await addDoc(ref, { ...data, created_at: serverTimestamp(), status: 'active' });
  return docRef.id;
}

export async function updateLocation(
  networkId: string,
  locationId: string,
  updates: Partial<{ name: string; timezone: string; status: LocationStatus }>,
): Promise<void> {
  await updateDoc(doc(firestore, `networks/${networkId}/locations/${locationId}`), updates);
}

export async function deleteLocation(networkId: string, locationId: string): Promise<void> {
  await deleteDoc(doc(firestore, `networks/${networkId}/locations/${locationId}`));
}
