'use client';

import { useMemo } from 'react';
import type { PlacedBuilding, PowerBalance, PowerEntry } from '@satisfactory-planner/shared';
import { aGameData, ProductionCalculator } from '@satisfactory-planner/shared';

export function usePowerBalance(buildings: PlacedBuilding[]): PowerBalance {
  return useMemo(() => {
    const entries: PowerEntry[] = buildings.map((pb) => {
      const buildingDef = aGameData.buildings.find((b) => b.id === pb.buildingId);
      const recipeDef = pb.recipeId
        ? aGameData.recipes.find((r) => r.id === pb.recipeId)
        : null;

      const { consumption, production } = ProductionCalculator.computePowerForBuilding(
        pb.buildingId,
        pb.recipeId,
        pb.overclockPercent
      );

      return {
        buildingId: pb.id,
        buildingName: buildingDef?.name ?? pb.buildingId,
        recipeId: pb.recipeId,
        recipeName: recipeDef?.name ?? null,
        overclockPercent: pb.overclockPercent,
        powerConsumption: consumption,
        powerProduction: production,
        isGenerator: (buildingDef?.powerProduction ?? 0) > 0,
      };
    });

    const demand = entries.reduce((sum, e) => sum + e.powerConsumption, 0);
    const supply = entries.reduce((sum, e) => sum + e.powerProduction, 0);
    const deficit = Math.max(0, demand - supply);
    const utilization = supply > 0 ? demand / supply : demand > 0 ? Infinity : 0;

    let status: PowerBalance['status'];
    if (deficit > 0) {
      status = 'deficit';
    } else if (utilization > 0.9) {
      status = 'warning';
    } else {
      status = 'balanced';
    }

    return { demand, supply, deficit, utilization, status, entries };
  }, [buildings]);
}