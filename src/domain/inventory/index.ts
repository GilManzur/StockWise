/** Barrel export for the inventory domain module. */
export { SlotStatus, FLAGS, STATUS_LABELS, STALE_THRESHOLD_MS } from './SlotStatus';
export type { SlotConfigStatus, SlotConfig } from './SlotConfig';
export type { SkuConfig } from './SkuConfig';
export type { SlotLiveState } from './SlotLiveState';
export type { SlotViewModel } from './SlotViewModel';
export { resolveStatus, projectSlot, projectLocation, DEFAULT_LOW_THRESHOLD } from './slotProjection';
