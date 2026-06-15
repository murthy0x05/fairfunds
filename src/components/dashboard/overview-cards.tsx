"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface OverviewCardsProps {
  monthlySpending: number;
  outstandingBalance: number;
  activeMembers: number;
  pendingAnomalies: number;
  currency: string;
}

export function OverviewCards({
  monthlySpending,
  outstandingBalance,
  activeMembers,
  pendingAnomalies,
  currency,
}: OverviewCardsProps) {
  const cards = [
    {
      label: "Monthly Spending",
      value: formatCurrency(monthlySpending, currency),
      mono: true,
    },
    {
      label: "Outstanding Balance",
      value: `${outstandingBalance > 0 ? "+" : ""}${formatCurrency(outstandingBalance, currency)}`,
      mono: true,
      color:
        outstandingBalance > 0
          ? "text-success"
          : outstandingBalance < 0
          ? "text-error"
          : "text-ink",
    },
    {
      label: "Active Members",
      value: String(activeMembers),
    },
    {
      label: "Pending Anomalies",
      value: String(pendingAnomalies),
      color: pendingAnomalies > 0 ? "text-accent-amber" : "text-ink",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-surface-card rounded-lg p-6">
          <p className="text-caption-upper mb-2">
            {card.label}
          </p>
          <p
            className={cn(
              "text-display-sm",
              card.mono && "tabular-nums",
              card.color || "text-ink"
            )}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
