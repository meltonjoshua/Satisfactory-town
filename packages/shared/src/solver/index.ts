import { aGameData } from '../data';
import type { Recipe } from '../types';
import { ProductionCalculator } from '../calculator';
import type { RecipeNode } from '../calculator';

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
  summary: string;
}

export class RecipeSolver {
  static solve(options: SolverOptions): SolverResult {
    const {
      targetItem,
      targetRate,
      preferredAlts = [],
      excludedItems = [],
    } = options;

    let recipes = options.availableRecipes ?? [...aGameData.recipes];

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

    const { totalMachines, totalPower } = RecipeSolver.aggregateStats(tree);

    const summary = RecipeSolver.formatSummary(tree, totalMachines, totalPower);

    return { tree, totalMachines, totalPower, summary };
  }

  private static aggregateStats(
    node: RecipeNode
  ): { totalMachines: number; totalPower: number } {
    let totalMachines = node.machineCount;
    let totalPower = node.computedRates.power;

    for (const child of node.children) {
      const childStats = RecipeSolver.aggregateStats(child);
      totalMachines += childStats.totalMachines;
      totalPower += childStats.totalPower;
    }

    return { totalMachines, totalPower };
  }

  private static formatSummary(tree: RecipeNode, totalMachines: number, totalPower: number): string {
    const lines: string[] = [];
    RecipeSolver.formatTree(tree, 0, lines);
    lines.push('');
    lines.push(`Total machines: ${totalMachines.toFixed(2)}`);
    lines.push(`Total power: ${totalPower.toFixed(2)} MW`);
    return lines.join('\n');
  }

  private static formatTree(node: RecipeNode, depth: number, lines: string[]): void {
    const indent = '  '.repeat(depth);
    const rateStr = node.computedRates.outputs[0]?.rate.toFixed(2) ?? '0.00';
    const machinesStr = ` (${node.machineCount.toFixed(2)} ${node.recipe.machineType})`;
    const recipeStr = ` via ${node.recipe.name}`;

    lines.push(`${indent}${node.recipe.products[0].item}: ${rateStr}/min${recipeStr}${machinesStr}`);

    for (const child of node.children) {
      RecipeSolver.formatTree(child, depth + 1, lines);
    }
  }
}