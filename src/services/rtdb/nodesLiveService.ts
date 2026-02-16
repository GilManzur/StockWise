/**
 * nodesLiveService — subscribes to RTDB nodes_live for a location.
 *
 * Path: tenants/{locationId}/nodes_live
 *
 * Returns NodeLiveState domain objects.
 */
import { ref, onValue, off, type DataSnapshot } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { NodeLiveState } from '@/domain/devices';

function toNodeLiveState(nodeId: string, raw: Record<string, unknown>): NodeLiveState {
  return {
    nodeId,
    last_seen:    Number(raw.last_seen ?? 0),
    rssi:         Number(raw.rssi ?? 0),
    error_count:  Number(raw.error_count ?? 0),
    battery:      raw.battery != null ? Number(raw.battery) : undefined,
  };
}

export type NodesLiveCallback = (nodes: Map<string, NodeLiveState>) => void;

/**
 * Subscribe to all nodes_live for a location.
 *
 * @returns unsubscribe function
 */
export function subscribeNodesLive(
  locationId: string,
  callback: NodesLiveCallback,
): () => void {
  const path = `tenants/${locationId}/nodes_live`;
  const dbRef = ref(database, path);

  const handler = (snapshot: DataSnapshot) => {
    const map = new Map<string, NodeLiveState>();

    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, Record<string, unknown>>;
      for (const [nodeId, raw] of Object.entries(data)) {
        map.set(nodeId, toNodeLiveState(nodeId, raw));
      }
    }

    callback(map);
  };

  onValue(dbRef, handler);

  return () => off(dbRef, 'value', handler);
}
