/**
 * SlotConfig — authoritative configuration stored in Firestore.
 *
 * Firestore path:
 *   networks/{networkId}/locations/{locationId}/shelves/{shelfId}/slots/{slotId}
 */
export interface SlotConfig {
  /** UUID — identical key in Firestore doc AND RTDB inventory_live */
  slotId: string;

  /** UUID of the parent shelf */
  shelfId: string;

  /** UUID of the parent location */
  locationId: string;

  /** UUID of the parent network */
  networkId: string;

  /** Human-readable label, e.g. "Shelf A – Row 2" */
  shelfLabel: string;

  /** Product SKU identifier */
  skuId: string;

  /** Product display name */
  skuName: string;

  /** Weight of a single unit in grams (set during provisioning) */
  unitWeightGrams: number;

  /** Maximum quantity the slot can hold */
  maxQuantity: number;

  /** Fraction below which status becomes LOW (e.g. 0.2 = 20 %) */
  lowThresholdPct: number;

  /** MAC hex string (48-bit) of the ESP8266 node wired to this slot */
  nodeId: string;

  /** UUID of the ESP32 brain managing this node */
  brainId: string;

  /** Tare offset captured during provisioning (grams). 0 = not yet calibrated. */
  calibrationTareGrams: number;

  /** Whether this slot is actively monitored */
  isActive: boolean;

  /** DD/MM/YYYY HH:mm (GMT+X) */
  createdAt: string;
}
