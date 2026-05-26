import type { Recipe, Building } from '../types';
import { aBuildings, aRecipes, aGameData } from '../data';

export interface RateResult {
  item: string;
  rate: number;
}

export interface ComputeRatesResult {
  inputs: RateResult[];
  outputs: RateResult[];
  power: number;
  water: number;
}

export interface RecipeNode {
  item: string;
  rate: number;
  recipe: Recipe | null;
  machinesNeeded?: number;
  children: RecipeNode[];
  isCircular?: boolean;
}

export class ProductionCalculator {
  static computeRates(
    recipe: Recipe,
    machineCount: number = 1,
    overclockPercent: number = 100
  ): ComputeRatesResult {
    if (machineCount <= 0) {
      return { inputs: [], outputs: [], power: 0, water: 0 };
    }

    const overclockFactor = overclockPercent / 100;
    const cycleTime = recipe.manufacturingDuration / overclockFactor;

    const inputs: RateResult[] = recipe.ingredients.map((ing) => ({
      item: ing.item,
      rate: (ing.amount / cycleTime) * machineCount,
    }));

    const outputs: RateResult[] = recipe.products.map((prod) => ({
      item: prod.item,
      rate: (prod.amount / cycleTime) * machineCount,
    }));

    const waterInput = recipe.ingredients.find((i) => i.item === 'water');
    const water = waterInput ? (waterInput.amount / cycleTime) * machineCount : 0;

    const matchingBuilding = ProductionCalculator.getBuildingForRecipe(recipe);
    const powerBase = matchingBuilding?.powerConsumption ?? 0;
    const power = machineCount * powerBase * Math.pow(overclockFactor, 1.6);

    return { inputs, outputs, power, water };
  }

  static computePowerForBuilding(
    buildingId: string,
    recipeId: string | null,
    overclockPercent: number
  ): { consumption: number; production: number } {
    const building = aGameData.buildings.find((b) => b.id === buildingId);
    if (!building) {
      return { consumption: 0, production: 0 };
    }

    if ((building.powerProduction ?? 0) > 0) {
      const production = building.powerProduction! * Math.pow(overclockPercent / 100, 1.6);
      return { consumption: 0, production };
    }

    const consumption = (building.powerConsumption ?? 0) * Math.pow(overclockPercent / 100, 1.6);
    return { consumption, production: 0 };
  }

  static getBuildingForRecipe(recipe: Recipe): Building | undefined {
    return aBuildings.find((b) => b.id === recipe.machineType);
  }

  static resolveChain(
    targetItem: string,
    targetRate: number,
    availableRecipes?: Recipe[]
  ): RecipeNode {
    const recipes = availableRecipes ?? aRecipes;
    return ProductionCalculator.buildTree(targetItem, targetRate, recipes, new Set());
  }

  private static buildTree(
    targetItem: string,
    targetRate: number,
    recipes: Recipe[],
    visited: Set<string>
  ): RecipeNode {
    if (visited.has(targetItem)) {
      return {
        item: targetItem,
        rate: targetRate,
        recipe: null,
        children: [],
        isCircular: true,
      };
    }
    visited.add(targetItem);

    const recipe = ProductionCalculator.findBestRecipe(targetItem, recipes);
    if (!recipe) {
      return {
        item: targetItem,
        rate: targetRate,
        recipe: null,
        children: [],
        isCircular: false,
      };
    }

    const outputRate = recipe.products.find((p) => p.item === targetItem)!;
    const machinesNeeded = targetRate / (outputRate.amount / recipe.manufacturingDuration);

    const children: RecipeNode[] = recipe.ingredients.map((ing) => {
      const inputRate = (ing.amount / recipe.manufacturingDuration) * machinesNeeded;
      return ProductionCalculator.buildTree(ing.item, inputRate, recipes, new Set(visited));
    });

    return {
      item: targetItem,
      rate: targetRate,
      recipe,
      machinesNeeded,
      children,
      isCircular: false,
    };
  }

  static findBestRecipe(targetItem: string, recipes: Recipe[]): Recipe | null {
    const producing = recipes.filter((r) => r.products.some((p) => p.item === targetItem));
    if (producing.length === 0) return null;
    const nonAlt = producing.find((r) => !r.isAlternate);
    return nonAlt ?? producing[0];
  }

  static suggestAlternates(
    targetItem: string,
    constraints?: { excludedItems?: string[] }
  ): Recipe[] {
    const excludedItems = constraints?.excludedItems ?? [];
    let producing = aRecipes.filter((r) => r.products.some((p) => p.item === targetItem));

    if (excludedItems.length > 0) {
      producing = producing.filter(
        (r) => !r.ingredients.some((i) => excludedItems.includes(i.item))
      );
    }

    return producing.filter((r) => r.isAlternate);
  }
}