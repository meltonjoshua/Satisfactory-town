import type { ComparisonResult, SolverResult } from "@satisfactory-planner/shared";

interface ComparisonTableProps {
  comparison: ComparisonResult;
  onSelectSolution: (entry: SolverResult) => void;
  selectedRecipeIds: string[];
}

function formatMetric(value: number, unit: string): string {
  return `${value.toFixed(2)} ${unit}`;
}

function MetricCell({
  value,
  unit,
  isBest,
}: {
  value: number;
  unit: string;
  isBest: boolean;
}) {
  return (
    <td className={`px-3 py-2 text-center ${isBest ? "text-emerald-400 font-semibold" : "text-gray-300"}`}>
      {formatMetric(value, unit)}
      {isBest && <span className="ml-1 text-emerald-500">&#10003;</span>}
    </td>
  );
}

export default function ComparisonTable({
  comparison,
  onSelectSolution,
  selectedRecipeIds,
}: ComparisonTableProps) {
  const { entries, bestMachines, bestPower, bestWater, bestFootprint } = comparison;

  if (entries.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <p className="text-gray-400">No alternate recipe combinations found for this product.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">Alternate Recipe Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400 font-medium">Recipe Combination</th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">Machines</th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">Power (MW)</th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">Water (m³/min)</th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">Footprint (tiles)</th>
              <th className="px-3 py-2 text-center text-gray-400 font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isSelected =
                JSON.stringify([...entry.recipeIds].sort()) ===
                JSON.stringify([...selectedRecipeIds].sort());
              const isBestMachines =
                bestMachines != null && entry.result.totalMachines === bestMachines;
              const isBestPower =
                bestPower != null && entry.result.totalPower === bestPower;
              const isBestWater =
                bestWater != null && entry.result.totalWater === bestWater;
              const isBestFootprint =
                bestFootprint != null && entry.result.totalFootprint === bestFootprint;

              return (
                <tr
                  key={entry.label}
                  className={`border-b border-gray-800 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-amber-900/30 border-l-2 border-l-amber-500"
                      : "hover:bg-gray-800/50"
                  }`}
                  onClick={() => onSelectSolution(entry.result)}
                >
                  <td className="px-3 py-2 text-gray-200 font-medium">{entry.label}</td>
                  <MetricCell
                    value={entry.result.totalMachines}
                    unit=""
                    isBest={isBestMachines}
                  />
                  <MetricCell
                    value={entry.result.totalPower}
                    unit=""
                    isBest={isBestPower}
                  />
                  <MetricCell
                    value={entry.result.totalWater}
                    unit=""
                    isBest={isBestWater}
                  />
                  <MetricCell
                    value={entry.result.totalFootprint}
                    unit=""
                    isBest={isBestFootprint}
                  />
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSolution(entry.result);
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        isSelected
                          ? "bg-amber-500 text-gray-950"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {isSelected ? "Viewing" : "View"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>
          <span className="text-emerald-400">&#10003;</span> Best for metric
        </span>
      </div>
    </div>
  );
}