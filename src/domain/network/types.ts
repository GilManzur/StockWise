/**
 * Network domain types — pure TypeScript, no Firebase/React imports.
 *
 * These map 1:1 to the official Firestore schema under networks/{networkId}/...
 */

// ── Enums / Unions ──────────────────────────────────────────

export type NetworkStatus = 'active' | 'suspended' | 'archived';
export type LocationStatus = 'active' | 'inactive';
export type MemberRole = 'network_admin' | 'manager' | 'viewer';
export type DeviceStatus = 'provisioning' | 'online' | 'offline' | 'decommissioned';
export type NodeStatus = 'provisioning' | 'online' | 'offline' | 'error';

// ── Interfaces ──────────────────────────────────────────────

/** networks/{networkId} */
export interface NetworkConfig {
  networkId: string;
  name: string;
  createdAt: string;
  status: NetworkStatus;
}

/** networks/{networkId}/locations/{locationId} */
export interface LocationConfig {
  locationId: string;
  networkId: string;
  name: string;
  timezone: string;
  createdAt: string;
  status: LocationStatus;
}

/** networks/{networkId}/members/{uid} */
export interface MemberConfig {
  uid: string;
  networkId: string;
  role: MemberRole;
}

/** networks/{networkId}/locations/{locationId}/shelves/{shelfId} */
export interface ShelfConfig {
  shelfId: string;
  locationId: string;
  networkId: string;
  name: string;
  orderIndex: number;
}

/** networks/{networkId}/locations/{locationId}/devices/{brainId} */
export interface DeviceConfig {
  brainId: string;
  locationId: string;
  networkId: string;
  type: 'brain';
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeen: string;
  ipAddress: string;
}

/** networks/{networkId}/locations/{locationId}/nodes/{nodeId} */
export interface NodeConfig {
  nodeId: string;           // MAC hex — also the Firestore doc ID
  locationId: string;
  networkId: string;
  nodeMac: string;
  pairedToBrain: string;    // brainId UUID
  firmwareVersion: string;
  lastSeen: string;
  rssi: number;
  errorCounters: Record<string, number>;
  status: NodeStatus;
}
