/**
 * slotProjection — pure functions that merge Firestore config + RTDB live
 * data into a SlotViewModel.
 *
 * ⚠️  No Firebase / React imports allowed in this file.
 */
import { SlotConfig } from './SlotConfig';
import { SlotLiveState } from './SlotLiveState';
import { SlotViewModel } from './SlotViewModel';
import {
  SlotStatus,
  FLAGS,
  STATUS_LABELS,
  STALE_THRESHOLD_MS,
} from './SlotStatus';

/**
 * Resolve the single highest-priority status for a slot.
 *
 * Priority chain (highest → lowest):
 *   OFFLINE_NODE → STALE → ERROR_SENSOR → CALIBRATING → UNCALIBRATED → EMPTY → LOW → OK
 *
 * @param config      Firestore slot configuration
 * @param live        RTDB live state (null if no data received yet)
 * @param nodeOnline  Whether the node exists in nodes_live and is reporting
 * @param now         Current timestamp for stale calculation (injectable for tests)
 */
export function resolveStatus(
  config: SlotConfig,
  live: SlotLiveState | null,
  nodeOnline: boolean,
  now: number = Date.now(),
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

  // 5. UNCALIBRATED — config says tare was never set
  if (config.calibrationTareGrams === 0) {
    return SlotStatus.UNCALIBRATED;
  }

  // 6–8. Quantity-based statuses
  const fillPct =
    config.maxQuantity > 0 ? live.quantity / config.maxQuantity : 0;

  if (live.quantity <= 0) return SlotStatus.EMPTY;
  if (fillPct <= config.lowThresholdPct) return SlotStatus.LOW;

  return SlotStatus.OK;
}

/**
 * Project a single slot from config + live data into a fully resolved ViewModel.
 */
export function projectSlot(
  config: SlotConfig,
  live: SlotLiveState | null,
  nodeOnline: boolean,
  now: number = Date.now(),
): SlotViewModel {
  const status = resolveStatus(config, live, nodeOnline, now);

  const fillPct =
    live && config.maxQuantity > 0 ? live.quantity / config.maxQuantity : 0;

  return {
    // Identity
    slotId: config.slotId,
    shelfId: config.shelfId,
    locationId: config.locationId,
    networkId: config.networkId,
    shelfLabel: config.shelfLabel,

    // Product
    skuId: config.skuId,
    skuName: config.skuName,
    quantity: live?.quantity ?? 0,
    maxQuantity: config.maxQuantity,
    fillPct,
    confidence: live?.confidence ?? 0,

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
    brainId: config.brainId,
    updatedAt: live?.updated_at ?? 0,
    flags: live?.flags ?? 0,
    seq: live?.seq ?? 0,

    // Meta
    isActive: config.isActive,
  };
}

/**
 * Batch-project an entire location's slots.
 *
 * @param configs      Map<slotId, SlotConfig>
 * @param liveStates   Map<slotId, SlotLiveState>
 * @param onlineNodes  Set of nodeId (MAC) strings currently present in nodes_live
 * @param now          Injectable timestamp
 */
export function projectLocation(
  configs: Map<string, SlotConfig>,
  liveStates: Map<string, SlotLiveState>,
  onlineNodes: Set<string>,
  now: number = Date.now(),
): SlotViewModel[] {
  const results: SlotViewModel[] = [];

  configs.forEach((config) => {
    if (!config.isActive) return;

    const live = liveStates.get(config.slotId) ?? null;
    const nodeOnline = onlineNodes.has(config.nodeId);

    results.push(projectSlot(config, live, nodeOnline, now));
  });

  return results;
}
