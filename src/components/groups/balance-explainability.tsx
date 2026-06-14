"use client";

import { useEffect, useState } from "react";
import { getBalanceExplanation } from "@/actions/balances";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Receipt,
  ArrowRightLeft,
  Coins,
  User,
  Calendar,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  History,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { type WaterfallDataPoint } from "@/lib/services/explainability.service";

interface BalanceExplainabilityProps {
  groupId: string;
  userId: string;
  userName: string;
  onClose: () => void;
}

export function BalanceExplainability({
  groupId,
  userId,
  userName,
  onClose,
}: BalanceExplainabilityProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAuditId, setShowAuditId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const explanation = await getBalanceExplanation(groupId, userId);
        setData(explanation);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, userId]);

  const fetchAuditLogs = async (expenseId: string) => {
    if (showAuditId === expenseId) {
      setShowAuditId(null);
      return;
    }
    try {
      setLoadingAudit(true);
      setShowAuditId(expenseId);
      // Wait, let's load audit logs via dynamic import or direct db query if we expose an action.
      // Let's import the server action dynamically or create a local action.
      const { getExpenseHistory } = await import("@/actions/expenses");
      const logs = await getExpenseHistory(expenseId);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          Generating mathematical balance proof for {userName}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-lg font-semibold">Failed to load explanation</h3>
        <p className="text-muted-foreground">{error || "Unknown error"}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
        >
          Close
        </button>
      </div>
    );
  }

  const netPositive = data.summary.netBalance > 0;
  const netZero = data.summary.netBalance === 0;

  return (
    <div className="space-y-6">
      {/* Layer 0: Header & Net Balance Formula */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Balance Derivation Proof
          </h2>
          <p className="text-muted-foreground text-sm">
            For member <span className="font-semibold text-foreground">{data.userName}</span> in group &ldquo;{data.groupName}&rdquo;
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Proof generated at {new Date(data.generatedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Membership Timeline Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
        <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-indigo-200 text-sm">Temporal Membership Enforcement</h4>
          <p className="text-xs text-indigo-300/80 mt-1 leading-relaxed">
            {data.userName} is active from{" "}
            <span className="font-semibold text-indigo-200">
              {new Date(data.membershipContext.activeFrom).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {data.membershipContext.activeTo ? (
              <>
                {" "}
                to{" "}
                <span className="font-semibold text-indigo-200">
                  {new Date(data.membershipContext.activeTo).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            ) : (
              " onwards"
            )}{" "}
            ({data.membershipContext.totalActiveDays} days). Expenses outside this window are automatically excluded from their balance calculations.
          </p>
        </div>
      </div>

      {/* Layer 0: Summary Cards & Interactive Formula */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total Paid",
            value: data.summary.totalPaid,
            icon: TrendingUp,
            color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
            desc: "Expenses paid by user",
          },
          {
            label: "Total Owed",
            value: data.summary.totalOwed,
            icon: Receipt,
            color: "text-red-400 border-red-500/10 bg-red-500/5",
            desc: "User's calculated shares",
          },
          {
            label: "Settled Out",
            value: data.summary.totalSettledOut,
            icon: ArrowRightLeft,
            color: "text-amber-400 border-amber-500/10 bg-amber-500/5",
            desc: "Paid to other members",
          },
          {
            label: "Settled In",
            value: data.summary.totalSettledIn,
            icon: Coins,
            color: "text-blue-400 border-blue-500/10 bg-blue-500/5",
            desc: "Received from others",
          },
          {
            label: "Net Balance",
            value: data.summary.netBalance,
            icon: User,
            color: netZero
              ? "text-muted-foreground border-border bg-secondary/10"
              : netPositive
              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 glow-success"
              : "text-red-400 border-red-500/20 bg-red-500/10 glow-destructive",
            desc: netZero ? "Fully settled up" : netPositive ? "Group owes user" : "User owes group",
            isNet: true,
          },
        ].map((item, i) => (
          <Card key={i} className={`border ${item.color} relative overflow-hidden`}>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <item.icon className="w-4 h-4 opacity-60" />
              </div>
              <p className="text-xl font-bold mt-2">
                {item.value < 0 ? "-" : ""}
                {formatCurrency(Math.abs(item.value), data.displayCurrency)}
              </p>
              <p className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-1">
                {item.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Layer 0: Formula Display */}
      <Card className="bg-secondary/20 border-border">
        <CardContent className="p-4 pt-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold">Mathematical Verification</h4>
            <p className="text-xs text-muted-foreground font-mono">
              Net Balance = Paid − Owed − Settled Out + Settled In
            </p>
          </div>
          <div className="font-mono text-sm font-semibold flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-emerald-400">
              {formatCurrency(data.summary.totalPaid, data.displayCurrency)}
            </span>
            <span className="text-muted-foreground">−</span>
            <span className="text-red-400">
              {formatCurrency(data.summary.totalOwed, data.displayCurrency)}
            </span>
            <span className="text-muted-foreground">−</span>
            <span className="text-amber-400">
              {formatCurrency(data.summary.totalSettledOut, data.displayCurrency)}
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="text-blue-400">
              {formatCurrency(data.summary.totalSettledIn, data.displayCurrency)}
            </span>
            <span className="text-muted-foreground">=</span>
            <span
              className={
                netZero ? "text-muted-foreground" : netPositive ? "text-emerald-400" : "text-red-400"
              }
            >
              {formatCurrency(data.summary.netBalance, data.displayCurrency)}
            </span>
            <Badge variant="success" className="ml-2 py-0 h-5">Verified ✓</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Layer 1 & 2: Chronological Waterfall Trail */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Chronological Waterfall Trail</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Click any transaction to audit the split math, exchange rates, and full change history.
        </p>

        <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-border/60">
          {data.waterfall.map((wp: WaterfallDataPoint) => {
            const isNetNode = wp.expenseId === "net";
            if (wp.type === "NET") return null; // We render summary separately

            const isCredit = wp.amount > 0;
            const isSettlement = wp.type === "SETTLEMENT";
            const isExpanded = expandedId === wp.expenseId;

            // Find matching full explanation (if it is an expense or settlement)
            const expenseExpl = data.expenseTrail.find((e: any) => e.expenseId === wp.expenseId);
            const settlementExpl = data.settlements.find((s: any) => s.settlementId === wp.expenseId);

            return (
              <div key={wp.expenseId} className="relative pl-9 group">
                {/* Timeline node icon */}
                <div
                  className={`absolute left-2.5 top-3.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 bg-background transition-transform group-hover:scale-110 ${
                    isSettlement
                      ? "border-amber-400 ring-4 ring-amber-500/10"
                      : isCredit
                      ? "border-emerald-500 ring-4 ring-emerald-500/10"
                      : "border-red-500 ring-4 ring-red-500/10"
                  }`}
                />

                <Card
                  className={`cursor-pointer hover:border-muted-foreground/30 transition-all ${
                    isExpanded ? "border-primary/50 glow-primary" : "border-border/80"
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : wp.expenseId)}
                >
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(wp.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground/60">•</span>
                          <span className="font-semibold text-sm">{wp.label}</span>
                          {wp.isHighlighted && (
                            <Badge variant="warning" className="text-[9px] py-0 px-1">
                              Largest Impact
                            </Badge>
                          )}
                          {wp.currency !== data.displayCurrency && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-indigo-500/10 text-indigo-400">
                              converted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isSettlement
                            ? wp.amount < 0
                              ? `You paid out as settlement`
                              : `You received as settlement`
                            : isCredit
                            ? `You paid the group (Credit: ${formatCurrency(wp.displayAmount, data.displayCurrency)})`
                            : `Your share (Debit: ${formatCurrency(wp.displayAmount, data.displayCurrency)})`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              isSettlement
                                ? wp.amount < 0
                                  ? "text-amber-400"
                                  : "text-blue-400"
                                : isCredit
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {wp.amount > 0 ? "+" : ""}
                            {formatCurrency(wp.amount, data.displayCurrency)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Bal: {formatCurrency(wp.runningBalance, data.displayCurrency)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground/60" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
                        )}
                      </div>
                    </div>

                    {/* Layer 3: Expanded Mathematical Breakdown */}
                    {isExpanded && (
                      <div
                        className="mt-4 pt-4 border-t border-border/60 space-y-4 animate-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Currency conversion proof card */}
                        {expenseExpl?.currencyConversion && (
                          <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                            <h5 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5" /> Exchange Rate Derivation
                            </h5>
                            <p className="text-xs text-indigo-200/80">
                              {expenseExpl.currencyConversion.formulaText}
                            </p>
                            <p className="text-[10px] text-indigo-400/80">
                              Source: Frankfurter API / ECB rates on{" "}
                              {new Date(expenseExpl.currencyConversion.rateDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {settlementExpl?.currencyConversion && (
                          <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                            <h5 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5" /> Exchange Rate Derivation
                            </h5>
                            <p className="text-xs text-indigo-200/80">
                              {settlementExpl.currencyConversion.formulaText}
                            </p>
                            <p className="text-[10px] text-indigo-400/80">
                              Source: Frankfurter API / ECB rates on{" "}
                              {new Date(settlementExpl.currencyConversion.rateDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {/* Split participants table & details */}
                        {expenseExpl && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-semibold uppercase tracking-wider">
                                Split Formula: {expenseExpl.splitExplanation.splitType}
                              </span>
                              <span className="font-mono text-foreground">
                                {expenseExpl.splitExplanation.formulaText}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {expenseExpl.splitExplanation.participants.map((p: any) => (
                                <div
                                  key={p.userId}
                                  className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs ${
                                    p.isCurrentUser
                                      ? "bg-primary/10 border border-primary/20"
                                      : "bg-secondary/40"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">
                                      {p.name[0]}
                                    </div>
                                    <span className="font-medium">
                                      {p.name} {p.isCurrentUser && "(You)"}
                                    </span>
                                    {p.isPayer && (
                                      <Badge variant="success" className="text-[8px] py-0 px-1">
                                        paid
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <span className="text-muted-foreground text-[10px]">
                                      ({p.shareInput})
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(p.shareAmount, data.displayCurrency)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Verification status block */}
                            <div className="flex flex-col sm:flex-row items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/25 text-xs text-emerald-300">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                Share Validation: sum of shares matches total amount
                              </span>
                              <span className="font-mono font-bold mt-1 sm:mt-0">
                                {formatCurrency(expenseExpl.splitExplanation.verification.sumOfShares, data.displayCurrency)} / {formatCurrency(expenseExpl.displayAmount, data.displayCurrency)}
                              </span>
                            </div>

                            {/* Rounding Remainder details */}
                            {expenseExpl.splitExplanation.verification.remainder !== 0 && (
                              <p className="text-[10px] text-amber-300 italic">
                                ℹ️ A rounding remainder of {expenseExpl.splitExplanation.verification.remainder} paise was assigned to {expenseExpl.splitExplanation.verification.remainderAssignedTo} to maintain strict financial balancing.
                              </p>
                            )}

                            {/* CSV provenance */}
                            {expenseExpl.importSource && (
                              <div className="text-[10px] text-muted-foreground bg-secondary/20 p-2 rounded border border-border flex items-center justify-between">
                                <span>
                                  CSV Source: Row {expenseExpl.importSource.sourceRowNum} in imported file.
                                </span>
                                <button
                                  onClick={() => fetchAuditLogs(expenseExpl.expenseId)}
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <History className="w-3 h-3" />
                                  {showAuditId === expenseExpl.expenseId ? "Hide History" : "View Audit Trail"}
                                </button>
                              </div>
                            )}

                            {/* Layer 4: Audit logs details */}
                            {showAuditId === expenseExpl.expenseId && (
                              <div className="p-3 bg-secondary/30 rounded border border-border mt-2 space-y-2">
                                <h6 className="text-xs font-semibold text-foreground flex items-center gap-1">
                                  <History className="w-3.5 h-3.5" /> Immutable Audit Trail
                                </h6>
                                {loadingAudit ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                                ) : auditLogs.length === 0 ? (
                                  <p className="text-[10px] text-muted-foreground">No history logged.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {auditLogs.map((log: any) => (
                                      <div key={log.id} className="text-[10px] border-l-2 border-primary/30 pl-2 py-0.5 space-y-0.5">
                                        <div className="flex items-center justify-between text-muted-foreground">
                                          <span className="font-semibold text-foreground">{log.action}</span>
                                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        {log.user && (
                                          <p className="text-muted-foreground">By: {log.user.name}</p>
                                        )}
                                        {log.changes && (
                                          <div className="mt-1 font-mono text-[9px] text-muted-foreground/90 bg-black/20 p-1.5 rounded max-h-24 overflow-y-auto">
                                            {JSON.stringify(log.changes, null, 2)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {settlementExpl && (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>Settlement Details</span>
                              <span>{settlementExpl.notes || "No notes"}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40">
                              <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>
                                {settlementExpl.direction === "PAID" ? "You paid " : "You received from "}
                                <span className="font-semibold">{settlementExpl.otherUserName}</span>
                                {" — "}
                                <span className="font-bold text-foreground">
                                  {formatCurrency(settlementExpl.amount, data.displayCurrency)}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Close button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm font-semibold transition"
        >
          Close Derivation Proof
        </button>
      </div>
    </div>
  );
}
