import { SlotStatus } from './SlotStatus';

/**
 * SlotViewModel — the single merged representation consumed by UI components.
 *
 * Produced by the pure `projectSlot()` function from SlotConfig + SlotLiveState + SkuConfig.
 * Contains ZERO Firebase or React dependencies.
 */
export interface SlotViewModel {
  // ── Identity ──────────────────────────────────────────────
  slotId: string;           // UUID
  shelfId: string;          // UUID
  locationId: string;       // UUID
  networkId: string;        // UUID
  slotName: string;

  // ── Product ───────────────────────────────────────────────
  skuId: string;
  skuName: string;
  quantity: number;
  confidence: number;
  netWeightG: number;

  // ── Resolved status ───────────────────────────────────────
  status: SlotStatus;
  statusLabel: string;
  isStale: boolean;
  isOffline: boolean;
  hasError: boolean;

  // ── Flag-derived booleans ─────────────────────────────────
  isOverloaded: boolean;
  isCalibrating: boolean;
  isWeightStable: boolean;

  // ── Hardware refs (for diagnostics) ───────────────────────
  nodeId: string;           // MAC
  updatedAt: number;
  flags: number;
  seq: number;

  // ── Meta ──────────────────────────────────────────────────
  isActive: boolean;
}
