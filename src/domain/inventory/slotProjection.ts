/**
 * slotProjection — pure functions that merge Firestore config + RTDB live
 * data + SKU config into a SlotViewModel.
 *
 * ⚠️  No Firebase / React imports allowed in this file.
 */
import type { SlotConfig } from './SlotConfig';
import type { SkuConfig } from './SkuConfig';
import type { SlotLiveState } from './SlotLiveState';
import type { SlotViewModel } from './SlotViewModel';
import {
  SlotStatus,
  FLAGS,
  STATUS_LABELS,
  STALE_THRESHOLD_MS,
} from './SlotStatus';

/** Default absolute quantity threshold for LOW status. */
export const DEFAULT_LOW_THRESHOLD = 2;

/**
 * Resolve the single highest-priority status for a slot.
 *
 * Priority chain (highest → lowest):
 *   OFFLINE_NODE → STALE → ERROR_SENSOR → CALIBRATING → UNCALIBRATED → EMPTY → LOW → OK
 *
 * @param config       Firestore slot configuration
 * @param live         RTDB live state (null if no data received yet)
 * @param nodeOnline   Whether the node exists in nodes_live and is reporting
 * @param now          Current timestamp for stale calculation (injectable for tests)
 * @param lowThreshold Absolute quantity at or below which status becomes LOW
 */
export function resolveStatus(
  config: SlotConfig,
  live: SlotLiveState | null,
  nodeOnline: boolean,
  now: number = Date.now(),
  lowThreshold: number = DEFAULT_LOW_THRESHOLD,
): SlotStatus {
  // 1. OFFLINE — no live data whatsoever OR node not present in nodes_live
  if (!live || !nodeOnline) {
    return SlotStatus.OFFLINE_NODE;
  }

  // 2. STALE — live data exists but is too old
  if (now - live.updated_at > STALE_THRESHOLD_MS) {
    return SlotStatus.STALE;
  }

  // 3. ERROR_SENSOR — bit 2 (0x04)
  if (live.flags & FLAGS.SENSOR_ERROR) {
    return SlotStatus.ERROR_SENSOR;
  }

  // 4. CALIBRATING — bit 3 (0x08) means the brain is actively calibrating
  if (live.flags & FLAGS.CALIBRATION_MODE) {
    return SlotStatus.CALIBRATING;
  }

  // 5. UNCALIBRATED — tare was never set
  if (config.tareG === 0) {
    return SlotStatus.UNCALIBRATED;
  }

  // 6–8. Quantity-based statuses
  if (live.quantity <= 0) return SlotStatus.EMPTY;
  if (live.quantity <= lowThreshold) return SlotStatus.LOW;

  return SlotStatus.OK;
}

/**
 * Project a single slot from config + live data + SKU into a fully resolved ViewModel.
 */
export function projectSlot(
  config: SlotConfig,
  live: SlotLiveState | null,
  sku: SkuConfig | null,
  nodeOnline: boolean,
  now: number = Date.now(),
  lowThreshold: number = DEFAULT_LOW_THRESHOLD,
): SlotViewModel {
  const status = resolveStatus(config, live, nodeOnline, now, lowThreshold);

  return {
    // Identity
    slotId: config.slotId,
    shelfId: config.shelfId,
    locationId: config.locationId,
    networkId: config.networkId,
    slotName: config.name,

    // Product
    skuId: config.skuId,
    skuName: sku?.name ?? '',
    quantity: live?.quantity ?? 0,
    confidence: live?.confidence ?? 0,
    netWeightG: live?.net_weight_g ?? 0,

    // Resolved status
    status,
    statusLabel: STATUS_LABELS[status],
    isStale: status === SlotStatus.STALE,
    isOffline: status === SlotStatus.OFFLINE_NODE,
    hasError: status === SlotStatus.ERROR_SENSOR,

    // Flag-derived booleans
    isOverloaded: live ? !!(live.flags & FLAGS.OVERLOAD) : false,
    isCalibrating: live ? !!(live.flags & FLAGS.CALIBRATION_MODE) : false,
    isWeightStable: live ? !!(live.flags & FLAGS.STABLE_WEIGHT) : false,

    // Hardware refs
    nodeId: config.nodeId,
    updatedAt: live?.updated_at ?? 0,
    flags: live?.flags ?? 0,
    seq: live?.seq ?? 0,

    // Meta
    isActive: config.status === 'active',
  };
}

/**
 * Batch-project an entire location's slots.
 *
 * @param configs      Map<slotId, SlotConfig>
 * @param liveStates   Map<slotId, SlotLiveState>
 * @param skus         Map<skuId, SkuConfig>
 * @param onlineNodes  Set of nodeId (MAC) strings currently present in nodes_live
 * @param now          Injectable timestamp
 * @param lowThreshold Absolute quantity threshold for LOW status
 */
export function projectLocation(
  configs: Map<string, SlotConfig>,
  liveStates: Map<string, SlotLiveState>,
  skus: Map<string, SkuConfig>,
  onlineNodes: Set<string>,
  now: number = Date.now(),
  lowThreshold: number = DEFAULT_LOW_THRESHOLD,
): SlotViewModel[] {
  const results: SlotViewModel[] = [];

  configs.forEach((config) => {
    if (config.status !== 'active') return;

    const live = liveStates.get(config.slotId) ?? null;
    const sku = skus.get(config.skuId) ?? null;
    const nodeOnline = onlineNodes.has(config.nodeId);

    results.push(projectSlot(config, live, sku, nodeOnline, now, lowThreshold));
  });

  return results;
}
