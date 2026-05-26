import { describe, it, expect } from 'vitest';
import { ProductionCalculator } from '../src/calculator';
import { aGameData } from '../src/data';

describe('ProductionCalculator', () => {
  describe('computeRates', () => {
    it('computes rates for a basic recipe at 100% overclock', () => {
      const recipe = aGameData.recipes.find((r) => r.id === 'iron-ingot')!;
      const result = ProductionCalculator.computeRates(recipe, 1, 100);

      expect(result.outputs).toHaveLength(1);
      expect(result.outputs[0].item).toBe('iron-ingot');
      expect(result.power).toBeGreaterThan(0);
    });

    it('returns zero rates for zero machines', () => {
      const recipe = aGameData.recipes.find((r) => r.id === 'iron-ingot')!;
      const result = ProductionCalculator.computeRates(recipe, 0, 100);

      expect(result.inputs).toHaveLength(0);
      expect(result.outputs).toHaveLength(0);
      expect(result.power).toBe(0);
    });

    it('increases power with overclock', () => {
      const recipe = aGameData.recipes.find((r) => r.id === 'iron-ingot')!;
      const base = ProductionCalculator.computeRates(recipe, 1, 100);
      const overclocked = ProductionCalculator.computeRates(recipe, 1, 250);

      expect(overclocked.power).toBeGreaterThan(base.power);
    });

    it('increases output rates with multiple machines', () => {
      const recipe = aGameData.recipes.find((r) => r.id === 'iron-ingot')!;
      const one = ProductionCalculator.computeRates(recipe, 1, 100);
      const five = ProductionCalculator.computeRates(recipe, 5, 100);

      expect(five.outputs[0].rate).toBeCloseTo(one.outputs[0].rate * 5, 1);
    });

    it('computes water for recipes that use water', () => {
      const recipe = aGameData.recipes.find((r) => r.id === 'pure-iron-ingot')!;
      const result = ProductionCalculator.computeRates(recipe, 1, 100);

      expect(result.water).toBeGreaterThan(0);
    });
  });

  describe('computePowerForBuilding', () => {
    it('returns consumption for a production building', () => {
      const result = ProductionCalculator.computePowerForBuilding('constructor', 'iron-plate', 100);
      expect(result.consumption).toBe(4);
      expect(result.production).toBe(0);
    });

    it('returns production for a generator', () => {
      const result = ProductionCalculator.computePowerForBuilding('coal-generator', null, 100);
      expect(result.consumption).toBe(0);
      expect(result.production).toBe(75);
    });

    it('scales power with overclock for generators', () => {
      const base = ProductionCalculator.computePowerForBuilding('coal-generator', null, 100);
      const overclocked = ProductionCalculator.computePowerForBuilding('coal-generator', null, 250);
      expect(overclocked.production).toBeGreaterThan(base.production);
    });

    it('scales power with overclock for consumers', () => {
      const base = ProductionCalculator.computePowerForBuilding('constructor', 'iron-plate', 100);
      const overclocked = ProductionCalculator.computePowerForBuilding('constructor', 'iron-plate', 250);
      expect(overclocked.consumption).toBeGreaterThan(base.consumption);
    });

    it('returns zero for unknown building', () => {
      const result = ProductionCalculator.computePowerForBuilding('nonexistent', null, 100);
      expect(result.consumption).toBe(0);
      expect(result.production).toBe(0);
    });
  });

  describe('resolveChain', () => {
    it('resolves a production chain for screw', () => {
      const result = ProductionCalculator.resolveChain('screw', 40);
      expect(result.recipe.id).toBe('screw');
      expect(result.machineCount).toBeGreaterThan(0);
      expect(result.children.length).toBeGreaterThan(0);
    });

    it('throws for unknown item', () => {
      expect(() => ProductionCalculator.resolveChain('nonexistent', 10)).toThrow();
    });
  });

  describe('suggestAlternates', () => {
    it('returns alternate recipes for reinforced iron plate', () => {
      const results = ProductionCalculator.suggestAlternates('reinforced-iron-plate');
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map((r) => r.recipe.id);
      expect(ids).toContain('reinforced-iron-plate');
      expect(ids).toContain('stitched-iron-plate');
    });

    it('excludes recipes with constrained ingredients', () => {
      const results = ProductionCalculator.suggestAlternates('iron-ingot', ['water']);
      const ids = results.map((r) => r.recipe.id);
      expect(ids).not.toContain('pure-iron-ingot');
    });
  });
});