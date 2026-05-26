import { describe, it, expect } from 'vitest';
import type { PlacedBuilding } from '@satisfactory-planner/shared';
import { useFluidBalance } from '../hooks/useFluidBalance';
import { renderHook } from '@testing-library/react';

describe('useFluidBalance', () => {
  it('returns empty balance for no buildings', () => {
    const { result } = renderHook(() => useFluidBalance([]));
    const balance = result.current;

    expect(balance.allFluids).toHaveLength(0);
    expect(balance.deadEnds).toHaveLength(0);
    expect(balance.overflows).toHaveLength(0);
    expect(balance.groups).toHaveLength(0);
    expect(balance.waterBalance).toBeNull();
    expect(balance.oilBalance).toBeNull();
  });

  it('detects water production from water extractor', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'water-extractor', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    expect(balance.waterBalance).not.toBeNull();
    expect(balance.waterBalance!.totalProduction).toBeGreaterThan(0);
    expect(balance.waterBalance!.totalConsumption).toBe(0);
    expect(balance.waterBalance!.status).toBe('overflow');
    expect(balance.deadEnds.length).toBeGreaterThanOrEqual(1);
    const waterDeadEnd = balance.deadEnds.find((f) => f.itemId === 'water');
    expect(waterDeadEnd).toBeDefined();
    expect(waterDeadEnd!.isDeadEnd).toBe(true);
  });

  it('detects water consumption from refinery recipe', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'refinery', recipeId: 'pure-iron-ingot', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    expect(balance.waterBalance).not.toBeNull();
    expect(balance.waterBalance!.totalConsumption).toBeGreaterThan(0);
  });

  it('detects oil processing chain', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'refinery', recipeId: 'fuel-production', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    expect(balance.oilBalance).not.toBeNull();
    const crudeEntry = balance.oilBalance!.items.find((f) => f.itemId === 'crude-oil');
    expect(crudeEntry).toBeDefined();
    expect(crudeEntry!.consumption).toBeGreaterThan(0);

    const fuelEntry = balance.oilBalance!.items.find((f) => f.itemId === 'fuel');
    expect(fuelEntry).toBeDefined();
    expect(fuelEntry!.production).toBeGreaterThan(0);
  });

  it('flags overflow when production exceeds consumption', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'water-extractor', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'b2', buildingId: 'refinery', recipeId: 'pure-iron-ingot', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    const waterEntry = balance.allFluids.find((f) => f.itemId === 'water');
    expect(waterEntry).toBeDefined();
    expect(waterEntry!.production).toBeGreaterThan(0);
  });

  it('detects balanced water when production matches consumption', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'water-extractor', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
      { id: 'b2', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    expect(balance.waterBalance).not.toBeNull();
  });

  it('does not include non-fluid items', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'smelter', recipeId: 'iron-ingot', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    const ironEntry = balance.allFluids.find((f) => f.itemId === 'iron-ore');
    expect(ironEntry).toBeUndefined();
    const ironIngot = balance.allFluids.find((f) => f.itemId === 'iron-ingot');
    expect(ironIngot).toBeUndefined();
  });

  it('includes heavy oil residue in oil chain', () => {
    const buildings: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'refinery', recipeId: 'fuel-production', overclockPercent: 100, x: 0, y: 0 },
    ];
    const { result } = renderHook(() => useFluidBalance(buildings));
    const balance = result.current;

    const horEntry = balance.allFluids.find((f) => f.itemId === 'heavy-oil-residue');
    expect(horEntry).toBeDefined();
    expect(horEntry!.production).toBeGreaterThan(0);
    expect(horEntry!.isDeadEnd).toBe(true);
  });

  it('scales rates with overclock', () => {
    const buildings100: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'refinery', recipeId: 'fuel-production', overclockPercent: 100, x: 0, y: 0 },
    ];
    const buildings250: PlacedBuilding[] = [
      { id: 'b1', buildingId: 'refinery', recipeId: 'fuel-production', overclockPercent: 250, x: 0, y: 0 },
    ];

    const { result: result100 } = renderHook(() => useFluidBalance(buildings100));
    const { result: result250 } = renderHook(() => useFluidBalance(buildings250));

    const fuel100 = result100.current.oilBalance!.items.find((f) => f.itemId === 'fuel');
    const fuel250 = result250.current.oilBalance!.items.find((f) => f.itemId === 'fuel');

    expect(fuel250!.production).toBeGreaterThan(fuel100!.production);
  });
});