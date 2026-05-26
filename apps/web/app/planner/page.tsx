'use client';

import { useState } from 'react';
import type { PlacedBuilding } from '@satisfactory-planner/shared';
import { usePowerBalance } from '../../hooks/usePowerBalance';
import PowerBalancePanel from '../../components/PowerBalancePanel';

const DEMO_BUILDINGS: PlacedBuilding[] = [
  { id: 'b1', buildingId: 'constructor', recipeId: 'iron-plate', overclockPercent: 100, x: 100, y: 100 },
  { id: 'b2', buildingId: 'constructor', recipeId: 'iron-rod', overclockPercent: 100, x: 200, y: 100 },
  { id: 'b3', buildingId: 'assembler', recipeId: 'reinforced-iron-plate', overclockPercent: 100, x: 300, y: 100 },
  { id: 'b4', buildingId: 'smelter', recipeId: 'iron-ingot', overclockPercent: 100, x: 100, y: 200 },
  { id: 'b5', buildingId: 'coal-generator', recipeId: null, overclockPercent: 100, x: 400, y: 100 },
  { id: 'b6', buildingId: 'biomass-burner', recipeId: null, overclockPercent: 100, x: 500, y: 100 },
];

export default function PlannerPage() {
  const [buildings] = useState<PlacedBuilding[]>(DEMO_BUILDINGS);
  const powerBalance = usePowerBalance(buildings);

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <div className="flex-1 relative bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <p className="text-lg">Planner Canvas</p>
            <p className="text-sm mt-1">Visual designer coming in a separate convoy</p>
            <p className="text-xs mt-2 text-gray-700">
              {buildings.length} demo buildings placed for power balance preview
            </p>
          </div>
        </div>
      </div>
      <div className="w-80 shrink-0">
        <PowerBalancePanel powerBalance={powerBalance} />
      </div>
    </div>
  );
}