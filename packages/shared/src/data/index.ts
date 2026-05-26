import itemsJson from './raw/items.json';
import buildingsJson from './raw/buildings.json';
import recipesJson from './raw/recipes.json';
import { ItemSchema, BuildingSchema, RecipeSchema } from '../types';
import type { Item, Building, Recipe } from '../types';

function validateItems(data: unknown[]): Item[] {
  return data.map((item, i) => {
    const result = ItemSchema.safeParse(item);
    if (!result.success) {
      throw new Error(`Invalid item at index ${i}: ${result.error.message}`);
    }
    return result.data;
  });
}

function validateBuildings(data: unknown[]): Building[] {
  return data.map((item, i) => {
    const result = BuildingSchema.safeParse(item);
    if (!result.success) {
      throw new Error(`Invalid building at index ${i}: ${result.error.message}`);
    }
    return result.data;
  });
}

function validateRecipes(data: unknown[]): Recipe[] {
  return data.map((item, i) => {
    const result = RecipeSchema.safeParse(item);
    if (!result.success) {
      throw new Error(`Invalid recipe at index ${i}: ${result.error.message}`);
    }
    return result.data;
  });
}

let _items: Item[] | null = null;
let _buildings: Building[] | null = null;
let _recipes: Recipe[] | null = null;

function getItems(): Item[] {
  if (!_items) {
    _items = validateItems(itemsJson as unknown[]);
  }
  return _items;
}

function getBuildings(): Building[] {
  if (!_buildings) {
    _buildings = validateBuildings(buildingsJson as unknown[]);
  }
  return _buildings;
}

function getRecipes(): Recipe[] {
  if (!_recipes) {
    _recipes = validateRecipes(recipesJson as unknown[]);
  }
  return _recipes;
}

export const aGameData = {
  get items() { return getItems(); },
  get buildings() { return getBuildings(); },
  get recipes() { return getRecipes(); },
};

export { getItems, getBuildings, getRecipes };