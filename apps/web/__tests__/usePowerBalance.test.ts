import { describe, it, expect } from 'vitest';
import type { PlacedBuilding, PowerEntry } from '@satisfactory-planner/shared';
import { usePowerBalance } from '../hooks/usePowerBalance';
import { renderHook } from '@testing-library/react';

describe('usePowerBalance', () => {
  it('returns balanced status when supply exceeds demand', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => usePowerBalance(buildings));
    const balance = result.current;

    expect(balance.supply).toBe(75);
    expect(balance.demand).toBe(0);
    expect(balance.deficit).toBe(0);
    expect(balance.status).toBe('balanced');
    expect(balance.entries).toHaveLength(1);
    expect(balance.entries[0].isGenerator).toBe(true);
  });

  it('returns deficit status when demand exceeds supply', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => usePowerBalance(buildings));
    const balance = result.current;

    expect(balance.demand).toBeGreaterThan(0);
    expect(balance.supply).toBe(0);
    expect(balance.status).toBe('deficit');
    expect(balance.deficit).toBeGreaterThan(0);
  });

  it('returns warning status when utilization is above 90%', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'g1', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'c1', buildingId: 'manufacturer', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'c2', buildingId: 'assembler', recipeId: 'reinforced-iron-plate', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => usePowerBalance(buildings));
    const balance = result.current;

    expect(balance.utilization).toBeGreaterThan(0.9);
    expect(balance.status).toBe('warning');
  });

  it('handles empty buildings list', () => {
    const { result } = renderHook(() => usePowerBalance([]));
    const balance = result.current;

    expect(balance.demand).toBe(0);
    expect(balance.supply).toBe(0);
    expect(balance.deficit).toBe(0);
    expect(balance.status).toBe('balanced');
    expect(balance.entries).toHaveLength(0);
  });

  it('scales power with overclock', () => {
    const buildings100: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 100, x: 0, y: 0 },
    ];
    const buildings250: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 250, x: 0, y: 0 },
    ];

    const { result: result100 } = renderHook(() => usePowerBalance(buildings100));
    const { result: result250 } = renderHook(() => usePowerBalance(buildings250));

    expect(result250.current.demand).toBeGreaterThan(result100.current.demand);
  });

  it('separates consumers and generators', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'g1', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'c1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => usePowerBalance(buildings));
    const balance = result.current;

    const generators = balance.entries.filter((e: PowerEntry) => e.isGenerator);
    const consumers = balance.entries.filter((e: PowerEntry) => !e.isGenerator);

    expect(generators).toHaveLength(1);
    expect(consumers).toHaveLength(1);
    expect(generators[0].powerProduction).toBe(75);
    expect(consumers[0].powerConsumption).toBe(4);
  });

  it('computes correct balance with multiple generators and consumers', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'g1', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'g2', buildingId: 'biomass-burner', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'c1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 100, x: 0, y: 0 },
      { id: 'c2', buildingId: 'assembler', recipeId: 'reinforced-iron-plate', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => usePowerBalance(buildings));
    const balance = result.current;

    expect(balance.supply).toBe(105);
    expect(balance.demand).toBe(19);
    expect(balance.status).toBe('balanced');
  });
});