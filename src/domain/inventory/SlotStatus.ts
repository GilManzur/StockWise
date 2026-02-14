/**
 * SlotStatus — resolved UI status for a single inventory slot.
 *
 * Resolution priority (highest → lowest):
 *   OFFLINE_NODE > STALE > ERROR_SENSOR > CALIBRATING > UNCALIBRATED > EMPTY > LOW > OK
 */
export enum SlotStatus {
  OK = 'OK',
  LOW = 'LOW',
  EMPTY = 'EMPTY',
  ERROR_SENSOR = 'ERROR_SENSOR',
  OFFLINE_NODE = 'OFFLINE_NODE',
  STALE = 'STALE',
  UNCALIBRATED = 'UNCALIBRATED',
  CALIBRATING = 'CALIBRATING',
}

/**
 * ESP-NOW flags bitmask — must match firmware definitions exactly.
 *
 *   bit 0  stable_weight     Weight reading is stable
 *   bit 1  overload          Load cell overloaded
 *   bit 2  sensor_error      Load cell / ADC fault
 *   bit 3  calibration_mode  Brain is currently calibrating this node
 */
export const FLAGS = {
  STABLE_WEIGHT:    1 << 0,  // 0x01
  OVERLOAD:         1 << 1,  // 0x02
  SENSOR_ERROR:     1 << 2,  // 0x04
  CALIBRATION_MODE: 1 << 3,  // 0x08
} as const;

/** Human-readable labels for every status. */
export const STATUS_LABELS: Record<SlotStatus, string> = {
  [SlotStatus.OK]:            'In Stock',
  [SlotStatus.LOW]:           'Low Stock',
  [SlotStatus.EMPTY]:         'Empty',
  [SlotStatus.ERROR_SENSOR]:  'Sensor Error',
  [SlotStatus.OFFLINE_NODE]:  'Offline',
  [SlotStatus.STALE]:         'Stale Data',
  [SlotStatus.UNCALIBRATED]:  'Needs Calibration',
  [SlotStatus.CALIBRATING]:   'Calibrating…',
};

/** Default stale threshold in milliseconds (5 minutes). */
export const STALE_THRESHOLD_MS = 5 * 60 * 1000;
