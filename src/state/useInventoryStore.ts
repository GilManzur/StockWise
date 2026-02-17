/**
 * useInventoryStore — single source of truth for live inventory data.
 *
 * Subscribes to Firestore configs (slots, SKUs) and RTDB live state
 * (inventory_live, nodes_live), runs the pure projectLocation() engine,
 * and exposes SlotViewModel[] for the UI.
 *
 * Debounces re-projection by 100 ms to avoid thrashing on rapid RTDB updates.
 */
import { create } from 'zustand';
import type { SlotConfig, SkuConfig, SlotLiveState, SlotViewModel } from '@/domain/inventory';
import { projectLocation } from '@/domain/inventory';
import type { NodeLiveState } from '@/domain/devices';
import {
  subscribeSlotConfigs,
  subscribeSkus,
} from '@/services/firestore';
import {
  subscribeInventoryLive,
  subscribeNodesLive,
} from '@/services/rtdb';

interface InventoryState {
  // ── Raw inputs ─────────────────────────────────────
  slotConfigs: Map<string, SlotConfig>;
  skus: Map<string, SkuConfig>;
  liveStates: Map<string, SlotLiveState>;
  nodesLive: Map<string, NodeLiveState>;

  // ── Projected output ───────────────────────────────
  slots: SlotViewModel[];

  // ── Subscription state ─────────────────────────────
  subscribedLocationId: string | null;
  subscribedNetworkId: string | null;
  loading: boolean;

  // ── Actions ────────────────────────────────────────
  subscribe: (networkId: string, locationId: string) => void;
  unsubscribe: () => void;
}

/** Internal refs — kept outside Zustand to avoid serialization issues. */
let _unsubs: (() => void)[] = [];
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleReproject(get: () => InventoryState, set: (partial: Partial<InventoryState>) => void) {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    const { slotConfigs, liveStates, skus, nodesLive } = get();
    const onlineNodes = new Set(nodesLive.keys());
    const slots = projectLocation(slotConfigs, liveStates, skus, onlineNodes);
    set({ slots, loading: false });
  }, 100);
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  slotConfigs: new Map(),
  skus: new Map(),
  liveStates: new Map(),
  nodesLive: new Map(),
  slots: [],
  subscribedLocationId: null,
  subscribedNetworkId: null,
  loading: false,

  subscribe: (networkId: string, locationId: string) => {
    const state = get();
    // Already subscribed to same location — skip
    if (state.subscribedNetworkId === networkId && state.subscribedLocationId === locationId) return;

    // Tear down previous
    get().unsubscribe();

    set({
      subscribedNetworkId: networkId,
      subscribedLocationId: locationId,
      loading: true,
      slotConfigs: new Map(),
      skus: new Map(),
      liveStates: new Map(),
      nodesLive: new Map(),
      slots: [],
    });

    // Firestore: slot configs (across all shelves)
    const unSlots = subscribeSlotConfigs(networkId, locationId, (configs) => {
      set({ slotConfigs: configs });
      scheduleReproject(get, set);
    });

    // Firestore: SKUs (service already returns Map<skuId, SkuConfig>)
    const unSkus = subscribeSkus(networkId, locationId, (skuMap) => {
      set({ skus: skuMap });
      scheduleReproject(get, set);
    });

    // RTDB: inventory live
    const unInv = subscribeInventoryLive(locationId, (live) => {
      set({ liveStates: live });
      scheduleReproject(get, set);
    });

    // RTDB: nodes live (for online status)
    const unNodes = subscribeNodesLive(locationId, (nodes) => {
      set({ nodesLive: nodes });
      scheduleReproject(get, set);
    });

    _unsubs = [unSlots, unSkus, unInv, unNodes];
  },

  unsubscribe: () => {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _unsubs.forEach((u) => u());
    _unsubs = [];
    set({
      subscribedNetworkId: null,
      subscribedLocationId: null,
      slotConfigs: new Map(),
      skus: new Map(),
      liveStates: new Map(),
      nodesLive: new Map(),
      slots: [],
      loading: false,
    });
  },
}));
