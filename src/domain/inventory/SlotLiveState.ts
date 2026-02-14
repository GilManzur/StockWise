/**
 * SlotLiveState — real-time telemetry written by the ESP32 brain.
 *
 * RTDB path:
 *   tenants/{locationId}/inventory_live/{slotId}
 *
 * The web app NEVER computes quantity from raw weight;
 * the brain handles deduplication and quantity calculation.
 */
export interface SlotLiveState {
  /** UUID — must match the Firestore slot doc ID */
  slotId: string;

  /** Net weight after tare, in grams */
  net_weight_g: number;

  /** Brain-computed item count */
  quantity: number;

  /** Unix timestamp (ms) of the last update — used for stale detection */
  updated_at: number;

  /** Brain confidence score (0–1) for the current reading */
  confidence: number;

  /** ESP-NOW flags bitmask (see FLAGS in SlotStatus.ts) */
  flags: number;

  /** MAC hex of the originating ESP8266 node */
  source_node: string;

  /** Monotonically increasing sequence number */
  seq: number;
}
