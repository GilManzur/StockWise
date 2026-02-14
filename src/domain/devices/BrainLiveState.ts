/**
 * BrainLiveState — ESP32 brain heartbeat / telemetry.
 *
 * RTDB path:
 *   tenants/{locationId}/devices_live/{brainId}
 *
 * brainId is a UUID (NOT a MAC address).
 */
export interface BrainLiveState {
  brainId: string;
  last_seen: number;        // Unix ms
  firmware_version: string;
  ip: string;
  queue_depth: number;
  error_count: number;
}
