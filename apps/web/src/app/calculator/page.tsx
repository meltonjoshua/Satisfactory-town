"use client";

import { useState } from "react";
import RecipeCalculatorForm from "@/components/RecipeCalculatorForm";
import ProductionTree from "@/components/ProductionTree";
import { type SolverResult } from "@satisfactory-planner/shared";

export default function CalculatorPage() {
  const [result, setResult] = useState<SolverResult | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-400 mb-6">Recipe Calculator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Configure</h2>
          <RecipeCalculatorForm onSolve={setResult} />
        </div>
        <div>
          {result ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">Results</h2>
              <ProductionTree
                tree={result.tree}
                totalMachines={result.totalMachines}
                totalPower={result.totalPower}
              />
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 flex items-center justify-center">
              <p className="text-gray-500">
                Select a product and target rate, then click Solve to see the production tree.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}