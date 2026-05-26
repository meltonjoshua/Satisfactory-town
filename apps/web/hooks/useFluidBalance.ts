'use client';

import { useMemo } from 'react';
import type { PlacedBuilding, FluidBalance, FluidFlowEntry, FluidGroupBalance } from '@satisfactory-planner/shared';
import { aGameData, ProductionCalculator } from '@satisfactory-planner/shared';

const FLUID_ITEM_IDS = new Set([
  'water',
  'crude-oil',
  'fuel',
  'heavy-oil-residue',
]);

const OIL_CHAIN_IDS = new Set([
  'crude-oil',
  'fuel',
  'heavy-oil-residue',
  'plastic',
  'rubber',
  'petroleum-coke',
]);

function isFluidIngredient(item: string, recipes: typeof aGameData.recipes): boolean {
  return recipes.some((r) => r.ingredients.some((i) => i.item === item));
}

export function useFluidBalance(buildings: PlacedBuilding[]): FluidBalance {
  return useMemo(() => {
    const fluidEntries: FluidFlowEntry[] = [];
    const itemRates: Map<string, { production: number; consumption: number; isFluid: boolean }> = new Map();

    for (const pb of buildings) {
      const buildingDef = aGameData.buildings.find((b) => b.id === pb.buildingId);
      if (!buildingDef) continue;

      const buildingWaterProduction = (buildingDef.waterProduction ?? 0) * (pb.overclockPercent / 100);
      if (buildingWaterProduction > 0) {
        const existing = itemRates.get('water') ?? { production: 0, consumption: 0, isFluid: true };
        itemRates.set('water', {
          ...existing,
          production: existing.production + buildingWaterProduction,
        });

        fluidEntries.push({
          itemId: 'water',
          itemName: 'Water',
          production: buildingWaterProduction,
          consumption: 0,
          surplus: buildingWaterProduction,
          isFluid: true,
          isDeadEnd: false,
          isOverflow: false,
        });
      }

      if (pb.recipeId) {
        const recipe = aGameData.recipes.find((r) => r.id === pb.recipeId);
        if (recipe) {
          const rates = ProductionCalculator.computeRates(recipe, 1, pb.overclockPercent);

          for (const output of rates.outputs) {
            const itemDef = aGameData.items.find((i) => i.id === output.item);
            const isFluidItem = itemDef?.fluid ?? FLUID_ITEM_IDS.has(output.item);
            const isOilChainItem = OIL_CHAIN_IDS.has(output.item);

            if (isFluidItem || isOilChainItem) {
              const existing = itemRates.get(output.item) ?? { production: 0, consumption: 0, isFluid: isFluidItem };
              itemRates.set(output.item, {
                ...existing,
                production: existing.production + output.rate,
                isFluid: isFluidItem || existing.isFluid,
              });
            }
          }

          for (const input of rates.inputs) {
            const itemDef = aGameData.items.find((i) => i.id === input.item);
            const isFluidItem = itemDef?.fluid ?? FLUID_ITEM_IDS.has(input.item);
            const isOilChainItem = OIL_CHAIN_IDS.has(input.item);

            if (isFluidItem || isOilChainItem) {
              const existing = itemRates.get(input.item) ?? { production: 0, consumption: 0, isFluid: isFluidItem };
              itemRates.set(input.item, {
                ...existing,
                consumption: existing.consumption + input.rate,
                isFluid: isFluidItem || existing.isFluid,
              });
            }
          }
        }
      }
    }

    const allFluids: FluidFlowEntry[] = [];
    const deadEnds: FluidFlowEntry[] = [];
    const overflows: FluidFlowEntry[] = [];

    for (const [itemId, rates] of itemRates) {
      const itemDef = aGameData.items.find((i) => i.id === itemId);
      const surplus = rates.production - rates.consumption;
      const hasNoConsumer = rates.consumption === 0 && rates.production > 0;
      const hasOverflow = surplus > 0;

      const entry: FluidFlowEntry = {
        itemId,
        itemName: itemDef?.name ?? itemId,
        production: Math.round(rates.production * 100) / 100,
        consumption: Math.round(rates.consumption * 100) / 100,
        surplus: Math.round(surplus * 100) / 100,
        isFluid: rates.isFluid,
        isDeadEnd: hasNoConsumer,
        isOverflow: hasOverflow && !hasNoConsumer,
      };

      allFluids.push(entry);
      if (hasNoConsumer) deadEnds.push(entry);
      if (hasOverflow && !hasNoConsumer) overflows.push(entry);
    }

    allFluids.sort((a, b) => {
      if (a.isFluid !== b.isFluid) return b.isFluid ? 1 : -1;
      return a.itemName.localeCompare(b.itemName);
    });

    const waterItems = allFluids.filter((f) => f.itemId === 'water');
    const waterBalance: FluidGroupBalance | null = waterItems.length > 0
      ? buildGroupBalance('water', 'Water Balance', waterItems)
      : null;

    const oilItems = allFluids.filter((f) => OIL_CHAIN_IDS.has(f.itemId) || f.itemId === 'crude-oil');
    const oilBalance: FluidGroupBalance | null = oilItems.length > 0
      ? buildGroupBalance('oil', 'Oil Processing', oilItems)
      : null;

    return {
      groups: [waterBalance, oilBalance].filter((g): g is FluidGroupBalance => g !== null),
      waterBalance,
      oilBalance,
      allFluids,
      deadEnds,
      overflows,
    };
  }, [buildings]);
}

function buildGroupBalance(groupId: string, label: string, items: FluidFlowEntry[]): FluidGroupBalance {
  const totalProduction = items.reduce((sum, i) => sum + i.production, 0);
  const totalConsumption = items.reduce((sum, i) => sum + i.consumption, 0);
  const netBalance = totalProduction - totalConsumption;

  let status: FluidGroupBalance['status'];
  if (Math.abs(netBalance) < 0.01) {
    status = 'balanced';
  } else if (netBalance > 0) {
    status = 'overflow';
  } else {
    status = 'deficit';
  }

  return {
    groupId,
    label,
    items,
    totalProduction: Math.round(totalProduction * 100) / 100,
    totalConsumption: Math.round(totalConsumption * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    status,
  };
}