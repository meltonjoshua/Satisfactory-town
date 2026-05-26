import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  stackSize: z.number().positive(),
  fluid: z.boolean().default(false),
});

export type Item = z.infer<typeof ItemSchema>;

export const BuildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  powerConsumption: z.number().nonnegative(),
  powerProduction: z.number().nonnegative().default(0),
  categories: z.array(z.string()).default([]),
});

export type Building = z.infer<typeof BuildingSchema>;

export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(z.object({ item: z.string(), rate: z.number() })),
  products: z.array(z.object({ item: z.string(), rate: z.number() })),
  manufacturingDuration: z.number().positive(),
  machineType: z.string(),
  isAlternate: z.boolean().default(false),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const ResourceNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  purity: z.enum(['impure', 'normal', 'pure']),
  x: z.number(),
  y: z.number(),
  zoneId: z.string().optional(),
});

export type ResourceNode = z.infer<typeof ResourceNodeSchema>;

export const PlacedBuildingSchema = z.object({
  id: z.string(),
  buildingId: z.string(),
  x: z.number(),
  y: z.number(),
  recipeId: z.string().optional(),
  overclockPercent: z.number().min(1).max(250).default(100),
});

export type PlacedBuilding = z.infer<typeof PlacedBuildingSchema>;

export const ConnectionSchema = z.object({
  id: z.string(),
  sourceBuildingId: z.string(),
  sourcePort: z.string(),
  targetBuildingId: z.string(),
  targetPort: z.string(),
  type: z.enum(['conveyor', 'pipe', 'power']),
});

export type Connection = z.infer<typeof ConnectionSchema>;

export const ScenarioStatsSchema = z.object({
  totalPowerConsumption: z.number().nonnegative().default(0),
  totalPowerProduction: z.number().nonnegative().default(0),
  buildingCounts: z.record(z.string(), z.number()).default({}),
  inputResources: z.record(z.string(), z.number()).default({}),
  outputResources: z.record(z.string(), z.number()).default({}),
});

export type ScenarioStats = z.infer<typeof ScenarioStatsSchema>;

export const ScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  buildings: z.array(PlacedBuildingSchema),
  connections: z.array(ConnectionSchema),
  stats: ScenarioStatsSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

export const ScenarioDiffSchema = z.object({
  buildingCountDiffs: z.record(z.string(), z.number()),
  powerConsumptionDiff: z.number(),
  powerProductionDiff: z.number(),
  throughputDiffs: z.record(z.string(), z.number()),
  resourceUsageDiffs: z.record(z.string(), z.number()),
});

export type ScenarioDiff = z.infer<typeof ScenarioDiffSchema>;