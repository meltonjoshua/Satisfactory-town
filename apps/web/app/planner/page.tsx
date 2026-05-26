'use client';

import { useState } from 'react';
import type { PlacedBuilding } from '@satisfactory-planner/shared';
import { usePowerBalance } from '../../hooks/usePowerBalance';
import { useFluidBalance } from '../../hooks/useFluidBalance';
import PowerBalancePanel from '../../components/PowerBalancePanel';
import FluidBalancePanel from '../../components/FluidBalancePanel';

const DEMO_BUILDINGS: PlacedBuilding[] = [
  { id: 'b1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 100, x: 100, y: 100 },
  { id: 'b2', buildingId: 'constructor', recipeId: 'iron-rod', overclockPercent: 100, x: 200, y: 100 },
  { id: 'b3', buildingId: 'assembler', recipeId: 'reinforced-iron-plate', overclockPercent: 100, x: 300, y: 100 },
  { id: 'b4', buildingId: 'smelter', recipeId: 'iron-ingot', overclockPercent: 100, x: 100, y: 200 },
  { id: 'b5', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 400, y: 100 },
  { id: 'b6', buildingId: 'biomass-burner', recipeId: null, overclockPercent: 100, x: 500, y: 100 },
  { id: 'b7', buildingId: 'water-extractor', recipeId: null, overclockPercent: 100, x: 600, y: 100 },
  { id: 'b8', buildingId: 'refinery', recipeId: 'fuel-production', overclockPercent: 100, x: 700, y: 100 },
  { id: 'b9', buildingId: 'fuel-generator', recipeId: null, overclockPercent: 100, x: 800, y: 100 },
  { id: 'b10', buildingId: 'refinery', recipeId: 'pure-iron-ingot', overclockPercent: 100, x: 100, y: 300 },
];

type PanelTab = 'power' | 'fluid';

export default function PlannerPage() {
  const [buildings] = useState<PlacedBuilding[]>(DEMO_BUILDINGS);
  const [activeTab, setActiveTab] = useState<PanelTab>('power');
  const powerBalance = usePowerBalance(buildings);
  const fluidBalance = useFluidBalance(buildings);

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <div className="flex-1 relative bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="text-lg">Planner Canvas</p>
            <p className="text-sm mt-1">Visual designer coming in a separate convoy</p>
            <p className="text-xs mt-2 text-gray-700">
              {buildings.length} demo buildings placed for balance preview
            </p>
          </div>
        </div>
      </div>
      <div className="w-80 shrink-0 flex flex-col">
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'power'
                ? 'text-yellow-400 border-b-2 border-yellow-400 bg-gray-800/50'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('power')}
          >
            Power
          </button>
          <button
            className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'fluid'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('fluid')}
          >
            Fluid
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'power' ? (
            <PowerBalancePanel powerBalance={powerBalance} />
          ) : (
            <FluidBalancePanel fluidBalance={fluidBalance} />
          )}
        </div>
      </div>
    </div>
  );
}