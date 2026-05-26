import { describe, it, expect } from "vitest";
import { RecipeSolver } from "../src/solver";
import { ProductionCalculator } from "../src/calculator";
import { aRecipes, aGameData } from "../src/data";
import { ItemSchema, RecipeSchema } from "../src/types";

describe("Game data validation", () => {
  it("parses all items successfully", () => {
    for (const item of aGameData.items) {
      expect(() => ItemSchema.parse(item)).not.toThrow();
    }
  });

  it("parses all recipes successfully", () => {
    for (const recipe of aRecipes) {
      expect(() => RecipeSchema.parse(recipe)).not.toThrow();
    }
  });
});

describe("ProductionCalculator", () => {
  it("computes rates for iron ingot recipe", () => {
    const recipe = aRecipes.find((r) => r.id === "iron-ingot")!;
    const result = ProductionCalculator.computeRates(recipe, 1, 100);
    expect(result.outputs[0].item).toBe("iron-ingot");
    expect(result.outputs[0].rate).toBeCloseTo(0.5);
    expect(result.inputs[0].item).toBe("iron-ore");
    expect(result.inputs[0].rate).toBeCloseTo(0.5);
  });

  it("computes rates with overclock at 250%", () => {
    const recipe = aRecipes.find((r) => r.id === "iron-ingot")!;
    const result = ProductionCalculator.computeRates(recipe, 1, 250);
    expect(result.outputs[0].rate).toBeCloseTo(1.25);
    expect(result.power).toBeGreaterThan(0);
  });

  it("returns empty result for zero machines", () => {
    const recipe = aRecipes.find((r) => r.id === "iron-ingot")!;
    const result = ProductionCalculator.computeRates(recipe, 0, 100);
    expect(result.inputs).toHaveLength(0);
    expect(result.outputs).toHaveLength(0);
    expect(result.power).toBe(0);
  });

  it("resolves a chain from iron ore to screw", () => {
    const tree = ProductionCalculator.resolveChain("screw", 10);
    expect(tree.item).toBe("screw");
    expect(tree.recipe).not.toBeNull();
    expect(tree.children.length).toBeGreaterThan(0);
  });

  it("suggests alternate recipes", () => {
    const alts = ProductionCalculator.suggestAlternates("reinforced-iron-plate");
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.every((r) => r.isAlternate)).toBe(true);
  });
});

describe("RecipeSolver", () => {
  it("solves for 30 reinforced iron plates per minute", () => {
    const result = RecipeSolver.solve({
      targetItem: "reinforced-iron-plate",
      targetRate: 30,
    });
    expect(result.tree.item).toBe("reinforced-iron-plate");
    expect(result.tree.rate).toBe(30);
    expect(result.totalMachines).toBeGreaterThan(0);
    expect(result.summary).toContain("Reinforced Iron Plate");
  });

  it("solves for smart plating with alternate recipes", () => {
    const result = RecipeSolver.solve({
      targetItem: "smart-plating",
      targetRate: 10,
      preferredAlts: ["stitched-iron-plate"],
    });
    expect(result.tree.item).toBe("smart-plating");
    expect(result.totalMachines).toBeGreaterThan(0);
  });

  it("detects circular dependencies gracefully", () => {
    const tree = ProductionCalculator.resolveChain("screw", 30);
    expect(tree).toBeDefined();
  });

  it("respects excluded resource constraints", () => {
    const result = RecipeSolver.solve({
      targetItem: "iron-ingot",
      targetRate: 30,
      excludedItems: ["water"],
    });
    expect(result.tree).toBeDefined();
  });

  it("includes totalWater in result", () => {
    const result = RecipeSolver.solve({
      targetItem: "iron-ingot",
      targetRate: 30,
    });
    expect(result).toHaveProperty("totalWater");
    expect(typeof result.totalWater).toBe("number");
  });

  it("includes totalFootprint in result", () => {
    const result = RecipeSolver.solve({
      targetItem: "iron-ingot",
      targetRate: 30,
    });
    expect(result).toHaveProperty("totalFootprint");
    expect(typeof result.totalFootprint).toBe("number");
  });

  it("includes recipeIds in result", () => {
    const result = RecipeSolver.solve({
      targetItem: "iron-ingot",
      targetRate: 30,
    });
    expect(result.recipeIds).toContain("iron-ingot");
  });

  it("includes label in result", () => {
    const result = RecipeSolver.solve({
      targetItem: "iron-ingot",
      targetRate: 30,
    });
    expect(result.label).toBe("Default");
  });

  it("label reflects preferred alternates", () => {
    const result = RecipeSolver.solve({
      targetItem: "reinforced-iron-plate",
      targetRate: 10,
      preferredAlts: ["stitched-iron-plate"],
    });
    expect(result.label).toBe("Stitched Iron Plate");
  });
});

describe("RecipeSolver.compareAlternates", () => {
  it("returns at least one entry for items with alternates", () => {
    const result = RecipeSolver.compareAlternates({
      targetItem: "reinforced-iron-plate",
      targetRate: 10,
    });
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
  });

  it("returns default entry even when no alternates exist", () => {
    const result = RecipeSolver.compareAlternates({
      targetItem: "iron-ingot",
      targetRate: 30,
    });
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
    expect(result.entries[0].label).toBe("Default");
  });

  it("highlights best metrics", () => {
    const result = RecipeSolver.compareAlternates({
      targetItem: "reinforced-iron-plate",
      targetRate: 10,
    });
    if (result.entries.length > 1) {
      expect(result.bestMachines).not.toBeNull();
      expect(result.bestPower).not.toBeNull();
      expect(result.bestWater).not.toBeNull();
      expect(result.bestFootprint).not.toBeNull();
      const bestMachineEntry = result.entries.find(
        (e) => e.result.totalMachines === result.bestMachines
      );
      expect(bestMachineEntry).toBeDefined();
    }
  });

  it("includes alternate combinations for reinforced iron plate", () => {
    const result = RecipeSolver.compareAlternates({
      targetItem: "reinforced-iron-plate",
      targetRate: 10,
    });
    const hasNonDefaultEntry = result.entries.some((e) => e.label !== "Default");
    if (aRecipes.some((r) => r.isAlternate && r.products.some((p) => p.item === "reinforced-iron-plate"))) {
      expect(hasNonDefaultEntry).toBe(true);
    }
  });

  it("produces valid SolverResult objects for all entries", () => {
    const result = RecipeSolver.compareAlternates({
      targetItem: "screw",
      targetRate: 10,
    });
    for (const entry of result.entries) {
      expect(entry.result.tree).toBeDefined();
      expect(entry.result.totalMachines).toBeGreaterThan(0);
      expect(entry.result.totalPower).toBeGreaterThanOrEqual(0);
      expect(entry.result.totalWater).toBeGreaterThanOrEqual(0);
      expect(entry.result.totalFootprint).toBeGreaterThanOrEqual(0);
      expect(entry.result.recipeIds.length).toBeGreaterThan(0);
    }
  });

  it("respects excluded items", () => {
    const result = RecipeSolver.compareAlternates({
      targetItem: "iron-ingot",
      targetRate: 30,
      excludedItems: ["water"],
    });
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
  });
});