import { useState, useCallback } from "react";
import { RecipeSolver, type SolverResult, type SolverOptions, aGameData, getItemsProducibleByRecipes, getAlternateRecipes, RESOURCE_CONSTRAINTS } from "@satisfactory-planner/shared";
import { type CalculatorFormState, validateForm } from "../hooks/useCalculatorForm";

const producibleItems = getItemsProducibleByRecipes();
const alternateRecipes = getAlternateRecipes();

export interface RecipeCalculatorFormProps {
  onSolve: (result: SolverResult, options: SolverOptions) => void;
}

export default function RecipeCalculatorForm({ onSolve }: RecipeCalculatorFormProps) {
  const [form, setForm] = useState<CalculatorFormState>({
    targetItem: "",
    targetRate: 30,
    preferredAlts: [],
    excludedResources: [],
    errors: {},
  });

  const [isSolving, setIsSolving] = useState(false);

  const updateField = useCallback(
    (field: keyof CalculatorFormState, value: string | number | string[]) => {
      setForm((prev) => ({ ...prev, [field]: value, errors: { ...prev.errors, [field]: "" } }));
    },
    []
  );

  const toggleAlt = useCallback((altId: string) => {
    setForm((prev) => ({
      ...prev,
      preferredAlts: prev.preferredAlts.includes(altId)
        ? prev.preferredAlts.filter((id) => id !== altId)
        : [...prev.preferredAlts, altId],
    }));
  }, []);

  const toggleResource = useCallback((resourceId: string) => {
    setForm((prev) => ({
      ...prev,
      excludedResources: prev.excludedResources.includes(resourceId)
        ? prev.excludedResources.filter((id) => id !== resourceId)
        : [...prev.excludedResources, resourceId],
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validateForm(form);
      if (Object.keys(errors).length > 0) {
        setForm((prev) => ({ ...prev, errors }));
        return;
      }

      setIsSolving(true);
      try {
        const excludedItems = form.excludedResources.flatMap((rId) => {
          const constraint = RESOURCE_CONSTRAINTS.find((c) => c.id === rId);
          return constraint ? [...constraint.excludedItems] : [];
        });

        const options: SolverOptions = {
          targetItem: form.targetItem,
          targetRate: form.targetRate,
          preferredAlts: form.preferredAlts,
          excludedItems,
        };

        const result = RecipeSolver.solve(options);
        onSolve(result, options);
      } finally {
        setIsSolving(false);
      }
    },
    [form, onSolve]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="targetItem" className="block text-sm font-medium text-gray-300 mb-1">
          Target Product
        </label>
        <select
          id="targetItem"
          value={form.targetItem}
          onChange={(e) => updateField("targetItem", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Select a product...</option>
          {producibleItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {form.errors.targetItem && (
          <p className="mt-1 text-sm text-red-400">{form.errors.targetItem}</p>
        )}
      </div>

      <div>
        <label htmlFor="targetRate" className="block text-sm font-medium text-gray-300 mb-1">
          Target Quantity (items/min)
        </label>
        <input
          id="targetRate"
          type="number"
          min={0.01}
          step={0.01}
          value={form.targetRate}
          onChange={(e) => updateField("targetRate", parseFloat(e.target.value) || 0)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        {form.errors.targetRate && (
          <p className="mt-1 text-sm text-red-400">{form.errors.targetRate}</p>
        )}
      </div>

      {alternateRecipes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Alternate Recipes
          </label>
          <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-800 rounded-lg p-3 border border-gray-700">
            {alternateRecipes.map((recipe) => {
              const item = aGameData.items.find((i) =>
                recipe.products.some((p) => p.item === i.id)
              );
              return (
                <label key={recipe.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.preferredAlts.includes(recipe.id)}
                    onChange={() => toggleAlt(recipe.id)}
                    className="rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-300">
                    {recipe.name}
                    {item && <span className="text-gray-500 ml-1">({item.name})</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Available Resource Constraints
        </label>
        <div className="space-y-1">
          {RESOURCE_CONSTRAINTS.map((constraint) => (
            <label key={constraint.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.excludedResources.includes(constraint.id)}
                onChange={() => toggleResource(constraint.id)}
                className="rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-300">{constraint.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSolving}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold py-2.5 px-4 rounded-lg transition-colors"
      >
        {isSolving ? "Solving..." : "Solve"}
      </button>
    </form>
  );
}