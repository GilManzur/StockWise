import { describe, it, expect } from 'vitest';
import { resolveStatus, projectSlot, projectLocation } from '../slotProjection';
import { SlotStatus, FLAGS, STALE_THRESHOLD_MS } from '../SlotStatus';
import { SlotConfig } from '../SlotConfig';
import { SlotLiveState } from '../SlotLiveState';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000; // fixed "now" for deterministic tests

function makeConfig(overrides: Partial<SlotConfig> = {}): SlotConfig {
  return {
    slotId: 'slot-001',
    shelfId: 'shelf-001',
    locationId: 'loc-001',
    networkId: 'net-001',
    shelfLabel: 'Shelf A – Row 1',
    skuId: 'sku-flour',
    skuName: 'All-Purpose Flour 1 kg',
    unitWeightGrams: 1000,
    maxQuantity: 10,
    lowThresholdPct: 0.2,
    nodeId: 'AA:BB:CC:DD:EE:FF',
    brainId: 'brain-001',
    calibrationTareGrams: 150,
    isActive: true,
    createdAt: '01/01/2026 00:00 (GMT+0)',
    ...overrides,
  };
}

function makeLive(overrides: Partial<SlotLiveState> = {}): SlotLiveState {
  return {
    slotId: 'slot-001',
    net_weight_g: 5000,
    quantity: 5,
    updated_at: NOW - 1000, // 1 second ago → fresh
    confidence: 0.95,
    flags: FLAGS.STABLE_WEIGHT, // 0x01 — stable, no errors
    source_node: 'AA:BB:CC:DD:EE:FF',
    seq: 42,
    ...overrides,
  };
}

// ─── resolveStatus ──────────────────────────────────────────────────────────

describe('resolveStatus', () => {
  it('returns OK when everything is nominal', () => {
    expect(resolveStatus(makeConfig(), makeLive(), true, NOW)).toBe(SlotStatus.OK);
  });

  // Priority 1: OFFLINE_NODE
  it('returns OFFLINE_NODE when live is null', () => {
    expect(resolveStatus(makeConfig(), null, true, NOW)).toBe(SlotStatus.OFFLINE_NODE);
  });

  it('returns OFFLINE_NODE when nodeOnline is false', () => {
    expect(resolveStatus(makeConfig(), makeLive(), false, NOW)).toBe(SlotStatus.OFFLINE_NODE);
  });

  // Priority 2: STALE
  it('returns STALE when updated_at exceeds threshold', () => {
    const staleLive = makeLive({ updated_at: NOW - STALE_THRESHOLD_MS - 1 });
    expect(resolveStatus(makeConfig(), staleLive, true, NOW)).toBe(SlotStatus.STALE);
  });

  it('does NOT return STALE when exactly at threshold boundary', () => {
    const borderLive = makeLive({ updated_at: NOW - STALE_THRESHOLD_MS });
    expect(resolveStatus(makeConfig(), borderLive, true, NOW)).not.toBe(SlotStatus.STALE);
  });

  // Priority 3: ERROR_SENSOR
  it('returns ERROR_SENSOR when sensor_error flag is set', () => {
    const errorLive = makeLive({ flags: FLAGS.SENSOR_ERROR });
    expect(resolveStatus(makeConfig(), errorLive, true, NOW)).toBe(SlotStatus.ERROR_SENSOR);
  });

  it('ERROR_SENSOR takes priority over CALIBRATING', () => {
    const live = makeLive({ flags: FLAGS.SENSOR_ERROR | FLAGS.CALIBRATION_MODE });
    expect(resolveStatus(makeConfig(), live, true, NOW)).toBe(SlotStatus.ERROR_SENSOR);
  });

  // Priority 4: CALIBRATING
  it('returns CALIBRATING when calibration_mode flag is set', () => {
    const calLive = makeLive({ flags: FLAGS.CALIBRATION_MODE });
    expect(resolveStatus(makeConfig(), calLive, true, NOW)).toBe(SlotStatus.CALIBRATING);
  });

  // Priority 5: UNCALIBRATED
  it('returns UNCALIBRATED when tare is zero and no calibration_mode flag', () => {
    const cfg = makeConfig({ calibrationTareGrams: 0 });
    expect(resolveStatus(cfg, makeLive(), true, NOW)).toBe(SlotStatus.UNCALIBRATED);
  });

  // Priority 6: EMPTY
  it('returns EMPTY when quantity is 0', () => {
    const emptyLive = makeLive({ quantity: 0 });
    expect(resolveStatus(makeConfig(), emptyLive, true, NOW)).toBe(SlotStatus.EMPTY);
  });

  it('returns EMPTY when quantity is negative', () => {
    const negLive = makeLive({ quantity: -1 });
    expect(resolveStatus(makeConfig(), negLive, true, NOW)).toBe(SlotStatus.EMPTY);
  });

  // Priority 7: LOW
  it('returns LOW when fillPct is at threshold', () => {
    // maxQuantity=10, lowThresholdPct=0.2 → threshold qty = 2
    const lowLive = makeLive({ quantity: 2 });
    expect(resolveStatus(makeConfig(), lowLive, true, NOW)).toBe(SlotStatus.LOW);
  });

  it('returns LOW when fillPct is below threshold', () => {
    const lowLive = makeLive({ quantity: 1 });
    expect(resolveStatus(makeConfig(), lowLive, true, NOW)).toBe(SlotStatus.LOW);
  });

  // Priority ordering: OFFLINE > STALE
  it('OFFLINE takes priority over STALE', () => {
    const staleLive = makeLive({ updated_at: NOW - STALE_THRESHOLD_MS - 1 });
    // nodeOnline = false → OFFLINE even though data is also stale
    expect(resolveStatus(makeConfig(), staleLive, false, NOW)).toBe(SlotStatus.OFFLINE_NODE);
  });

  // Priority ordering: STALE > ERROR
  it('STALE takes priority over ERROR_SENSOR', () => {
    const live = makeLive({
      updated_at: NOW - STALE_THRESHOLD_MS - 1,
      flags: FLAGS.SENSOR_ERROR,
    });
    expect(resolveStatus(makeConfig(), live, true, NOW)).toBe(SlotStatus.STALE);
  });
});

// ─── projectSlot ────────────────────────────────────────────────────────────

describe('projectSlot', () => {
  it('maps identity fields from config', () => {
    const vm = projectSlot(makeConfig(), makeLive(), true, NOW);
    expect(vm.slotId).toBe('slot-001');
    expect(vm.shelfId).toBe('shelf-001');
    expect(vm.locationId).toBe('loc-001');
    expect(vm.networkId).toBe('net-001');
    expect(vm.shelfLabel).toBe('Shelf A – Row 1');
  });

  it('computes fillPct correctly', () => {
    const vm = projectSlot(makeConfig(), makeLive({ quantity: 5 }), true, NOW);
    expect(vm.fillPct).toBeCloseTo(0.5);
  });

  it('returns 0 fillPct when maxQuantity is 0', () => {
    const cfg = makeConfig({ maxQuantity: 0 });
    const vm = projectSlot(cfg, makeLive(), true, NOW);
    expect(vm.fillPct).toBe(0);
  });

  it('defaults quantity to 0 when live is null', () => {
    const vm = projectSlot(makeConfig(), null, false, NOW);
    expect(vm.quantity).toBe(0);
    expect(vm.confidence).toBe(0);
  });

  it('exposes flag-derived booleans', () => {
    const live = makeLive({ flags: FLAGS.STABLE_WEIGHT | FLAGS.OVERLOAD });
    const vm = projectSlot(makeConfig(), live, true, NOW);
    expect(vm.isWeightStable).toBe(true);
    expect(vm.isOverloaded).toBe(true);
    expect(vm.isCalibrating).toBe(false);
  });

  it('sets isCalibrating when calibration_mode flag is set', () => {
    const live = makeLive({ flags: FLAGS.CALIBRATION_MODE });
    const vm = projectSlot(makeConfig(), live, true, NOW);
    expect(vm.isCalibrating).toBe(true);
    expect(vm.status).toBe(SlotStatus.CALIBRATING);
    expect(vm.statusLabel).toBe('Calibrating…');
  });

  it('sets isOffline correctly', () => {
    const vm = projectSlot(makeConfig(), null, false, NOW);
    expect(vm.isOffline).toBe(true);
    expect(vm.hasError).toBe(false);
    expect(vm.isStale).toBe(false);
  });
});

// ─── projectLocation ───────────────────────────────────────────────────────

describe('projectLocation', () => {
  it('projects all active slots', () => {
    const configs = new Map([
      ['slot-001', makeConfig({ slotId: 'slot-001', nodeId: 'AA:BB:CC:DD:EE:01' })],
      ['slot-002', makeConfig({ slotId: 'slot-002', nodeId: 'AA:BB:CC:DD:EE:02' })],
    ]);
    const liveStates = new Map([
      ['slot-001', makeLive({ slotId: 'slot-001', source_node: 'AA:BB:CC:DD:EE:01' })],
      ['slot-002', makeLive({ slotId: 'slot-002', source_node: 'AA:BB:CC:DD:EE:02' })],
    ]);
    const onlineNodes = new Set(['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02']);

    const vms = projectLocation(configs, liveStates, onlineNodes, NOW);
    expect(vms).toHaveLength(2);
    expect(vms.every((vm) => vm.status === SlotStatus.OK)).toBe(true);
  });

  it('skips inactive slots', () => {
    const configs = new Map([
      ['slot-001', makeConfig({ slotId: 'slot-001', isActive: true, nodeId: 'AA:BB:CC:DD:EE:01' })],
      ['slot-002', makeConfig({ slotId: 'slot-002', isActive: false, nodeId: 'AA:BB:CC:DD:EE:02' })],
    ]);
    const liveStates = new Map([
      ['slot-001', makeLive({ slotId: 'slot-001' })],
      ['slot-002', makeLive({ slotId: 'slot-002' })],
    ]);

    const vms = projectLocation(configs, liveStates, new Set(['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02']), NOW);
    expect(vms).toHaveLength(1);
    expect(vms[0].slotId).toBe('slot-001');
  });

  it('marks slots OFFLINE when node not in onlineNodes set', () => {
    const configs = new Map([
      ['slot-001', makeConfig({ slotId: 'slot-001', nodeId: 'AA:BB:CC:DD:EE:01' })],
    ]);
    const liveStates = new Map([
      ['slot-001', makeLive({ slotId: 'slot-001' })],
    ]);
    const onlineNodes = new Set<string>(); // empty → no nodes online

    const vms = projectLocation(configs, liveStates, onlineNodes, NOW);
    expect(vms[0].status).toBe(SlotStatus.OFFLINE_NODE);
  });
});
