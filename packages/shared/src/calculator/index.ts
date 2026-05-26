import type { Recipe, Building } from '../types';
import { aGameData } from '../data';

export interface ComputedRates {
  inputs: { item: string; rate: number }[];
  outputs: { item: string; rate: number }[];
  power: number;
  water: number;
}

export interface RecipeNode {
  recipe: Recipe;
  machineCount: number;
  overclockPercent: number;
  computedRates: ComputedRates;
  children: RecipeNode[];
}

export class ProductionCalculator {
  static computeRates(
    recipe: Recipe,
    machineCount: number,
    overclockPercent: number = 100
  ): ComputedRates {
    if (machineCount <= 0) {
      return { inputs: [], outputs: [], power: 0, water: 0 };
    }

    const overclockMultiplier = (overclockPercent / 100) ** 1.32813;
    const baseProduction = 1 / recipe.manufacturingDuration;
    const overclockedProduction = baseProduction * overclockMultiplier;

    const inputs = recipe.ingredients.map((ing) => ({
      item: ing.item,
      rate: ing.rate * overclockedProduction * machineCount / baseProduction,
    }));

    const outputs = recipe.products.map((prod) => ({
      item: prod.item,
      rate: prod.rate * overclockedProduction * machineCount / baseProduction,
    }));

    const building = aGameData.buildings.find((b) => b.id === recipe.machineType);
    const basePower = building ? building.powerConsumption : 0;
    const power = basePower * machineCount * overclockMultiplier;

    const waterInput = inputs.find((i) => i.item === 'water');
    const water = waterInput ? waterInput.rate : 0;

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

    if (building.powerProduction > 0) {
      const production = building.powerProduction * (overclockPercent / 100) ** 1.32813;
      return { consumption: 0, production };
    }

    if (!recipeId) {
      const consumption = building.powerConsumption * (overclockPercent / 100) ** 1.32813;
      return { consumption, production: 0 };
    }

    const recipe = aGameData.recipes.find((r) => r.id === recipeId);
    if (!recipe) {
      const consumption = building.powerConsumption * (overclockPercent / 100) ** 1.32813;
      return { consumption, production: 0 };
    }

    const consumption = building.powerConsumption * (overclockPercent / 100) ** 1.32813;
    return { consumption, production: 0 };
  }

  static resolveChain(
    targetItem: string,
    targetRate: number,
    availableRecipes?: Recipe[]
  ): RecipeNode {
    const recipes = availableRecipes ?? aGameData.recipes;
    const producingRecipes = recipes.filter((r) =>
      r.products.some((p) => p.item === targetItem)
    );

    if (producingRecipes.length === 0) {
      throw new Error(`No recipe produces ${targetItem}`);
    }

    const recipe = producingRecipes[0];
    const baseRate = recipe.products.find((p) => p.item === targetItem)!.rate;
    const machinesPerUnit = targetRate / baseRate;
    const machineCount = Math.ceil(machinesPerUnit * 100) / 100;
    const computedRates = this.computeRates(recipe, machineCount);

    const children: RecipeNode[] = [];
    for (const input of computedRates.inputs) {
      try {
        const child = this.resolveChain(input.item, input.rate, recipes);
        children.push(child);
      } catch {
        // Raw resource, no child
      }
    }

    return {
      recipe,
      machineCount,
      overclockPercent: 100,
      computedRates,
      children,
    };
  }

  static suggestAlternates(
    targetItem: string,
    constraints: string[] = []
  ): { recipe: Recipe; score: number }[] {
    const recipes = aGameData.recipes.filter(
      (r) =>
        r.products.some((p) => p.item === targetItem) &&
        !constraints.some((c) => r.ingredients.some((i) => i.item === c))
    );

    return recipes
      .map((recipe) => {
        const totalIngredients = recipe.ingredients.reduce((s, i) => s + i.rate, 0);
        const totalProducts = recipe.products.reduce((s, p) => s + p.rate, 0);
        const score = totalProducts / (totalIngredients + recipe.manufacturingDuration / 10);
        return { recipe, score };
      })
      .sort((a, b) => b.score - a.score);
  }
}