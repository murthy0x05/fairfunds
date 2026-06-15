"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Receipt, ArrowRightLeft, Upload } from "lucide-react";

export type ActivityItem = {
  id: string;
  type: "expense" | "settlement" | "import";
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  date: Date;
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

const typeIcons = {
  expense: Receipt,
  settlement: ArrowRightLeft,
  import: Upload,
};

const typeColors = {
  expense: "text-ink",
  settlement: "text-success",
  import: "text-accent-teal",
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-canvas border border-hairline rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b border-hairline shrink-0">
        <span className="text-title-sm text-ink">Recent Activity</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-body-sm text-muted">
            No recent activity.
          </div>
        ) : (
          <div className="divide-y divide-hairline-soft">
            {activities.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-soft transition-colors-fast"
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${typeColors[item.type]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">
                      {item.title}
                    </p>
                    <p className="text-[12px] text-muted truncate">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.amount !== undefined && item.currency && (
                      <p className="text-[13px] font-medium tabular-nums text-ink">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-soft">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
