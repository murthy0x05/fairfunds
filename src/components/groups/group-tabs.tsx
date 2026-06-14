"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Receipt,
  Users,
  BarChart3,
  ArrowRightLeft,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
} from "lucide-react";
import { BalanceExplainability } from "./balance-explainability";

interface GroupTabsProps {
  group: any;
  currentUserId: string;
}

type Tab = "expenses" | "members" | "balances" | "settlements";

export function GroupTabs({ group, currentUserId }: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("expenses");
  const [explainingUser, setExplainingUser] = useState<{ id: string; name: string } | null>(null);

  const tabs = [
    { id: "expenses" as Tab, label: "Expenses", count: group.expenses.length },
    { id: "members" as Tab, label: "Members", count: group.memberships.length },
    { id: "balances" as Tab, label: "Balances" },
    { id: "settlements" as Tab, label: "Settlements", count: group.settlements.length },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-[var(--color-tertiary)]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "expenses" && (
        <ExpenseList expenses={group.expenses} currency={group.defaultCurrency} />
      )}
      {activeTab === "members" && (
        <MemberList memberships={group.memberships} />
      )}
      {activeTab === "balances" && (
        <BalanceSummary
          expenses={group.expenses}
          settlements={group.settlements}
          memberships={group.memberships}
          currency={group.defaultCurrency}
          currentUserId={currentUserId}
          onExplain={(id, name) => setExplainingUser({ id, name })}
        />
      )}
      {activeTab === "settlements" && (
        <SettlementList settlements={group.settlements} currency={group.defaultCurrency} />
      )}

      {/* Explainability Modal */}
      {explainingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold">Balance derivation — {explainingUser.name}</h2>
              <button
                onClick={() => setExplainingUser(null)}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <BalanceExplainability
                groupId={group.id}
                userId={explainingUser.id}
                userName={explainingUser.name}
                onClose={() => setExplainingUser(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expenses Tab ──

function ExpenseList({ expenses, currency }: { expenses: any[]; currency: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No expenses yet. Import a CSV or add expenses manually.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {expenses.map((expense: any) => (
        <div
          key={expense.id}
          className="rounded-lg border border-border hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
          onClick={() => setExpanded(expanded === expense.id ? null : expense.id)}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{expense.description}</span>
                <Badge variant="secondary" className="text-xs">
                  {expense.splitType.toLowerCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-tertiary)]">
                <span>
                  {new Date(expense.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span>
                  paid by {expense.paidBy.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className="font-medium text-sm tabular-nums">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
              {expanded === expense.id ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--color-tertiary)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--color-tertiary)]" />
              )}
            </div>
          </div>

          {/* Expanded split detail */}
          {expanded === expense.id && (
            <div className="px-4 pb-3 pt-0 border-t border-border mx-4 mb-3">
              <p className="text-xs text-[var(--color-tertiary)] uppercase tracking-wider mt-3 mb-2 font-medium">
                Split breakdown
              </p>
              <div className="space-y-1.5">
                {expense.splits.map((split: any) => (
                  <div
                    key={split.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {(split.user.name ?? "?")[0]}
                      </div>
                      <span>{split.user.name}</span>
                      {split.userId === expense.paidById && (
                        <span className="text-xs text-primary">payer</span>
                      )}
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(split.amount, expense.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-border text-xs text-[var(--color-tertiary)]">
                <span>Total</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(expense.amount, expense.currency)}
                </span>
              </div>
              {expense.notes && (
                <p className="text-xs text-[var(--color-tertiary)] mt-2">
                  Note: {expense.notes}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Members Tab ──

function MemberList({ memberships }: { memberships: any[] }) {
  return (
    <div className="space-y-1">
      {memberships.map((m: any) => {
        const isActive = !m.leftAt;
        return (
          <div
            key={m.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border"
          >
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
              {(m.user.name ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.user.name}</span>
                {m.user.isGuest && <Badge variant="warning">guest</Badge>}
                <Badge variant={isActive ? "success" : "secondary"}>
                  {isActive ? "active" : "left"}
                </Badge>
              </div>
              <p className="text-xs text-[var(--color-tertiary)] mt-0.5">
                Joined {new Date(m.joinedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {m.leftAt && (
                  <> · Left {new Date(m.leftAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}</>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Balances Tab ──

function BalanceSummary({
  expenses,
  settlements,
  memberships,
  currency,
  currentUserId,
  onExplain,
}: {
  expenses: any[];
  settlements: any[];
  memberships: any[];
  currency: string;
  currentUserId: string;
  onExplain: (id: string, name: string) => void;
}) {
  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();
  const settledOutMap = new Map<string, number>();
  const settledInMap = new Map<string, number>();
  const nameMap = new Map<string, string>();

  for (const m of memberships) {
    nameMap.set(m.userId, m.user.name);
  }

  for (const e of expenses) {
    paidMap.set(e.paidById, (paidMap.get(e.paidById) ?? 0) + e.amount);
    for (const s of e.splits) {
      owedMap.set(s.userId, (owedMap.get(s.userId) ?? 0) + s.amount);
    }
  }

  for (const s of settlements) {
    settledOutMap.set(s.fromUser.id, (settledOutMap.get(s.fromUser.id) ?? 0) + s.amount);
    settledInMap.set(s.toUser.id, (settledInMap.get(s.toUser.id) ?? 0) + s.amount);
  }

  const balances = Array.from(nameMap.entries()).map(([userId, name]) => {
    const paid = paidMap.get(userId) ?? 0;
    const owed = owedMap.get(userId) ?? 0;
    const out = settledOutMap.get(userId) ?? 0;
    const inp = settledInMap.get(userId) ?? 0;
    const net = paid - owed - out + inp;
    return { userId, name, paid, owed, settledOut: out, settledIn: inp, net };
  }).sort((a, b) => b.net - a.net);

  return (
    <div className="space-y-1">
      {/* Formula note */}
      <p className="text-xs text-[var(--color-tertiary)] mb-3 font-mono">
        net = paid − owed − settled_out + settled_in
      </p>

      {balances.map((b) => {
        const isPositive = b.net > 0;
        const isZero = b.net === 0;
        const isCurrent = b.userId === currentUserId;

        return (
          <div
            key={b.userId}
            className={cn(
              "flex items-center justify-between px-4 py-3.5 rounded-lg border transition-colors",
              isCurrent ? "border-primary/30 bg-primary/[0.03]" : "border-border"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                {(b.name ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {b.name}
                  {isCurrent && <span className="text-[var(--color-tertiary)] text-xs ml-1.5">(you)</span>}
                </p>
                <p className="text-xs text-[var(--color-tertiary)]">
                  paid {formatCurrency(b.paid, currency)} · owes {formatCurrency(b.owed, currency)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={cn(
                  "text-sm font-semibold tabular-nums",
                  isPositive ? "text-emerald-400" : isZero ? "text-muted-foreground" : "text-red-400"
                )}>
                  {isPositive ? "+" : ""}{formatCurrency(b.net, currency)}
                </p>
                <p className="text-xs text-[var(--color-tertiary)]">
                  {isPositive ? "is owed" : isZero ? "settled" : "owes"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onExplain(b.userId, b.name)}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Settlements Tab ──

function SettlementList({ settlements, currency }: { settlements: any[]; currency: string }) {
  if (settlements.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No settlements yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {settlements.map((s: any) => (
        <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              {(s.fromUser.name ?? "?")[0]}
            </div>
            <span className="text-xs text-[var(--color-tertiary)]">→</span>
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              {(s.toUser.name ?? "?")[0]}
            </div>
            <div className="ml-1">
              <p className="text-sm font-medium">
                {s.fromUser.name} → {s.toUser.name}
              </p>
              <p className="text-xs text-[var(--color-tertiary)]">
                {new Date(s.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
                {s.notes && <> · {s.notes}</>}
              </p>
            </div>
          </div>
          <span className="font-medium text-sm tabular-nums">{formatCurrency(s.amount, s.currency)}</span>
        </div>
      ))}
    </div>
  );
}
