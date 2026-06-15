"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SystemStatusProps {
  importStats: {
    total: number;
    valid: number;
    error: number;
    skipped: number;
  };
  anomalies: {
    id: string;
    description: string;
    severity: string;
    groupId: string;
  }[];
}

export function SystemStatus({ importStats, anomalies }: SystemStatusProps) {
  const successRate =
    importStats.total > 0
      ? Math.round((importStats.valid / importStats.total) * 100)
      : 100;

  return (
    <div className="bg-canvas border border-hairline rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b border-hairline shrink-0">
        <span className="text-title-sm text-ink">System Status</span>
      </div>

      {/* Import Health */}
      <div className="px-6 py-4 border-b border-hairline-soft">
        <p className="text-caption-upper mb-3">
          Import Health
        </p>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted">Success Rate</span>
          <span
            className={cn(
              "font-medium tabular-nums",
              successRate >= 95
                ? "text-success"
                : successRate >= 80
                ? "text-accent-amber"
                : "text-error"
            )}
          >
            {successRate}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px] text-muted-soft mt-1.5">
          <span>{importStats.total} rows processed</span>
          <span>{importStats.error} errors</span>
        </div>
      </div>

      {/* Anomalies */}
      <div className="px-6 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-caption-upper">
            Pending Anomalies
          </p>
          <Badge variant="secondary" className="text-[11px] px-2">
            {anomalies.length}
          </Badge>
        </div>

        {anomalies.length === 0 ? (
          <div className="flex items-center gap-2 text-[13px] text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All imports healthy</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {anomalies.map((anomaly) => (
              <Link
                key={anomaly.id}
                href={`/dashboard/groups/${anomaly.groupId}`}
                className="flex items-start gap-2.5 py-2 rounded-md hover:bg-surface-soft transition-colors-fast -mx-1.5 px-1.5"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    anomaly.severity === "CRITICAL"
                      ? "bg-error"
                      : "bg-accent-amber"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium truncate text-ink">
                    {anomaly.description}
                  </p>
                  <p className="text-[11px] text-muted-soft">
                    Review required
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
