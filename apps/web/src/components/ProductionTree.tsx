import type { RecipeNode } from "@satisfactory-planner/shared";
import { getItemById } from "@satisfactory-planner/shared";

function formatRate(rate: number): string {
  return rate < 0.01 ? rate.toExponential(2) : rate.toFixed(2);
}

function ProductionTreeNode({ node, depth = 0 }: { node: RecipeNode; depth?: number }) {
  const item = getItemById(node.item);
  const displayName = item?.name ?? node.item;
  const isRawInput = !node.recipe && node.children.length === 0;

  return (
    <div className="ml-4">
      <div
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg ${
          isRawInput
            ? "bg-blue-950/50 border border-blue-800/30"
            : "bg-gray-800/50 border border-gray-700/30"
        }`}
      >
        {isRawInput && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/30">
            RAW
          </span>
        )}
        {node.recipe && !isRawInput && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/30">
            {node.recipe.machineType}
          </span>
        )}
        <span className="font-medium text-gray-200">{displayName}</span>
        <span className="text-gray-400 text-sm">{formatRate(node.rate)}/min</span>
        {node.machinesNeeded && (
          <span className="text-gray-500 text-xs">
            {node.machinesNeeded.toFixed(2)}x {node.recipe?.machineType ?? "machines"}
          </span>
        )}
        {node.isCircular && (
          <span className="text-xs text-red-400">[CIRCULAR]</span>
        )}
      </div>
      {node.children.map((child, i) => (
        <ProductionTreeNode key={`${child.item}-${depth}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

interface ProductionTreeProps {
  tree: RecipeNode;
  totalMachines: number;
  totalPower: number;
  totalWater?: number;
  totalFootprint?: number;
}

export default function ProductionTree({ tree, totalMachines, totalPower, totalWater, totalFootprint }: ProductionTreeProps) {
  const rootItem = getItemById(tree.item);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
          <span className="text-gray-400 text-xs block">Total Machines</span>
          <span className="text-xl font-bold text-amber-400">{totalMachines.toFixed(2)}</span>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
          <span className="text-gray-400 text-xs block">Total Power</span>
          <span className="text-xl font-bold text-amber-400">{totalPower.toFixed(2)} MW</span>
        </div>
        {totalWater != null && totalWater > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-xs block">Total Water</span>
            <span className="text-xl font-bold text-amber-400">{totalWater.toFixed(2)} m³/min</span>
          </div>
        )}
        {totalFootprint != null && totalFootprint > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-xs block">Total Footprint</span>
            <span className="text-xl font-bold text-amber-400">{totalFootprint.toFixed(2)} tiles</span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-200">
        Production Tree for {rootItem?.name ?? tree.item}
      </h3>

      <div className="space-y-1">
        <ProductionTreeNode node={tree} />
      </div>
    </div>
  );
}