import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  stackSize: z.number().positive(),
  fluid: z.boolean().default(false),
});

export type Item = z.infer<typeof ItemSchema>;

export const BuildingCategory = z.enum([
  'production',
  'logistics',
  'power',
  'organization',
]);

export type BuildingCategoryType = z.infer<typeof BuildingCategory>;

export const BuildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  powerConsumption: z.number().nonnegative(),
  powerProduction: z.number().nonnegative().default(0),
  categories: z.array(BuildingCategory),
});

export type Building = z.infer<typeof BuildingSchema>;

export const RecipeIngredientSchema = z.object({
  item: z.string(),
  rate: z.number().positive(),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  products: z.array(RecipeIngredientSchema),
  manufacturingDuration: z.number().positive(),
  machineType: z.string(),
  isAlternate: z.boolean().default(false),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const ResourceNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  purity: z.enum(['pure', 'normal', 'impure']),
  x: z.number(),
  y: z.number(),
  zoneId: z.string().optional(),
});

export type ResourceNode = z.infer<typeof ResourceNodeSchema>;

export interface PlacedBuilding {
  id: string;
  buildingId: string;
  recipeId: string | null;
  overclockPercent: number;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  sourceBuildingId: string;
  targetBuildingId: string;
  sourcePort: number;
  targetPort: number;
  type: 'conveyor' | 'pipe' | 'power';
}

export interface PowerEntry {
  buildingId: string;
  buildingName: string;
  recipeId: string | null;
  recipeName: string | null;
  overclockPercent: number;
  powerConsumption: number;
  powerProduction: number;
  isGenerator: boolean;
}

export interface PowerBalance {
  demand: number;
  supply: number;
  deficit: number;
  utilization: number;
  status: 'balanced' | 'warning' | 'deficit';
  entries: PowerEntry[];
}