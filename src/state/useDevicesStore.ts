/**
 * useDevicesStore — merges Firestore device/node configs with RTDB live state.
 *
 * Provides combined views for the Admin Devices + Nodes pages.
 */
import { create } from 'zustand';
import type { DeviceConfig, NodeConfig } from '@/domain/network';
import type { BrainLiveState, NodeLiveState } from '@/domain/devices';
import {
  subscribeDevicesConfig,
  subscribeNodesConfig,
} from '@/services/firestore';
import {
  subscribeDevicesLive,
  subscribeNodesLive,
} from '@/services/rtdb';

// ── View models (config + live merged) ──────────────────────

export interface BrainViewModel extends DeviceConfig {
  live: BrainLiveState | null;
  isOnline: boolean;
}

export interface NodeViewModel extends NodeConfig {
  live: NodeLiveState | null;
  isOnline: boolean;
}

// ── Store ────────────────────────────────────────────────────

interface DevicesState {
  brainConfigs: DeviceConfig[];
  nodeConfigs: NodeConfig[];
  brainsLive: Map<string, BrainLiveState>;
  nodesLive: Map<string, NodeLiveState>;

  brains: BrainViewModel[];
  nodes: NodeViewModel[];

  subscribedNetworkId: string | null;
  subscribedLocationId: string | null;
  loading: boolean;

  subscribe: (networkId: string, locationId: string) => void;
  unsubscribe: () => void;
}

let _unsubs: (() => void)[] = [];

function reproject(get: () => DevicesState, set: (p: Partial<DevicesState>) => void) {
  const { brainConfigs, nodeConfigs, brainsLive, nodesLive } = get();

  const brains: BrainViewModel[] = brainConfigs.map((cfg) => {
    const live = brainsLive.get(cfg.brainId) ?? null;
    return { ...cfg, live, isOnline: live !== null };
  });

  const nodes: NodeViewModel[] = nodeConfigs.map((cfg) => {
    const live = nodesLive.get(cfg.nodeId) ?? null;
    return { ...cfg, live, isOnline: live !== null };
  });

  set({ brains, nodes, loading: false });
}

export const useDevicesStore = create<DevicesState>()((set, get) => ({
  brainConfigs: [],
  nodeConfigs: [],
  brainsLive: new Map(),
  nodesLive: new Map(),
  brains: [],
  nodes: [],
  subscribedNetworkId: null,
  subscribedLocationId: null,
  loading: false,

  subscribe: (networkId, locationId) => {
    const s = get();
    if (s.subscribedNetworkId === networkId && s.subscribedLocationId === locationId) return;
    get().unsubscribe();

    set({
      subscribedNetworkId: networkId,
      subscribedLocationId: locationId,
      loading: true,
      brainConfigs: [],
      nodeConfigs: [],
      brainsLive: new Map(),
      nodesLive: new Map(),
      brains: [],
      nodes: [],
    });

    const u1 = subscribeDevicesConfig(networkId, locationId, (configs) => {
      set({ brainConfigs: configs });
      reproject(get, set);
    });

    const u2 = subscribeNodesConfig(networkId, locationId, (configs) => {
      set({ nodeConfigs: configs });
      reproject(get, set);
    });

    const u3 = subscribeDevicesLive(locationId, (live) => {
      set({ brainsLive: live });
      reproject(get, set);
    });

    const u4 = subscribeNodesLive(locationId, (live) => {
      set({ nodesLive: live });
      reproject(get, set);
    });

    _unsubs = [u1, u2, u3, u4];
  },

  unsubscribe: () => {
    _unsubs.forEach((u) => u());
    _unsubs = [];
    set({
      subscribedNetworkId: null,
      subscribedLocationId: null,
      brainConfigs: [],
      nodeConfigs: [],
      brainsLive: new Map(),
      nodesLive: new Map(),
      brains: [],
      nodes: [],
      loading: false,
    });
  },
}));
