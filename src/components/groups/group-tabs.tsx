"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, fromSmallestUnit } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Receipt,
  Users,
  BarChart3,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  User,
  Divide,
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
    { id: "expenses" as Tab, label: "Expenses", icon: Receipt, count: group.expenses.length },
    { id: "members" as Tab, label: "Members", icon: Users, count: group.memberships.length },
    { id: "balances" as Tab, label: "Balances", icon: BarChart3 },
    { id: "settlements" as Tab, label: "Settlements", icon: ArrowRightLeft, count: group.settlements.length },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md",
                activeTab === tab.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col glow-primary">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Derivation Proof</h2>
              </div>
              <button
                onClick={() => setExplainingUser(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Scrollable Content */}
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

function ExpenseList({ expenses, currency }: { expenses: any[]; currency: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-0 text-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No expenses yet</h3>
          <p className="text-muted-foreground">Import a CSV or add expenses manually.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense: any, i: number) => (
        <Card
          key={expense.id}
          className={cn(
            "glass-card-hover cursor-pointer animate-slide-up transition-all",
          )}
          style={{ animationDelay: `${i * 50}ms` }}
          onClick={() => setExpanded(expanded === expense.id ? null : expense.id)}
        >
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-medium">{expense.description}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(expense.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {expense.paidBy.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-semibold text-lg">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    <Divide className="w-3 h-3 mr-1" />
                    {expense.splitType.toLowerCase()}
                  </Badge>
                </div>
                {expanded === expense.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded split detail */}
            {expanded === expense.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-2 animate-in">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Split Breakdown
                </p>
                {expense.splits.map((split: any) => (
                  <div
                    key={split.id}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {split.user.name[0]}
                      </div>
                      <span className="text-sm">{split.user.name}</span>
                      {split.userId === expense.paidById && (
                        <Badge variant="success" className="text-xs py-0">paid</Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(split.amount, expense.currency)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(expense.amount, expense.currency)}
                    {" "}
                    <span className="text-success text-xs">✓ balanced</span>
                  </span>
                </div>
                {expense.notes && (
                  <p className="text-xs text-muted-foreground italic mt-2">
                    📝 {expense.notes}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Members Tab ──

function MemberList({ memberships }: { memberships: any[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {memberships.map((m: any, i: number) => {
        const isActive = !m.leftAt;
        return (
          <Card
            key={m.id}
            className="animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white",
                  isActive
                    ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                    : "bg-gray-600"
                )}>
                  {m.user.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.user.name}</span>
                    {m.user.isGuest && <Badge variant="warning">Guest</Badge>}
                    <Badge variant={isActive ? "success" : "secondary"}>
                      {isActive ? "Active" : "Left"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
            </CardContent>
          </Card>
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
  // Client-side balance calculation (for INR-only expenses)
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
    <div className="space-y-4">
      {/* Balance Formula */}
      <Card className="border-primary/20 glow-primary">
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
            Balance Formula
          </p>
          <p className="text-sm font-mono text-muted-foreground">
            Net = <span className="text-emerald-400">Total Paid</span> − <span className="text-red-400">Total Owed</span> − <span className="text-amber-400">Settled Out</span> + <span className="text-blue-400">Settled In</span>
          </p>
        </CardContent>
      </Card>

      {/* Per-user balances */}
      {balances.map((b, i) => {
        const isPositive = b.net > 0;
        const isZero = b.net === 0;
        const isCurrent = b.userId === currentUserId;

        return (
          <Card
            key={b.userId}
            className={cn(
              "animate-slide-up",
              isCurrent && "border-primary/30 glow-primary"
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white",
                    isPositive ? "bg-gradient-to-br from-emerald-500 to-teal-500" :
                    isZero ? "bg-gray-600" :
                    "bg-gradient-to-br from-red-500 to-rose-500"
                  )}>
                    {b.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {b.name}
                      {isCurrent && <span className="text-primary text-xs ml-2">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid {formatCurrency(b.paid, currency)} · Owes {formatCurrency(b.owed, currency)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xl font-bold",
                    isPositive ? "text-emerald-400" : isZero ? "text-muted-foreground" : "text-red-400"
                  )}>
                    {isPositive ? "+" : ""}{formatCurrency(b.net, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPositive ? "is owed" : isZero ? "settled" : "owes"}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatCurrency(b.paid, currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Owed</p>
                  <p className="text-sm font-medium text-red-400">
                    {formatCurrency(b.owed, currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Settled ↑</p>
                  <p className="text-sm font-medium text-amber-400">
                    {formatCurrency(b.settledOut, currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Settled ↓</p>
                  <p className="text-sm font-medium text-blue-400">
                    {formatCurrency(b.settledIn, currency)}
                  </p>
                </div>
              </div>

              {/* Explainability Trigger Button */}
              <div className="mt-3 pt-3 border-t border-border/30 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200"
                  onClick={() => onExplain(b.userId, b.name)}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                  {isCurrent
                    ? b.net >= 0
                      ? "Explain my balance"
                      : "Why do I owe this?"
                    : `Explain ${b.name}'s balance`}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Settlements Tab ──

function SettlementList({ settlements, currency }: { settlements: any[]; currency: string }) {
  if (settlements.length === 0) {
    return (
      <Card>
        <CardContent className="pt-0 text-center py-12">
          <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No settlements yet</h3>
          <p className="text-muted-foreground">Settlements will appear after import or manual entry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((s: any, i: number) => (
        <Card key={s.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                    {s.fromUser.name[0]}
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                    {s.toUser.name[0]}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {s.fromUser.name} → {s.toUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(s.amount, s.currency)}</p>
                {s.notes && (
                  <p className="text-xs text-muted-foreground">{s.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
