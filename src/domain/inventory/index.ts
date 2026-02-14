/** Barrel export for the inventory domain module. */
export { SlotStatus, FLAGS, STATUS_LABELS, STALE_THRESHOLD_MS } from './SlotStatus';
export type { SlotConfig } from './SlotConfig';
export type { SlotLiveState } from './SlotLiveState';
export type { SlotViewModel } from './SlotViewModel';
export { resolveStatus, projectSlot, projectLocation } from './slotProjection';
