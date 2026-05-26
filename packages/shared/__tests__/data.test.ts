import { describe, it, expect } from 'vitest';
import { ItemSchema, BuildingSchema, RecipeSchema } from '../src/types';
import { aGameData } from '../src/data';
import itemsData from '../src/data/raw/items.json';
import buildingsData from '../src/data/raw/buildings.json';
import recipesData from '../src/data/raw/recipes.json';

describe('Seed data validation', () => {
  it('validates all items', () => {
    const result = itemsData.map((item) => ItemSchema.safeParse(item));
    const failures = result.filter((r) => !r.success);
    expect(failures).toHaveLength(0);
  });

  it('validates all buildings', () => {
    const result = buildingsData.map((b) => BuildingSchema.safeParse(b));
    const failures = result.filter((r) => !r.success);
    expect(failures).toHaveLength(0);
  });

  it('validates all recipes', () => {
    const result = recipesData.map((r) => RecipeSchema.safeParse(r));
    const failures = result.filter((r) => !r.success);
    expect(failures).toHaveLength(0);
  });

  it('aGameData lazy-loads correctly', () => {
    const items = aGameData.items;
    const buildings = aGameData.buildings;
    const recipes = aGameData.recipes;

    expect(items.length).toBeGreaterThan(0);
    expect(buildings.length).toBeGreaterThan(0);
    expect(recipes.length).toBeGreaterThan(0);
  });
});