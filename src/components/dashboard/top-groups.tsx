"use client";

import { formatCurrency } from "@/lib/utils/currency";

interface TopGroupsProps {
  groups: { name: string; amount: number; percentage: number; currency: string }[];
}

export function TopGroups({ groups }: TopGroupsProps) {
  return (
    <div className="bg-canvas border border-hairline rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b border-hairline shrink-0">
        <span className="text-title-sm text-ink">Spending by Group</span>
      </div>
      <div className="px-6 py-5 space-y-4 flex-1">
        {groups.length === 0 ? (
          <div className="text-center text-body-sm text-muted">
            No spending data available.
          </div>
        ) : (
          groups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium truncate pr-3 text-ink">{group.name}</span>
                <span className="font-medium tabular-nums shrink-0 text-ink">
                  {formatCurrency(group.amount, group.currency)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/30 rounded-full transition-all duration-300"
                  style={{ width: `${group.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
