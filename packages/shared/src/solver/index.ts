import { aRecipes } from "../data";
import type { Recipe } from "../types";
import { ProductionCalculator } from "../calculator";
import type { RecipeNode } from "../calculator";

export interface SolverOptions {
  targetItem: string;
  targetRate: number;
  preferredAlts?: string[];
  excludedItems?: string[];
  availableRecipes?: Recipe[];
}

export interface SolverResult {
  tree: RecipeNode;
  totalMachines: number;
  totalPower: number;
  totalWater: number;
  totalFootprint: number;
  summary: string;
  recipeIds: string[];
  label: string;
}

export interface ComparisonEntry {
  label: string;
  recipeIds: string[];
  result: SolverResult;
}

export interface ComparisonResult {
  entries: ComparisonEntry[];
  bestMachines: number | null;
  bestPower: number | null;
  bestWater: number | null;
  bestFootprint: number | null;
}

export class RecipeSolver {
  static solve(options: SolverOptions): SolverResult {
    const {
      targetItem,
      targetRate,
      preferredAlts = [],
      excludedItems = [],
    } = options;

    let recipes = options.availableRecipes ?? [...aRecipes];

    if (excludedItems.length > 0) {
      recipes = recipes.filter(
        (r) => !r.ingredients.some((i) => excludedItems.includes(i.item))
      );
    }

    if (preferredAlts.length > 0) {
      const altRecipes = recipes.filter((r) => r.isAlternate && preferredAlts.includes(r.id));
      const baseRecipes = recipes.filter((r) => !r.isAlternate);
      const replaceableIds = new Set(
        altRecipes.flatMap((alt) => alt.products.map((p) => p.item))
      );
      const nonReplacedBase = baseRecipes.filter(
        (r) => !r.products.some((p) => replaceableIds.has(p.item))
      );
      recipes = [...nonReplacedBase, ...altRecipes];
    }

    const tree = ProductionCalculator.resolveChain(targetItem, targetRate, recipes);
    const { totalMachines, totalPower, totalWater, totalFootprint } = RecipeSolver.aggregateStats(tree);
    const summary = RecipeSolver.formatSummary(tree, totalMachines, totalPower, totalWater, totalFootprint);
    const usedRecipeIds = RecipeSolver.collectRecipeIds(tree);
    const label = preferredAlts.length === 0 ? "Default" : preferredAlts.map((id) => {
      const r = recipes.find((rr) => rr.id === id);
      return r ? r.name : id;
    }).join(" + ");

    return { tree, totalMachines, totalPower, totalWater, totalFootprint, summary, recipeIds: usedRecipeIds, label };
  }

  static compareAlternates(options: SolverOptions): ComparisonResult {
    const { targetItem, excludedItems = [] } = options;
    let allRecipes = options.availableRecipes ?? [...aRecipes];

    if (excludedItems.length > 0) {
      allRecipes = allRecipes.filter(
        (r) => !r.ingredients.some((i) => excludedItems.includes(i.item))
      );
    }

    const alternateRecipeGroups = RecipeSolver.findAlternateGroups(targetItem, allRecipes);

    if (alternateRecipeGroups.length === 0) {
      const defaultResult = RecipeSolver.solve(options);
      return {
        entries: [{ label: "Default", recipeIds: defaultResult.recipeIds, result: defaultResult }],
        bestMachines: defaultResult.totalMachines,
        bestPower: defaultResult.totalPower,
        bestWater: defaultResult.totalWater,
        bestFootprint: defaultResult.totalFootprint,
      };
    }

    const combinations = RecipeSolver.generateCombinations(alternateRecipeGroups);
    const entries: ComparisonEntry[] = [];
    const defaultResult = RecipeSolver.solve({ ...options, preferredAlts: [] });
    entries.push({ label: "Default", recipeIds: defaultResult.recipeIds, result: defaultResult });

    for (const combo of combinations) {
      const preferredAlts = combo.map((r) => r.id);
      const label = combo.map((r) => r.name).join(" + ");
      try {
        const result = RecipeSolver.solve({ ...options, preferredAlts });
        entries.push({ label, recipeIds: result.recipeIds, result });
      } catch {
        // skip combinations that fail to solve
      }
    }

    const validEntries = entries.filter((e) => e.result.totalMachines > 0);
    const bestMachines = validEntries.length > 0 ? Math.min(...validEntries.map((e) => e.result.totalMachines)) : null;
    const bestPower = validEntries.length > 0 ? Math.min(...validEntries.map((e) => e.result.totalPower)) : null;
    const bestWater = validEntries.length > 0 ? Math.min(...validEntries.map((e) => e.result.totalWater)) : null;
    const bestFootprint = validEntries.length > 0 ? Math.min(...validEntries.map((e) => e.result.totalFootprint)) : null;

    return { entries: validEntries, bestMachines, bestPower, bestWater, bestFootprint };
  }

  private static findAlternateGroups(targetItem: string, recipes: Recipe[]): Recipe[][] {
    const visited = new Set<string>();
    const groups: Recipe[][] = [];

    function collectAltsFor(item: string) {
      if (visited.has(item)) return;
      visited.add(item);

      const producing = recipes.filter((r) => r.products.some((p) => p.item === item));
      const alts = producing.filter((r) => r.isAlternate);

      if (alts.length > 0) {
        groups.push(alts);
      }

      const defaultRecipe = producing.find((r) => !r.isAlternate) ?? producing[0];
      if (defaultRecipe) {
        for (const ing of defaultRecipe.ingredients) {
          collectAltsFor(ing.item);
        }
      }
    }

    collectAltsFor(targetItem);
    return groups;
  }

  private static generateCombinations(groups: Recipe[][]): Recipe[][] {
    if (groups.length === 0) return [];
    if (groups.length > 8) {
      groups = groups.slice(0, 8);
    }

    const MAX_COMBINATIONS = 256;
    const results: Recipe[][] = [];

    function backtrack(index: number, current: Recipe[]) {
      if (results.length >= MAX_COMBINATIONS) return;
      if (index === groups.length) {
        results.push([...current]);
        return;
      }
      for (const alt of groups[index]) {
        current.push(alt);
        backtrack(index + 1, current);
        current.pop();
        if (results.length >= MAX_COMBINATIONS) return;
      }
    }

    backtrack(0, []);
    return results;
  }

  private static collectRecipeIds(node: RecipeNode): string[] {
    const ids: string[] = [];
    if (node.recipe) {
      ids.push(node.recipe.id);
    }
    for (const child of node.children) {
      ids.push(...RecipeSolver.collectRecipeIds(child));
    }
    return [...new Set(ids)];
  }

  private static aggregateStats(
    node: RecipeNode
  ): { totalMachines: number; totalPower: number; totalWater: number; totalFootprint: number } {
    let totalMachines = node.machinesNeeded ?? 0;
    let totalPower = 0;
    let totalWater = 0;
    let totalFootprint = 0;

    if (node.recipe && node.machinesNeeded) {
      const building = ProductionCalculator.getBuildingForRecipe(node.recipe);
      const powerBase = building?.powerConsumption ?? 0;
      totalPower = node.machinesNeeded * powerBase;
      const width = building?.width ?? 1;
      const height = building?.height ?? 1;
      totalFootprint = node.machinesNeeded * width * height;

      const waterIngredient = node.recipe.ingredients.find((i) => i.item === "water");
      if (waterIngredient) {
        const waterRate = (waterIngredient.amount / node.recipe.manufacturingDuration) * node.machinesNeeded;
        totalWater = waterRate;
      }
    }

    for (const child of node.children) {
      const childStats = RecipeSolver.aggregateStats(child);
      totalMachines += childStats.totalMachines;
      totalPower += childStats.totalPower;
      totalWater += childStats.totalWater;
      totalFootprint += childStats.totalFootprint;
    }

    return { totalMachines, totalPower, totalWater, totalFootprint };
  }

  private static formatSummary(tree: RecipeNode, totalMachines: number, totalPower: number, totalWater: number, totalFootprint: number): string {
    const lines: string[] = [];
    RecipeSolver.formatTree(tree, 0, lines);
    lines.push("");
    lines.push(`Total machines: ${totalMachines.toFixed(2)}`);
    lines.push(`Total power: ${totalPower.toFixed(2)} MW`);
    lines.push(`Total water: ${totalWater.toFixed(2)} m³/min`);
    lines.push(`Total footprint: ${totalFootprint.toFixed(2)} tiles`);
    return lines.join("\n");
  }

  private static formatTree(node: RecipeNode, depth: number, lines: string[]): void {
    const indent = "  ".repeat(depth);
    const rateStr = node.rate.toFixed(2);
    const machinesStr = node.machinesNeeded ? ` (${node.machinesNeeded.toFixed(2)} ${node.recipe?.machineType ?? "machines"})` : "";
    const recipeStr = node.recipe ? ` via ${node.recipe.name}` : "";
    const circularStr = node.isCircular ? " [CIRCULAR]" : "";

    if (!node.recipe && node.children.length === 0) {
      lines.push(`${indent}${node.item}: ${rateStr}/min (raw input)`);
    } else {
      lines.push(`${indent}${node.item}: ${rateStr}/min${recipeStr}${machinesStr}${circularStr}`);
    }

    for (const child of node.children) {
      RecipeSolver.formatTree(child, depth + 1, lines);
    }
  }
}