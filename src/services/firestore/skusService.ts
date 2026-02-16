/**
 * skusService — Firestore CRUD + subscribe for SKUs.
 *
 * Firestore path: networks/{networkId}/locations/{locationId}/skus/{skuId}
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
import type { SkuConfig } from '@/domain/inventory';

function toSkuConfig(docId: string, data: DocumentData): SkuConfig {
  return {
    skuId:           docId,
    name:            String(data.name ?? ''),
    unitWeightG:     Number(data.unit_weight_g ?? 0),
    toleranceG:      Number(data.tolerance_g ?? 0),
    packagingWeightG: Number(data.packaging_weight_g ?? 0),
    active:          Boolean(data.active ?? true),
  };
}

export type SkuConfigCallback = (skus: Map<string, SkuConfig>) => void;

export function subscribeSkus(
  networkId: string,
  locationId: string,
  callback: SkuConfigCallback,
): Unsubscribe {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/skus`);
  return onSnapshot(ref, (snap) => {
    const map = new Map<string, SkuConfig>();
    for (const d of snap.docs) {
      map.set(d.id, toSkuConfig(d.id, d.data()));
    }
    callback(map);
  });
}

export async function createSku(
  networkId: string,
  locationId: string,
  data: Omit<SkuConfig, 'skuId'>,
): Promise<string> {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/skus`);
  const docRef = await addDoc(ref, {
    name: data.name,
    unit_weight_g: data.unitWeightG,
    tolerance_g: data.toleranceG,
    packaging_weight_g: data.packagingWeightG,
    active: data.active,
  });
  return docRef.id;
}

export async function updateSku(
  networkId: string,
  locationId: string,
  skuId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<void> {
  await updateDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/skus/${skuId}`), updates);
}

export async function deleteSku(
  networkId: string,
  locationId: string,
  skuId: string,
): Promise<void> {
  await deleteDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/skus/${skuId}`));
}
