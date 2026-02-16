import { describe, it, expect } from 'vitest';
import { resolveStatus, projectSlot, projectLocation, DEFAULT_LOW_THRESHOLD } from '../slotProjection';
import { SlotStatus, FLAGS, STALE_THRESHOLD_MS } from '../SlotStatus';
import type { SlotConfig } from '../SlotConfig';
import type { SkuConfig } from '../SkuConfig';
import type { SlotLiveState } from '../SlotLiveState';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000;

function makeConfig(overrides: Partial<SlotConfig> = {}): SlotConfig {
  return {
    slotId: 'slot-001',
    shelfId: 'shelf-001',
    locationId: 'loc-001',
    networkId: 'net-001',
    name: 'Slot A1',
    nodeId: 'AA:BB:CC:DD:EE:FF',
    skuId: 'sku-flour',
    tareG: 150,
    calibrationFactor: 1.0,
    hysteresisG: 5,
    minQtyStep: 1,
    status: 'active',
    ...overrides,
  };
}

function makeSku(overrides: Partial<SkuConfig> = {}): SkuConfig {
  return {
    skuId: 'sku-flour',
    name: 'All-Purpose Flour 1 kg',
    unitWeightG: 1000,
    toleranceG: 10,
    packagingWeightG: 50,
    active: true,
    ...overrides,
  };
}

function makeLive(overrides: Partial<SlotLiveState> = {}): SlotLiveState {
  return {
    slotId: 'slot-001',
    net_weight_g: 5000,
    quantity: 5,
    updated_at: NOW - 1000,
    confidence: 0.95,
    flags: FLAGS.STABLE_WEIGHT,
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
  it('returns UNCALIBRATED when tareG is zero', () => {
    const cfg = makeConfig({ tareG: 0 });
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

  // Priority 7: LOW (absolute threshold, default=2)
  it('returns LOW when quantity equals lowThreshold', () => {
    const lowLive = makeLive({ quantity: DEFAULT_LOW_THRESHOLD });
    expect(resolveStatus(makeConfig(), lowLive, true, NOW)).toBe(SlotStatus.LOW);
  });

  it('returns LOW when quantity is below lowThreshold', () => {
    const lowLive = makeLive({ quantity: 1 });
    expect(resolveStatus(makeConfig(), lowLive, true, NOW)).toBe(SlotStatus.LOW);
  });

  it('returns OK when quantity is above lowThreshold', () => {
    const okLive = makeLive({ quantity: DEFAULT_LOW_THRESHOLD + 1 });
    expect(resolveStatus(makeConfig(), okLive, true, NOW)).toBe(SlotStatus.OK);
  });

  it('respects custom lowThreshold', () => {
    const live = makeLive({ quantity: 4 });
    expect(resolveStatus(makeConfig(), live, true, NOW, 5)).toBe(SlotStatus.LOW);
    expect(resolveStatus(makeConfig(), live, true, NOW, 3)).toBe(SlotStatus.OK);
  });

  // Priority ordering
  it('OFFLINE takes priority over STALE', () => {
    const staleLive = makeLive({ updated_at: NOW - STALE_THRESHOLD_MS - 1 });
    expect(resolveStatus(makeConfig(), staleLive, false, NOW)).toBe(SlotStatus.OFFLINE_NODE);
  });

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
  const sku = makeSku();

  it('maps identity fields from config', () => {
    const vm = projectSlot(makeConfig(), makeLive(), sku, true, NOW);
    expect(vm.slotId).toBe('slot-001');
    expect(vm.shelfId).toBe('shelf-001');
    expect(vm.locationId).toBe('loc-001');
    expect(vm.networkId).toBe('net-001');
    expect(vm.slotName).toBe('Slot A1');
  });

  it('maps skuName from SkuConfig', () => {
    const vm = projectSlot(makeConfig(), makeLive(), sku, true, NOW);
    expect(vm.skuName).toBe('All-Purpose Flour 1 kg');
  });

  it('returns empty skuName when sku is null', () => {
    const vm = projectSlot(makeConfig(), makeLive(), null, true, NOW);
    expect(vm.skuName).toBe('');
  });

  it('defaults quantity to 0 when live is null', () => {
    const vm = projectSlot(makeConfig(), null, sku, false, NOW);
    expect(vm.quantity).toBe(0);
    expect(vm.confidence).toBe(0);
    expect(vm.netWeightG).toBe(0);
  });

  it('exposes flag-derived booleans', () => {
    const live = makeLive({ flags: FLAGS.STABLE_WEIGHT | FLAGS.OVERLOAD });
    const vm = projectSlot(makeConfig(), live, sku, true, NOW);
    expect(vm.isWeightStable).toBe(true);
    expect(vm.isOverloaded).toBe(true);
    expect(vm.isCalibrating).toBe(false);
  });

  it('sets isCalibrating when calibration_mode flag is set', () => {
    const live = makeLive({ flags: FLAGS.CALIBRATION_MODE });
    const vm = projectSlot(makeConfig(), live, sku, true, NOW);
    expect(vm.isCalibrating).toBe(true);
    expect(vm.status).toBe(SlotStatus.CALIBRATING);
    expect(vm.statusLabel).toBe('Calibrating…');
  });

  it('sets isOffline correctly', () => {
    const vm = projectSlot(makeConfig(), null, sku, false, NOW);
    expect(vm.isOffline).toBe(true);
    expect(vm.hasError).toBe(false);
    expect(vm.isStale).toBe(false);
  });

  it('isActive derives from config.status', () => {
    const vm1 = projectSlot(makeConfig({ status: 'active' }), makeLive(), sku, true, NOW);
    expect(vm1.isActive).toBe(true);
    const vm2 = projectSlot(makeConfig({ status: 'disabled' }), makeLive(), sku, true, NOW);
    expect(vm2.isActive).toBe(false);
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
    const skus = new Map([['sku-flour', makeSku()]]);
    const onlineNodes = new Set(['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02']);

    const vms = projectLocation(configs, liveStates, skus, onlineNodes, NOW);
    expect(vms).toHaveLength(2);
    expect(vms.every((vm) => vm.status === SlotStatus.OK)).toBe(true);
  });

  it('skips non-active slots', () => {
    const configs = new Map([
      ['slot-001', makeConfig({ slotId: 'slot-001', status: 'active', nodeId: 'AA:BB:CC:DD:EE:01' })],
      ['slot-002', makeConfig({ slotId: 'slot-002', status: 'disabled', nodeId: 'AA:BB:CC:DD:EE:02' })],
    ]);
    const liveStates = new Map([
      ['slot-001', makeLive({ slotId: 'slot-001' })],
      ['slot-002', makeLive({ slotId: 'slot-002' })],
    ]);
    const skus = new Map([['sku-flour', makeSku()]]);

    const vms = projectLocation(configs, liveStates, skus, new Set(['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02']), NOW);
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
    const skus = new Map([['sku-flour', makeSku()]]);
    const onlineNodes = new Set<string>();

    const vms = projectLocation(configs, liveStates, skus, onlineNodes, NOW);
    expect(vms[0].status).toBe(SlotStatus.OFFLINE_NODE);
  });
});
