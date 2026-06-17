"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Users,
  BarChart3,
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
import { HelpCircle, X, Plus } from "lucide-react";
import { BalanceExplainability } from "./balance-explainability";
import { AddMemberModal } from "./add-member-modal";
import { AddExpenseModal } from "./add-expense-modal";
import { AddSettlementModal } from "./add-settlement-modal";

interface GroupTabsProps {
  group: any;
  currentUserId: string;
}

type Tab = "expenses" | "members" | "balances" | "settlements";

export function GroupTabs({ group, currentUserId }: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("expenses");
  const [explainingUser, setExplainingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const tabs = [
    {
      id: "expenses" as Tab,
      label: "Expenses",
      icon: Receipt,
      count: group.expenses.length,
    },
    {
      id: "members" as Tab,
      label: "Members",
      icon: Users,
      count: group.memberships.length,
    },
    { id: "balances" as Tab, label: "Balances", icon: BarChart3 },
    {
      id: "settlements" as Tab,
      label: "Settlements",
      icon: ArrowRightLeft,
      count: group.settlements.length,
    },
  ];

  return (
    <div>
      {/* Tab Navigation — DESIGN.md category-tab style */}
      <div className="flex gap-1.5 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-md text-nav-link transition-colors-fast",
              activeTab === tab.id
                ? "bg-surface-card text-ink"
                : "text-muted hover:text-ink hover:bg-surface-soft"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[12px] text-muted-soft ml-0.5 tabular-nums">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "expenses" && (
        <ExpenseList
          expenses={group.expenses}
          currency={group.defaultCurrency}
          groupId={group.id}
          memberships={group.memberships}
        />
      )}
      {activeTab === "members" && (
        <MemberList 
          memberships={group.memberships} 
          groupId={group.id} 
        />
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
        <SettlementList
          settlements={group.settlements}
          currency={group.defaultCurrency}
          groupId={group.id}
          memberships={group.memberships}
        />
      )}

      {/* Explainability Modal */}
      {explainingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-hairline bg-canvas flex flex-col shadow-dropdown">
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-ink" />
                <h2 className="text-title-sm">Derivation Proof</h2>
              </div>
              <button
                onClick={() => setExplainingUser(null)}
                className="p-1.5 rounded-md hover:bg-surface-soft text-muted hover:text-ink transition-colors-fast"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
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

function ExpenseList({
  expenses,
  currency,
  groupId,
  memberships,
}: {
  expenses: any[];
  currency: string;
  groupId: string;
  memberships: any[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeMembers = memberships
    .filter((m: any) => !m.leftAt)
    .map((m: any) => ({ id: m.user.id, name: m.user.name }));

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center">
        <Receipt className="w-6 h-6 text-muted mx-auto mb-3" />
        <p className="text-title-sm mb-1">No expenses yet</p>
        <p className="text-body-sm text-muted mb-4">
          Import a CSV or add expenses manually.
        </p>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
        <AddExpenseModal groupId={groupId} currency={currency} members={activeMembers} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>
      <div className="border border-hairline rounded-lg divide-y divide-hairline-soft">
      {expenses.map((expense: any) => (
        <div
          key={expense.id}
          className={cn(
            "cursor-pointer transition-colors-fast hover:bg-surface-soft"
          )}
          onClick={() =>
            setExpanded(expanded === expense.id ? null : expense.id)
          }
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-surface-card flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-muted" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-[14px] text-ink truncate">
                  {expense.description}
                </h4>
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(expense.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-hairline">·</span>
                  <span>{expense.paidBy.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="font-medium text-[14px] tabular-nums text-ink">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
                <Badge variant="default" className="text-[11px]">
                  {expense.splitType.toLowerCase()}
                </Badge>
              </div>
              {expanded === expense.id ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </div>
          </div>

          {/* Expanded split detail */}
          {expanded === expense.id && (
            <div className="mx-5 mb-4 pt-3 border-t border-hairline-soft">
              <p className="text-caption-upper mb-3">
                Split Breakdown
              </p>
              <div className="space-y-1.5">
                {expense.splits.map((split: any) => (
                  <div
                    key={split.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-soft"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-[10px] font-medium text-canvas">
                        {split.user.name?.[0] || "?"}
                      </div>
                      <span className="text-[13px] text-ink">{split.user.name}</span>
                      {split.userId === expense.paidById && (
                        <Badge
                          variant="success"
                          className="text-[10px] py-0 px-1.5"
                        >
                          paid
                        </Badge>
                      )}
                    </div>
                    <span className="text-[13px] font-medium tabular-nums text-ink">
                      {formatCurrency(split.amount, expense.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-hairline-soft">
                <span className="text-[12px] text-muted">Total</span>
                <span className="text-[13px] font-medium tabular-nums text-ink">
                  {formatCurrency(expense.amount, expense.currency)}
                  <span className="text-success text-[11px] ml-1.5">
                    ✓ balanced
                  </span>
                </span>
              </div>
              {expense.notes && (
                <p className="text-[12px] text-muted mt-2">
                  📝 {expense.notes}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
      <AddExpenseModal groupId={groupId} currency={currency} members={activeMembers} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// ── Members Tab ──

function MemberList({ memberships, groupId }: { memberships: any[], groupId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>
      <div className="border border-hairline rounded-lg divide-y divide-hairline-soft">
      {memberships.map((m: any) => {
        const isActive = !m.leftAt;
        return (
          <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium text-canvas shrink-0",
                isActive ? "bg-ink" : "bg-muted-soft"
              )}
            >
              {m.user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[14px] text-ink">{m.user.name}</span>
                {m.user.isGuest && (
                  <Badge variant="warning" className="text-[10px]">
                    Guest
                  </Badge>
                )}
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isActive ? "bg-success" : "bg-muted-soft"
                  )}
                />
              </div>
              <p className="text-[12px] text-muted">
                Joined{" "}
                {new Date(m.joinedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {m.leftAt && (
                  <>
                    {" "}
                    · Left{" "}
                    {new Date(m.leftAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
        );
      })}
      </div>
      <AddMemberModal groupId={groupId} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
    settledOutMap.set(
      s.fromUser.id,
      (settledOutMap.get(s.fromUser.id) ?? 0) + s.amount
    );
    settledInMap.set(
      s.toUser.id,
      (settledInMap.get(s.toUser.id) ?? 0) + s.amount
    );
  }

  const balances = Array.from(nameMap.entries())
    .map(([userId, name]) => {
      const paid = paidMap.get(userId) ?? 0;
      const owed = owedMap.get(userId) ?? 0;
      const out = settledOutMap.get(userId) ?? 0;
      const inp = settledInMap.get(userId) ?? 0;
      const net = paid - owed - out + inp;
      return { userId, name, paid, owed, settledOut: out, settledIn: inp, net };
    })
    .sort((a, b) => b.net - a.net);

  return (
    <div className="space-y-4">
      {/* Formula hint */}
      <p className="text-[12px] text-muted text-mono">
        Net = Paid − Owed − Settled Out + Settled In
      </p>

      {/* Balance rows */}
      <div className="border border-hairline rounded-lg divide-y divide-hairline-soft">
        {balances.map((b) => {
          const isPositive = b.net > 0;
          const isZero = b.net === 0;
          const isCurrent = b.userId === currentUserId;

          return (
            <div
              key={b.userId}
              className={cn(
                "px-5 py-4",
                isCurrent && "bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium text-canvas shrink-0",
                      isPositive
                        ? "bg-ink"
                        : isZero
                        ? "bg-muted-soft"
                        : "bg-error"
                    )}
                  >
                    {b.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-[14px] text-ink">
                      {b.name}
                      {isCurrent && (
                        <span className="text-primary text-[12px] ml-1.5">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-muted tabular-nums">
                      Paid {formatCurrency(b.paid, currency)} · Owes{" "}
                      {formatCurrency(b.owed, currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-display-sm tabular-nums",
                        isPositive
                          ? "text-success"
                          : isZero
                          ? "text-muted"
                          : "text-error"
                      )}
                      style={{ fontSize: '20px' }}
                    >
                      {isPositive ? "+" : ""}
                      {formatCurrency(b.net, currency)}
                    </p>
                    <p className="text-[11px] text-muted-soft">
                      {isPositive ? "is owed" : isZero ? "settled" : "owes"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] text-muted hover:text-ink h-8 px-3"
                    onClick={() => onExplain(b.userId, b.name)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Explain
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Settlements Tab ──

function SettlementList({
  settlements,
  currency,
  groupId,
  memberships,
}: {
  settlements: any[];
  currency: string;
  groupId: string;
  memberships: any[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeMembers = memberships
    .filter((m: any) => !m.leftAt)
    .map((m: any) => ({ id: m.user.id, name: m.user.name }));

  if (settlements.length === 0) {
    return (
      <div className="py-16 text-center">
        <ArrowRightLeft className="w-6 h-6 text-muted mx-auto mb-3" />
        <p className="text-title-sm mb-1">No settlements yet</p>
        <p className="text-body-sm text-muted mb-4">
          Settlements will appear after import or manual entry.
        </p>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Record Payment
        </Button>
        <AddSettlementModal groupId={groupId} currency={currency} members={activeMembers} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> Record Payment
        </Button>
      </div>
      <div className="border border-hairline rounded-lg divide-y divide-hairline-soft">
      {settlements.map((s: any) => (
        <div key={s.id} className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-accent-amber/15 text-accent-amber flex items-center justify-center text-[11px] font-medium">
                {s.fromUser.name?.[0] || "?"}
              </div>
              <ArrowRightLeft className="w-3.5 h-3.5 text-muted" />
              <div className="w-7 h-7 rounded-full bg-success/15 text-success flex items-center justify-center text-[11px] font-medium">
                {s.toUser.name?.[0] || "?"}
              </div>
            </div>
            <div>
              <p className="font-medium text-[13px] text-ink">
                {s.fromUser.name} → {s.toUser.name}
              </p>
              <p className="text-[12px] text-muted">
                {new Date(s.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-[14px] tabular-nums text-ink">
              {formatCurrency(s.amount, s.currency)}
            </p>
            {s.notes && (
              <p className="text-[12px] text-muted">{s.notes}</p>
            )}
          </div>
        </div>
      ))}
      </div>
      <AddSettlementModal groupId={groupId} currency={currency} members={activeMembers} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
