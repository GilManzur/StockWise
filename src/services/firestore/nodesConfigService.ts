/**
 * nodesConfigService — Firestore CRUD + subscribe for ESP8266 nodes.
 *
 * Firestore path: networks/{networkId}/locations/{locationId}/nodes/{nodeId}
 *
 * nodeId = MAC hex string (48-bit), used as doc ID.
 */
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { NodeConfig, NodeStatus } from '@/domain/network';

function toNodeConfig(docId: string, data: DocumentData, networkId: string, locationId: string): NodeConfig {
  return {
    nodeId:          docId,
    locationId,
    networkId,
    nodeMac:         String(data.node_mac ?? docId),
    pairedToBrain:   String(data.paired_to_brain ?? ''),
    firmwareVersion: String(data.firmware_version ?? ''),
    lastSeen:        String(data.last_seen ?? ''),
    rssi:            Number(data.rssi ?? 0),
    errorCounters:   (data.error_counters as Record<string, number>) ?? {},
    status:          (data.status as NodeStatus) ?? 'provisioning',
  };
}

export type NodesConfigCallback = (nodes: NodeConfig[]) => void;

export function subscribeNodesConfig(
  networkId: string,
  locationId: string,
  callback: NodesConfigCallback,
): Unsubscribe {
  const ref = collection(firestore, `networks/${networkId}/locations/${locationId}/nodes`);
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => toNodeConfig(d.id, d.data(), networkId, locationId)));
  });
}

/** Register a node — uses MAC as doc ID (setDoc, not addDoc). */
export async function registerNode(
  networkId: string,
  locationId: string,
  nodeId: string,
  data: Partial<{ paired_to_brain: string; firmware_version: string; status: NodeStatus }>,
): Promise<void> {
  await setDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/nodes/${nodeId}`), {
    node_mac: nodeId,
    status: 'provisioning',
    ...data,
  });
}

export async function updateNode(
  networkId: string,
  locationId: string,
  nodeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<void> {
  await updateDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/nodes/${nodeId}`), updates);
}

export async function deleteNode(
  networkId: string,
  locationId: string,
  nodeId: string,
): Promise<void> {
  await deleteDoc(doc(firestore, `networks/${networkId}/locations/${locationId}/nodes/${nodeId}`));
}
