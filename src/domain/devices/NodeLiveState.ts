/**
 * NodeLiveState — ESP8266 node heartbeat relayed through the brain.
 *
 * RTDB path:
 *   tenants/{locationId}/nodes_live/{nodeId}
 *
 * nodeId is a MAC hex string (48-bit).
 */
export interface NodeLiveState {
  nodeId: string;           // MAC hex
  last_seen: number;        // Unix ms
  rssi: number;             // Signal strength (dBm, typically negative)
  error_count: number;
  /** Optional — not all firmware versions report battery */
  battery?: number;
}
