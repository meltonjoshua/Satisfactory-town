'use client';

import type { FluidBalance, FluidFlowEntry, FluidGroupBalance } from '@satisfactory-planner/shared';

interface FluidBalancePanelProps {
  fluidBalance: FluidBalance;
}

function formatRate(rate: number): string {
  if (rate === 0) return '0 m³/min';
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)}k m³/min`;
  return `${rate.toFixed(1)} m³/min`;
}

function groupStatusColor(status: FluidGroupBalance['status']): string {
  switch (status) {
    case 'balanced': return 'bg-green-500';
    case 'overflow': return 'bg-yellow-500';
    case 'deficit': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function groupStatusTextColor(status: FluidGroupBalance['status']): string {
  switch (status) {
    case 'balanced': return 'text-green-400';
    case 'overflow': return 'text-yellow-400';
    case 'deficit': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

function groupStatusLabel(status: FluidGroupBalance['status']): string {
  switch (status) {
    case 'balanced': return 'Balanced';
    case 'overflow': return 'Overflow';
    case 'deficit': return 'Deficit';
    default: return 'Unknown';
  }
}

function groupStatusBorderColor(status: FluidGroupBalance['status']): string {
  switch (status) {
    case 'balanced': return 'border-green-500/30';
    case 'overflow': return 'border-yellow-500/30';
    case 'deficit': return 'border-red-500/30';
    default: return 'border-gray-500/30';
  }
}

function entryIndicator(entry: FluidFlowEntry): { color: string; label: string } {
  if (entry.isDeadEnd) return { color: 'bg-purple-500', label: 'Dead-end' };
  if (entry.isOverflow) return { color: 'bg-yellow-500', label: 'Overflow' };
  if (entry.surplus < 0) return { color: 'bg-red-500', label: 'Deficit' };
  return { color: 'bg-green-500', label: 'OK' };
}

function FluidGroup({ group }: { group: FluidGroupBalance }) {
  const barPercent = group.totalProduction > 0
    ? Math.min(100, (group.totalConsumption / group.totalProduction) * 100)
    : group.totalConsumption > 0 ? 100 : 0;

  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <div className="px-4 py-2.5 sticky top-0 bg-[var(--panel-bg)] z-10 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-200">{group.label}</h3>
          <span className={`text-xs font-medium ${groupStatusTextColor(group.status)}`}>
            {groupStatusLabel(group.status)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>In: {formatRate(group.totalProduction)}</span>
          <span>Out: {formatRate(group.totalConsumption)}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-1.5">
          <div
            className={`h-full rounded-full transition-all ${groupStatusColor(group.status)}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
        {group.netBalance !== 0 && (
          <div className={`text-xs mt-1 ${group.netBalance > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {group.netBalance > 0 ? 'Surplus' : 'Shortage'}: {formatRate(Math.abs(group.netBalance))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 space-y-1.5">
        {group.items.map((entry) => {
          const indicator = entryIndicator(entry);
          return (
            <div key={entry.itemId} className="flex items-center text-sm">
              <span className={`w-2 h-2 rounded-full ${indicator.color} shrink-0`} title={indicator.label} />
              <span className="ml-2 truncate text-gray-300 min-w-0">{entry.itemName}</span>
              <div className="ml-auto flex items-center gap-3 shrink-0 text-xs font-mono">
                <span className="text-green-400">+{formatRate(entry.production)}</span>
                <span className="text-red-400">-{formatRate(entry.consumption)}</span>
                {entry.surplus !== 0 && (
                  <span className={entry.surplus > 0 ? 'text-yellow-400' : 'text-orange-400'}>
                    {entry.surplus > 0 ? '+' : ''}{formatRate(entry.surplus)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FluidBalancePanel({ fluidBalance }: FluidBalancePanelProps) {
  const { groups, deadEnds, overflows } = fluidBalance;
  const hasIssues = deadEnds.length > 0 || overflows.length > 0;

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] border-gray-700">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-base font-semibold text-gray-200">Fluid Balance</h2>
        <div className="text-xs text-gray-500 mt-0.5">
          {groups.length > 0 ? `${groups.length} group${groups.length !== 1 ? 's' : ''}` : 'No fluid buildings'}
        </div>
      </div>

      {(deadEnds.length > 0 || overflows.length > 0) && (
        <div className="px-4 py-2 border-b border-gray-700 space-y-1.5">
          {deadEnds.length > 0 && (
            <div className="px-3 py-2 bg-purple-900/30 border border-purple-500/40 rounded">
              <div className="text-xs font-semibold text-purple-300 mb-1">
                Dead-ends ({deadEnds.length})
              </div>
              {deadEnds.map((d) => (
                <div key={d.itemId} className="text-xs text-purple-200/80">
                  {d.itemName}: {formatRate(d.production)} produced, no consumer
                </div>
              ))}
            </div>
          )}
          {overflows.length > 0 && (
            <div className="px-3 py-2 bg-yellow-900/30 border border-yellow-500/40 rounded">
              <div className="text-xs font-semibold text-yellow-300 mb-1">
                Overflow ({overflows.length})
              </div>
              {overflows.map((o) => (
                <div key={o.itemId} className="text-xs text-yellow-200/80">
                  {o.itemName}: {formatRate(o.surplus)} excess
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasIssues && groups.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-gray-600 text-sm italic text-center">
            Add buildings with fluid recipes to see balance
          </p>
        </div>
      )}

      {!hasIssues && groups.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700">
          <div className="px-3 py-1.5 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-300 text-center">
            All fluid flows balanced
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <FluidGroup key={group.groupId} group={group} />
        ))}
      </div>

      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
        {fluidBalance.allFluids.length} fluid item{fluidBalance.allFluids.length !== 1 ? 's' : ''} tracked
      </div>
    </div>
  );
}