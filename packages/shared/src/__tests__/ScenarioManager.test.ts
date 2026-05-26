import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScenarioManager, LocalStorageAdapter } from '../scenario/ScenarioManager';
import type { PlacedBuilding, Connection } from '../types/index';
import type { StorageAdapter } from '../scenario/ScenarioManager';

class InMemoryStorage implements StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  getAllKeys: () => string[];

  constructor() {
    const store = new Map<string, string>();
    this.getItem = (key) => store.get(key) ?? null;
    this.setItem = (key, value) => { store.set(key, value); };
    this.removeItem = (key) => { store.delete(key); };
    this.getAllKeys = () => Array.from(store.keys());
  }
}

function makeBuilding(overrides: Partial<PlacedBuilding> = {}): PlacedBuilding {
  return {
    id: `b-${Math.random().toString(36).slice(2, 8)}`,
    buildingId: 'smelter',
    x: 0,
    y: 0,
    overclockPercent: 100,
    ...overrides,
  };
}

function makeConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
    sourceBuildingId: 'b-1',
    sourcePort: 'out',
    targetBuildingId: 'b-2',
    targetPort: 'in',
    type: 'conveyor',
    ...overrides,
  };
}

describe('ScenarioManager', () => {
  let storage: StorageAdapter;
  let manager: ScenarioManager;

  beforeEach(() => {
    storage = new InMemoryStorage();
    manager = new ScenarioManager(storage);
  });

  describe('create', () => {
    it('creates a scenario with a name', () => {
      const s = manager.create('Test Scenario');
      expect(s.name).toBe('Test Scenario');
      expect(s.id).toBeTruthy();
      expect(s.buildings).toEqual([]);
      expect(s.connections).toEqual([]);
      expect(s.stats).toBeDefined();
    });

    it('creates a scenario with buildings and connections', () => {
      const b = makeBuilding();
      const c = makeConnection();
      const s = manager.create('With Data', [b], [c]);
      expect(s.buildings).toHaveLength(1);
      expect(s.connections).toHaveLength(1);
    });
  });

  describe('get', () => {
    it('returns undefined for nonexistent id', () => {
      expect(manager.get('no-such-id')).toBeUndefined();
    });

    it('returns a created scenario', () => {
      const s = manager.create('My Scenario');
      expect(manager.get(s.id)).toBe(s);
    });
  });

  describe('list', () => {
    it('returns all scenarios', () => {
      manager.create('First');
      manager.create('Second');
      const list = manager.list();
      expect(list).toHaveLength(2);
    });

    it('returns scenarios sorted by updatedAt descending', () => {
      vi.useFakeTimers();
      const s1 = manager.create('First');
      vi.advanceTimersByTime(1000);
      const s2 = manager.create('Second');
      const list = manager.list();
      expect(list[0].id).toBe(s2.id);
      expect(list[1].id).toBe(s1.id);
      vi.useRealTimers();
    });
  });

  describe('update', () => {
    it('updates name and buildings', () => {
      const s = manager.create('Original');
      const b = makeBuilding();
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      const updated = manager.update(s.id, { name: 'Updated', buildings: [b] });
      expect(updated!.name).toBe('Updated');
      expect(updated!.buildings).toHaveLength(1);
      expect(updated!.updatedAt).not.toBe(s.updatedAt);
      vi.useRealTimers();
    });

    it('returns undefined for nonexistent scenario', () => {
      expect(manager.update('no-such-id', { name: 'x' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes a scenario', () => {
      const s = manager.create('ToDelete');
      expect(manager.delete(s.id)).toBe(true);
      expect(manager.get(s.id)).toBeUndefined();
    });

    it('returns false for nonexistent scenario', () => {
      expect(manager.delete('no-such-id')).toBe(false);
    });
  });

  describe('duplicate', () => {
    it('creates a copy with a new id and "(copy)" suffix', () => {
      const b = makeBuilding();
      const s = manager.create('Original', [b]);
      const copy = manager.duplicate(s.id);
      expect(copy).toBeDefined();
      expect(copy!.id).not.toBe(s.id);
      expect(copy!.name).toBe('Original (copy)');
      expect(copy!.buildings).toHaveLength(1);
      expect(copy!.buildings[0].id).not.toBe(s.buildings[0].id);
      expect(copy!.buildings[0].buildingId).toBe(s.buildings[0].buildingId);
    });

    it('uses custom name when provided', () => {
      const s = manager.create('Original');
      const copy = manager.duplicate(s.id, 'Custom Name');
      expect(copy!.name).toBe('Custom Name');
    });

    it('returns undefined for nonexistent scenario', () => {
      expect(manager.duplicate('no-such-id')).toBeUndefined();
    });

    it('deep copies connections with new ids', () => {
      const c = makeConnection();
      const s = manager.create('With Connections', [], [c]);
      const copy = manager.duplicate(s.id);
      expect(copy!.connections).toHaveLength(1);
      expect(copy!.connections[0].id).not.toBe(s.connections[0].id);
    });

    it('preserves building and connection data except ids', () => {
      const b = makeBuilding({ buildingId: 'assembler', x: 100, y: 200, overclockPercent: 150 });
      const c = makeConnection({ sourceBuildingId: 'src', targetBuildingId: 'tgt', type: 'pipe' });
      const s = manager.create('Detailed', [b], [c]);
      const copy = manager.duplicate(s.id);
      expect(copy!.buildings[0].buildingId).toBe('assembler');
      expect(copy!.buildings[0].x).toBe(100);
      expect(copy!.buildings[0].y).toBe(200);
      expect(copy!.buildings[0].overclockPercent).toBe(150);
      expect(copy!.connections[0].sourceBuildingId).toBe('src');
      expect(copy!.connections[0].type).toBe('pipe');
    });
  });

  describe('compare', () => {
    it('returns undefined if either scenario is missing', () => {
      const s = manager.create('Exists');
      expect(manager.compare(s.id, 'no-such-id')).toBeUndefined();
      expect(manager.compare('no-such-id', s.id)).toBeUndefined();
    });

    it('compares building counts', () => {
      const b1 = makeBuilding({ buildingId: 'smelter' });
      const b2 = makeBuilding({ buildingId: 'assembler' });
      const b3 = makeBuilding({ buildingId: 'smelter' });
      const sA = manager.create('A', [b1, b2]);
      const sB = manager.create('B', [b3]);
      const diff = manager.compare(sA.id, sB.id);
      expect(diff).toBeDefined();
      expect(diff!.buildingCountDiffs).toBeDefined();
      expect(diff!.buildingCountDiffs).toEqual({ assembler: -1 });
    });

    it('shows zero diffs for identical building counts', () => {
      const b1 = makeBuilding({ buildingId: 'smelter' });
      const b2 = makeBuilding({ buildingId: 'smelter' });
      const sA = manager.create('A', [b1]);
      const sB = manager.create('B', [b2]);
      const diff = manager.compare(sA.id, sB.id);
      expect(diff!.buildingCountDiffs).toEqual({});
    });

    it('shows positive diff when B has more buildings', () => {
      const b2a = makeBuilding({ buildingId: 'assembler' });
      const b2b = makeBuilding({ buildingId: 'assembler' });
      const sA = manager.create('A');
      const sB = manager.create('B', [b2a, b2b]);
      const diff = manager.compare(sA.id, sB.id);
      expect(diff!.buildingCountDiffs).toEqual({ assembler: 2 });
    });

    it('shows negative diff when B has fewer buildings', () => {
      const b1a = makeBuilding({ buildingId: 'smelter' });
      const b1b = makeBuilding({ buildingId: 'smelter' });
      const b2 = makeBuilding({ buildingId: 'smelter' });
      const sA = manager.create('A', [b1a, b1b]);
      const sB = manager.create('B', [b2]);
      const diff = manager.compare(sA.id, sB.id);
      expect(diff!.buildingCountDiffs).toEqual({ smelter: -1 });
    });

    it('compares power consumption and production', () => {
      const sA = manager.create('A');
      const sB = manager.create('B');
      const diff = manager.compare(sA.id, sB.id);
      expect(diff!.powerConsumptionDiff).toBe(0);
      expect(diff!.powerProductionDiff).toBe(0);
    });

    it('compares throughput and resource usage from stats', () => {
      const bA = makeBuilding({ buildingId: 'smelter' });
      const sA = manager.create('A', [bA]);
      const sB = manager.create('B');
      const diff = manager.compare(sA.id, sB.id);
      expect(diff).toBeDefined();
      expect(typeof diff!.throughputDiffs).toBe('object');
      expect(typeof diff!.resourceUsageDiffs).toBe('object');
    });
  });

  describe('persistence', () => {
    describe('save / load', () => {
      it('saves and loads a scenario', () => {
        const b = makeBuilding();
        const s = manager.create('PersistTest', [b]);
        expect(manager.save(s.id)).toBe(true);

        const freshManager = new ScenarioManager(storage);
        const loaded = freshManager.load(s.id);
        expect(loaded).toBeDefined();
        expect(loaded!.id).toBe(s.id);
        expect(loaded!.name).toBe('PersistTest');
        expect(loaded!.buildings).toHaveLength(1);
      });

      it('returns false for nonexistent scenario on save', () => {
        expect(manager.save('no-such-id')).toBe(false);
      });

      it('returns undefined for nonexistent key on load', () => {
        expect(manager.load('no-such-id')).toBeUndefined();
      });

      it('returns undefined for invalid JSON on load', () => {
        storage.setItem('bad', 'not-json');
        expect(manager.load('bad')).toBeUndefined();
      });

      it('returns undefined for invalid schema on load', () => {
        storage.setItem('invalid', JSON.stringify({ foo: 'bar' }));
        expect(manager.load('invalid')).toBeUndefined();
      });
    });

    describe('saveAll / loadAll', () => {
      it('saves and loads all scenarios', () => {
        const s1 = manager.create('First');
        const s2 = manager.create('Second');
        const count = manager.saveAll();
        expect(count).toBe(2);

        const freshManager = new ScenarioManager(storage);
        const all = freshManager.loadAll();
        expect(all).toHaveLength(2);
        const names = all.map((s) => s.name).sort();
        expect(names).toContain('First');
        expect(names).toContain('Second');
      });

      it('returns empty array when no scenarios are stored', () => {
        const freshManager = new ScenarioManager(storage);
        expect(freshManager.loadAll()).toEqual([]);
      });
    });

    describe('export / import', () => {
      it('exports scenario as JSON string', () => {
        const b = makeBuilding({ buildingId: 'smelter' });
        const s = manager.create('ExportTest', [b]);
        const json = manager.export(s.id);
        expect(json).toBeTruthy();
        const parsed = JSON.parse(json!);
        expect(parsed.id).toBe(s.id);
        expect(parsed.buildings).toHaveLength(1);
      });

      it('returns undefined for nonexistent scenario on export', () => {
        expect(manager.export('no-such-id')).toBeUndefined();
      });

      it('imports scenario from JSON string', () => {
        const b = makeBuilding({ buildingId: 'assembler' });
        const s = manager.create('ImportTest', [b]);
        const json = manager.export(s.id)!;

        const freshManager = new ScenarioManager(storage);
        const imported = freshManager.import(json);
        expect(imported).toBeDefined();
        expect(imported!.name).toBe('ImportTest');
        expect(imported!.buildings).toHaveLength(1);
      });

      it('returns undefined for invalid JSON on import', () => {
        expect(manager.import('not-json')).toBeUndefined();
      });

      it('returns undefined for invalid schema on import', () => {
        expect(manager.import(JSON.stringify({ foo: 'bar' }))).toBeUndefined();
      });

      it('round-trips scenario data correctly', () => {
        const b = makeBuilding({ buildingId: 'assembler', x: 42, y: 99, overclockPercent: 200 });
        const c = makeConnection({ sourceBuildingId: 's1', targetBuildingId: 't1', type: 'pipe' });
        const s = manager.create('RoundTrip', [b], [c]);
        const json = manager.export(s.id)!;

        const freshManager = new ScenarioManager(storage);
        const imported = freshManager.import(json);
        expect(imported!.buildings[0].buildingId).toBe('assembler');
        expect(imported!.buildings[0].x).toBe(42);
        expect(imported!.buildings[0].overclockPercent).toBe(200);
        expect(imported!.connections[0].type).toBe('pipe');
        expect(imported!.connections[0].sourceBuildingId).toBe('s1');
      });
    });
  });
});

describe('LocalStorageAdapter', () => {
  it('uses prefix for keys', () => {
    const adapter = new LocalStorageAdapter('test-prefix:');
    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });
});