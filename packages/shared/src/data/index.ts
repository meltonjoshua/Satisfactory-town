import itemsData from "./raw/items.json";
import buildingsData from "./raw/buildings.json";
import recipesData from "./raw/recipes.json";
import { ItemSchema, BuildingSchema, RecipeSchema } from "../types";
import type { Item, Building, Recipe } from "../types";

export const aItems: Item[] = itemsData.map((item) => ItemSchema.parse(item));
export const aBuildings: Building[] = buildingsData.map((b) => BuildingSchema.parse(b));
export const aRecipes: Recipe[] = recipesData.map((r) => RecipeSchema.parse(r));

export const aGameData = {
  items: aItems,
  buildings: aBuildings,
  recipes: aRecipes,
} as const;

export function getItemById(id: string): Item | undefined {
  return aItems.find((item) => item.id === id);
}

export function getRecipesProducing(itemId: string): Recipe[] {
  return aRecipes.filter((r) => r.products.some((p) => p.item === itemId));
}

export function getRecipesConsuming(itemId: string): Recipe[] {
  return aRecipes.filter((r) => r.ingredients.some((i) => i.item === itemId));
}

export function getAlternateRecipes(): Recipe[] {
  return aRecipes.filter((r) => r.isAlternate);
}

export function getItemsProducibleByRecipes(): Item[] {
  const producibleIds = new Set(aRecipes.flatMap((r) => r.products.map((p) => p.item)));
  return aItems.filter((item) => producibleIds.has(item.id));
}

export const RESOURCE_CONSTRAINTS = [
  { id: "no-sulfur", label: "I have no Sulfur", excludedItems: ["sulfur"] },
  { id: "no-coal", label: "I have no Coal", excludedItems: ["coal"] },
  { id: "no-limestone", label: "I have no Limestone", excludedItems: ["limestone"] },
  { id: "no-water", label: "I have no Water", excludedItems: ["water"] },
] as const;

export type ResourceConstraint = (typeof RESOURCE_CONSTRAINTS)[number];