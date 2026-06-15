"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ExpenseTrendChartProps {
  data: { date: string; amount: number }[];
  currency: string;
}

export function ExpenseTrendChart({ data, currency }: ExpenseTrendChartProps) {
  return (
    <div className="bg-surface-dark rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-dark-elevated">
        <span className="text-[14px] font-medium text-on-dark">Expense Trend</span>
        <Badge variant="coral">Last 30 Days</Badge>
      </div>
      <div className="flex-1 min-h-[250px] px-6 py-4">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[14px] text-on-dark-soft">
            No expense data available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--on-dark-soft)" }}
                dy={8}
                interval={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--on-dark-soft)" }}
                tickFormatter={(value) =>
                  `${value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}`
                }
              />
              <Tooltip
                cursor={{ fill: "var(--surface-dark-elevated)", opacity: 0.6 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg bg-surface-dark-elevated px-3.5 py-2.5 shadow-dropdown border border-surface-dark-soft">
                        <p className="text-[11px] font-medium text-on-dark-soft">
                          {payload[0].payload.date}
                        </p>
                        <p className="text-[14px] font-medium tabular-nums text-on-dark">
                          {formatCurrency(payload[0].value as number, currency)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="amount"
                fill="var(--primary)"
                opacity={0.85}
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
