/**
 * networksService — Firestore CRUD + subscribe for networks collection.
 *
 * Firestore path: networks/{networkId}
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
import type { NetworkConfig, NetworkStatus } from '@/domain/network';

function toNetworkConfig(docId: string, data: DocumentData): NetworkConfig {
  return {
    networkId: docId,
    name:      String(data.name ?? ''),
    createdAt: String(data.created_at ?? ''),
    status:    (data.status as NetworkStatus) ?? 'active',
  };
}

export type NetworksCallback = (networks: NetworkConfig[]) => void;

export function subscribeNetworks(callback: NetworksCallback): Unsubscribe {
  const ref = collection(firestore, 'networks');
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => toNetworkConfig(d.id, d.data())));
  });
}

export async function createNetwork(name: string): Promise<string> {
  const ref = collection(firestore, 'networks');
  const docRef = await addDoc(ref, { name, created_at: serverTimestamp(), status: 'active' });
  return docRef.id;
}

export async function updateNetwork(networkId: string, updates: Partial<{ name: string; status: NetworkStatus }>): Promise<void> {
  await updateDoc(doc(firestore, 'networks', networkId), updates);
}

export async function deleteNetwork(networkId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'networks', networkId));
}
