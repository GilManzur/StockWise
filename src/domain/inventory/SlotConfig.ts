/**
 * SlotConfig — authoritative configuration stored in Firestore.
 *
 * Firestore path:
 *   networks/{networkId}/locations/{locationId}/shelves/{shelfId}/slots/{slotId}
 */
export type SlotConfigStatus = 'provisioning' | 'active' | 'disabled';

export interface SlotConfig {
  /** UUID — identical key in Firestore doc AND RTDB inventory_live */
  slotId: string;

  /** UUID of the parent shelf */
  shelfId: string;

  /** UUID of the parent location (derived from path) */
  locationId: string;

  /** UUID of the parent network (derived from path) */
  networkId: string;

  /** Human-readable slot label */
  name: string;

  /** MAC hex string (48-bit) of the ESP8266 node wired to this slot */
  nodeId: string;

  /** SKU identifier — references skus/{skuId} in the same location */
  skuId: string;

  /** Tare weight in grams (0 = not yet calibrated) */
  tareG: number;

  /** Calibration factor for weight-to-quantity conversion */
  calibrationFactor: number;

  /** Hysteresis in grams to prevent quantity flickering */
  hysteresisG: number;

  /** Minimum quantity step size */
  minQtyStep: number;

  /** Slot lifecycle status */
  status: SlotConfigStatus;
}
