'use client';

import type { PowerBalance, PowerEntry } from '@satisfactory-planner/shared';

interface PowerBalancePanelProps {
  powerBalance: PowerBalance;
}

function formatPower(mw: number): string {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  if (mw >= 1) return `${mw.toFixed(1)} MW`;
  return `${(mw * 1000).toFixed(0)} kW`;
}

function statusColor(status: PowerBalance['status']): string {
  switch (status) {
    case 'balanced': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'deficit': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function statusTextColor(status: PowerBalance['status']): string {
  switch (status) {
    case 'balanced': return 'text-green-400';
    case 'warning': return 'text-yellow-400';
    case 'deficit': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

function statusLabel(status: PowerBalance['status']): string {
  switch (status) {
    case 'balanced': return 'Balanced';
    case 'warning': return 'Warning';
    case 'deficit': return 'Deficit';
    default: return 'Unknown';
  }
}

function statusBorderColor(status: PowerBalance['status']): string {
  switch (status) {
    case 'balanced': return 'border-green-500/30';
    case 'warning': return 'border-yellow-500/30';
    case 'deficit': return 'border-red-500/30';
    default: return 'border-gray-500/30';
  }
}



export default function PowerBalancePanel({ powerBalance }: PowerBalancePanelProps) {
  const { demand, supply, deficit, utilization, status, entries } = powerBalance;
  const barPercent = supply > 0 ? Math.min(100, (demand / supply) * 100) : demand > 0 ? 100 : 0;

  const consumers = entries.filter((e: PowerEntry) => !e.isGenerator);
  const generators = entries.filter((e: PowerEntry) => e.isGenerator);

  return (
    <div className={`flex flex-col h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] ${statusBorderColor(status)}`}>
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-base font-semibold text-gray-200">Power Balance</h2>
        <div className={`text-xs font-medium mt-1 ${statusTextColor(status)}`}>
          {statusLabel(status)}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Demand: {formatPower(demand)}</span>
          <span>Supply: {formatPower(supply)}</span>
        </div>

        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${statusColor(status)}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>Utilization: {utilization === Infinity ? '∞' : `${(utilization * 100).toFixed(0)}%`}</span>
          <span>100%</span>
        </div>

        {deficit > 0 && (
          <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-500/40 rounded text-red-300 text-xs">
            <span className="font-semibold">⚡ Deficit:</span> Need {formatPower(deficit)} more power
          </div>
        )}

        {status === 'warning' && (
          <div className="mt-3 px-3 py-2 bg-yellow-900/30 border border-yellow-500/40 rounded text-yellow-300 text-xs">
            <span className="font-semibold">⚠ Warning:</span> Within 10% of capacity
          </div>
        )}
      </div>

      {generators.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Generators
          </h3>
          <div className="space-y-1">
            {generators.map((entry: PowerEntry) => (
              <div key={entry.buildingId} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="truncate text-gray-300">{entry.buildingName}</span>
                  {entry.recipeName && (
                    <span className="text-gray-500 text-xs truncate">({entry.recipeName})</span>
                  )}
                </div>
                <span className="text-green-400 font-mono text-xs ml-2 shrink-0">
                  +{formatPower(entry.powerProduction)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Consumers
        </h3>
        {consumers.length === 0 ? (
          <p className="text-gray-600 text-xs italic">No buildings placed</p>
        ) : (
          <div className="space-y-1">
            {consumers.map((entry: PowerEntry) => (
              <div
                key={entry.buildingId}
                className="flex justify-between items-center text-sm py-1 border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate text-gray-300">{entry.buildingName}</span>
                  {entry.recipeName && (
                    <span className="text-gray-500 text-xs truncate">({entry.recipeName})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {entry.overclockPercent !== 100 && (
                    <span className="text-yellow-500 text-xs font-mono">
                      {entry.overclockPercent}%
                    </span>
                  )}
                  <span className="text-red-400 font-mono text-xs">
                    -{formatPower(entry.powerConsumption)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        {entries.length} building{entries.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}