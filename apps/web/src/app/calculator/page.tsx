"use client";

import { useState, useCallback } from "react";
import RecipeCalculatorForm from "@/components/RecipeCalculatorForm";
import ProductionTree from "@/components/ProductionTree";
import ComparisonTable from "@/components/ComparisonTable";
import { type SolverResult, type SolverOptions, type ComparisonResult, RecipeSolver } from "@satisfactory-planner/shared";

export default function CalculatorPage() {
  const [result, setResult] = useState<SolverResult | null>(null);
  const [solverOptions, setSolverOptions] = useState<SolverOptions | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<SolverResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleSolve = useCallback((solverResult: SolverResult, options: SolverOptions) => {
    setResult(solverResult);
    setSolverOptions(options);
    setComparison(null);
    setSelectedResult(null);
  }, []);

  const handleCompare = useCallback(() => {
    if (!solverOptions) return;
    setIsComparing(true);
    try {
      const compResult = RecipeSolver.compareAlternates({
        targetItem: solverOptions.targetItem,
        targetRate: solverOptions.targetRate,
        excludedItems: solverOptions.excludedItems,
      });
      setComparison(compResult);
      setSelectedResult(null);
    } finally {
      setIsComparing(false);
    }
  }, [solverOptions]);

  const handleSelectSolution = useCallback((entry: SolverResult) => {
    setSelectedResult(entry);
  }, []);

  const displayResult = selectedResult ?? result;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">Recipe Calculator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Configure</h2>
          <RecipeCalculatorForm onSolve={handleSolve} />
        </div>
        <div className="lg:col-span-2">
          {displayResult ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  {selectedResult ? `Results — ${selectedResult.label}` : "Results"}
                </h2>
                <button
                  onClick={handleCompare}
                  disabled={isComparing || !result}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                >
                  {isComparing ? "Comparing..." : "Compare Alternates"}
                </button>
              </div>
              <ProductionTree
                tree={displayResult.tree}
                totalMachines={displayResult.totalMachines}
                totalPower={displayResult.totalPower}
                totalWater={displayResult.totalWater}
                totalFootprint={displayResult.totalFootprint}
              />
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 flex items-center justify-center">
              <p className="text-gray-500">
                Select a product and target rate, then click Solve to see the production tree.
              </p>
            </div>
          )}

          {comparison && (
            <div className="mt-6">
              <ComparisonTable
                comparison={comparison}
                onSelectSolution={handleSelectSolution}
                selectedRecipeIds={selectedResult?.recipeIds ?? result?.recipeIds ?? []}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}