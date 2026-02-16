/**
 * devicesConfigService — Firestore CRUD + subscribe for brain devices.
 *
 * Firestore path: networks/{networkId}/locations/{locationId}/devices/{brainId}
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
import type { DeviceConfig, DeviceStatus } from '@/domain/network';

function toDeviceConfig(docId: string, data: DocumentData, networkId: string, locationId: string): DeviceConfig {
  return {
    brainId:         docId,
    locationId,
    networkId,
    type:            'brain',
    status:          (data.status as DeviceStatus) ?? 'provisioning',
    firmwareVersion: String(data.firmware_version ?? ''),
    lastSeen:        String(data.last_seen ?? ''),
    ipAddress:       String(data.ip_address ?? ''),
  };
}

export type DevicesConfigCallback = (devices: DeviceConfig[]) => void;

export function subscribeDevicesConfig(
  networkId: string,
  locationId: string,
  callback: DevicesConfigCallback,
): Unsubscribe {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/devices`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => toDeviceConfig(d.id, d.data(), networkId, locationId)));
  });
}

export async function createDevice(
  networkId: string,
  locationId: string,
  data: Partial<{ status: DeviceStatus; firmware_version: string; ip_address: string }>,
): Promise<string> {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/devices`);
  const docRef = await addDoc(ref, { type: 'brain', status: 'provisioning', ...data });
  return docRef.id;
}

export async function updateDevice(
  networkId: string,
  locationId: string,
  brainId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<void> {
  await updateDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/devices/${brainId}`), updates);
}

export async function decommissionDevice(
  networkId: string,
  locationId: string,
  brainId: string,
): Promise<void> {
  await updateDevice(networkId, locationId, brainId, { status: 'decommissioned' });
}
