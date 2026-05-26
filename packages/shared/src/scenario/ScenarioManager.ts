import {
  type Scenario,
  type ScenarioDiff,
  type PlacedBuilding,
  type Connection,
  type ScenarioStats,
  ScenarioSchema,
  ScenarioDiffSchema,
} from '../types/index.js';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  getAllKeys(): string[];
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'satisfactory-scenarios:') {
    this.prefix = prefix;
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.prefix + key);
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.prefix + key, value);
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.prefix + key);
  }

  getAllKeys(): string[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return keys;
  }
}

function generateId(): string {
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeBuildingCounts(buildings: PlacedBuilding[]): Record<string, number> {
  const counts: Record<string, number> = Object.create(null);
  for (const b of buildings) {
    counts[b.buildingId] = (counts[b.buildingId] ?? 0) + 1;
  }
  return counts;
}

export class ScenarioManager {
  private storage: StorageAdapter;
  private scenarios: Map<string, Scenario>;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? new LocalStorageAdapter();
    this.scenarios = new Map();
  }

  create(name: string, buildings: PlacedBuilding[] = [], connections: Connection[] = []): Scenario {
    const now = new Date().toISOString();
    const stats = this.computeStats(buildings);
    const scenario: Scenario = ScenarioSchema.parse({
      id: generateId(),
      name,
      buildings,
      connections,
      stats,
      createdAt: now,
      updatedAt: now,
    });
    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  get(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  list(): Scenario[] {
    return Array.from(this.scenarios.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  update(id: string, updates: Partial<Pick<Scenario, 'name' | 'buildings' | 'connections'>>): Scenario | undefined {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;

    const updated: Scenario = ScenarioSchema.parse({
      ...scenario,
      ...updates,
      stats: this.computeStats(updates.buildings ?? scenario.buildings),
      updatedAt: new Date().toISOString(),
    });
    this.scenarios.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    this.storage.removeItem(id);
    return this.scenarios.delete(id);
  }

  duplicate(id: string, newName?: string): Scenario | undefined {
    const original = this.scenarios.get(id);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const copy: Scenario = ScenarioSchema.parse({
      ...original,
      id: generateId(),
      name: newName ?? `${original.name} (copy)`,
      buildings: original.buildings.map((b) => ({ ...b, id: generateId() })),
      connections: original.connections.map((c) => ({ ...c, id: generateId() })),
      createdAt: now,
      updatedAt: now,
    });
    this.scenarios.set(copy.id, copy);
    return copy;
  }

  compare(scenarioAId: string, scenarioBId: string): ScenarioDiff | undefined {
    const a = this.scenarios.get(scenarioAId);
    const b = this.scenarios.get(scenarioBId);
    if (!a || !b) return undefined;

    const aStats = a.stats ?? this.computeStats(a.buildings);
    const bStats = b.stats ?? this.computeStats(b.buildings);

    const buildingCountDiffs = this.diffRecords(
      computeBuildingCounts(a.buildings),
      computeBuildingCounts(b.buildings)
    );

    const throughputDiffs = this.diffRecords(aStats.outputResources, bStats.outputResources);
    const resourceUsageDiffs = this.diffRecords(aStats.inputResources, bStats.inputResources);

    const diff: ScenarioDiff = ScenarioDiffSchema.parse({
      buildingCountDiffs,
      powerConsumptionDiff: bStats.totalPowerConsumption - aStats.totalPowerConsumption,
      powerProductionDiff: bStats.totalPowerProduction - aStats.totalPowerProduction,
      throughputDiffs,
      resourceUsageDiffs,
    });

    return diff;
  }

  save(id: string): boolean {
    const scenario = this.scenarios.get(id);
    if (!scenario) return false;
    this.storage.setItem(id, JSON.stringify(scenario));
    return true;
  }

  saveAll(): number {
    let count = 0;
    for (const scenario of this.scenarios.values()) {
      this.storage.setItem(scenario.id, JSON.stringify(scenario));
      count++;
    }
    return count;
  }

  load(id: string): Scenario | undefined {
    const raw = this.storage.getItem(id);
    if (!raw) return undefined;
    let obj: unknown;
    try {
      obj = JSON.parse(raw);
    } catch {
      return undefined;
    }
    const parsed = ScenarioSchema.safeParse(obj);
    if (!parsed.success) return undefined;
    const scenario = parsed.data;
    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  loadAll(): Scenario[] {
    const keys = this.storage.getAllKeys();
    const scenarios: Scenario[] = [];
    for (const key of keys) {
      const scenario = this.load(key);
      if (scenario) scenarios.push(scenario);
    }
    return scenarios;
  }

  export(id: string): string | undefined {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    return JSON.stringify(scenario, null, 2);
  }

  import(json: string): Scenario | undefined {
    let obj: unknown;
    try {
      obj = JSON.parse(json);
    } catch {
      return undefined;
    }
    const parsed = ScenarioSchema.safeParse(obj);
    if (!parsed.success) return undefined;
    const scenario = parsed.data;
    this.scenarios.set(scenario.id, scenario);
    return scenario;
  }

  private computeStats(buildings: PlacedBuilding[]): ScenarioStats {
    const buildingCounts = computeBuildingCounts(buildings);
    let totalPowerConsumption = 0;
    let totalPowerProduction = 0;

    for (const b of buildings) {
      const factor = b.overclockPercent / 100;
      totalPowerConsumption += (b.overclockPercent > 0 ? factor : 1) * 0;
    }

    return {
      totalPowerConsumption,
      totalPowerProduction,
      buildingCounts,
      inputResources: {},
      outputResources: {},
    };
  }

  private diffRecords(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const diff: Record<string, number> = Object.create(null);
    for (const key of allKeys) {
      const diffVal = (b[key] ?? 0) - (a[key] ?? 0);
      if (diffVal !== 0) {
        diff[key] = diffVal;
      }
    }
    return diff;
  }
}