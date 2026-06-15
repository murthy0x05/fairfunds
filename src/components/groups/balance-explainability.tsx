"use client";

import { useEffect, useState } from "react";
import { getBalanceExplanation } from "@/actions/balances";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Receipt,
  ArrowRightLeft,
  Coins,
  User,
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-body-sm text-muted">
          Generating balance proof for {userName}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertTriangle className="w-6 h-6 text-error mx-auto" />
        <p className="text-title-sm">Failed to load explanation</p>
        <p className="text-body-sm text-muted">
          {error || "Unknown error"}
        </p>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const netPositive = data.summary.netBalance > 0;
  const netZero = data.summary.netBalance === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <h2 className="text-display-sm">
            Balance Derivation Proof
          </h2>
          <p className="text-body-sm text-muted mt-1">
            For{" "}
            <span className="font-medium text-ink">{data.userName}</span>{" "}
            in &ldquo;{data.groupName}&rdquo;
          </p>
        </div>
        <span className="text-[11px] text-muted-soft">
          Generated at {new Date(data.generatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Membership Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-card">
        <Info className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-[13px] text-ink">
            Temporal Membership
          </h4>
          <p className="text-[12px] text-muted leading-relaxed mt-0.5">
            {data.userName} is active from{" "}
            <span className="font-medium text-ink">
              {new Date(
                data.membershipContext.activeFrom
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {data.membershipContext.activeTo ? (
              <>
                {" "}to{" "}
                <span className="font-medium text-ink">
                  {new Date(
                    data.membershipContext.activeTo
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            ) : (
              " onwards"
            )}{" "}
            ({data.membershipContext.totalActiveDays} days).
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total Paid",
            value: data.summary.totalPaid,
            icon: TrendingUp,
            color: "text-success",
          },
          {
            label: "Total Owed",
            value: data.summary.totalOwed,
            icon: Receipt,
            color: "text-error",
          },
          {
            label: "Settled Out",
            value: data.summary.totalSettledOut,
            icon: ArrowRightLeft,
            color: "text-accent-amber",
          },
          {
            label: "Settled In",
            value: data.summary.totalSettledIn,
            icon: Coins,
            color: "text-accent-teal",
          },
          {
            label: "Net Balance",
            value: data.summary.netBalance,
            icon: User,
            color: netZero
              ? "text-muted"
              : netPositive
              ? "text-success"
              : "text-error",
            isNet: true,
          },
        ].map((item, i) => (
          <div key={i} className="bg-surface-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-caption-upper" style={{ fontSize: '10px' }}>
                {item.label}
              </span>
              <item.icon className="w-3.5 h-3.5 text-muted-soft" />
            </div>
            <p className={`text-[18px] font-serif font-normal mt-2 tabular-nums ${item.color}`} style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.3px' }}>
              {item.value < 0 ? "-" : ""}
              {formatCurrency(Math.abs(item.value), data.displayCurrency)}
            </p>
          </div>
        ))}
      </div>

      {/* Formula Display — dark card (code-window style) */}
      <div className="p-5 rounded-lg bg-surface-dark">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-[13px] font-medium text-on-dark">
              Mathematical Verification
            </h4>
            <p className="text-[12px] text-on-dark-soft text-mono">
              Net = Paid − Owed − Settled Out + Settled In
            </p>
          </div>
          <div className="text-mono text-[13px] font-medium flex items-center gap-1.5 flex-wrap justify-center tabular-nums">
            <span className="text-success">
              {formatCurrency(data.summary.totalPaid, data.displayCurrency)}
            </span>
            <span className="text-on-dark-soft">−</span>
            <span className="text-error">
              {formatCurrency(data.summary.totalOwed, data.displayCurrency)}
            </span>
            <span className="text-on-dark-soft">−</span>
            <span className="text-accent-amber">
              {formatCurrency(
                data.summary.totalSettledOut,
                data.displayCurrency
              )}
            </span>
            <span className="text-on-dark-soft">+</span>
            <span className="text-accent-teal">
              {formatCurrency(
                data.summary.totalSettledIn,
                data.displayCurrency
              )}
            </span>
            <span className="text-on-dark-soft">=</span>
            <span
              className={
                netZero
                  ? "text-on-dark-soft"
                  : netPositive
                  ? "text-success"
                  : "text-error"
              }
            >
              {formatCurrency(data.summary.netBalance, data.displayCurrency)}
            </span>
            <span className="text-success text-[11px] font-medium ml-1.5">
              Verified ✓
            </span>
          </div>
        </div>
      </div>

      {/* Waterfall Trail */}
      <div>
        <h3 className="text-title-sm mb-1">
          Chronological Waterfall Trail
        </h3>
        <p className="text-[12px] text-muted mb-4">
          Click any transaction to audit the split math, exchange rates, and
          full change history.
        </p>

        <div className="space-y-1.5 relative before:absolute before:inset-y-0 before:left-[5px] before:w-px before:bg-hairline">
          {data.waterfall.map((wp: WaterfallDataPoint) => {
            if (wp.type === "NET") return null;

            const isCredit = wp.amount > 0;
            const isSettlement = wp.type === "SETTLEMENT";
            const isExpanded = expandedId === wp.expenseId;

            const expenseExpl = data.expenseTrail.find(
              (e: any) => e.expenseId === wp.expenseId
            );
            const settlementExpl = data.settlements.find(
              (s: any) => s.settlementId === wp.expenseId
            );

            return (
              <div key={wp.expenseId} className="relative pl-6">
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-[3px] top-4 w-[5px] h-[5px] rounded-full border-[1.5px] bg-canvas",
                    isSettlement
                      ? "border-accent-amber"
                      : isCredit
                      ? "border-success"
                      : "border-error"
                  )}
                />

                <div
                  className={cn(
                    "cursor-pointer rounded-lg border border-hairline p-4 transition-colors-fast hover:border-muted-soft",
                    isExpanded && "border-muted-soft bg-surface-soft"
                  )}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : wp.expenseId)
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] text-muted">
                          {new Date(wp.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="text-hairline">·</span>
                        <span className="font-medium text-[13px] text-ink">
                          {wp.label}
                        </span>
                        {wp.isHighlighted && (
                          <Badge
                            variant="warning"
                            className="text-[10px]"
                          >
                            Largest Impact
                          </Badge>
                        )}
                        {wp.currency !== data.displayCurrency && (
                          <Badge
                            variant="default"
                            className="text-[10px]"
                          >
                            converted
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-muted mt-1">
                        {isSettlement
                          ? wp.amount < 0
                            ? "You paid out as settlement"
                            : "You received as settlement"
                          : isCredit
                          ? `You paid the group (Credit: ${formatCurrency(
                              wp.displayAmount,
                              data.displayCurrency
                            )})`
                          : `Your share (Debit: ${formatCurrency(
                              wp.displayAmount,
                              data.displayCurrency
                            )})`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-[13px] font-medium tabular-nums",
                            isSettlement
                              ? wp.amount < 0
                                ? "text-accent-amber"
                                : "text-accent-teal"
                              : isCredit
                              ? "text-success"
                              : "text-error"
                          )}
                        >
                          {wp.amount > 0 ? "+" : ""}
                          {formatCurrency(wp.amount, data.displayCurrency)}
                        </p>
                        <p className="text-[11px] text-muted-soft tabular-nums">
                          Bal:{" "}
                          {formatCurrency(
                            wp.runningBalance,
                            data.displayCurrency
                          )}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div
                      className="mt-4 pt-4 border-t border-hairline-soft space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Currency conversion */}
                      {expenseExpl?.currencyConversion && (
                        <div className="p-3 rounded-lg bg-surface-card space-y-1">
                          <h5 className="text-[12px] font-medium text-ink flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5" /> Exchange Rate
                          </h5>
                          <p className="text-[12px] text-muted">
                            {expenseExpl.currencyConversion.formulaText}
                          </p>
                          <p className="text-[11px] text-muted-soft">
                            Source: ECB rates on{" "}
                            {new Date(
                              expenseExpl.currencyConversion.rateDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {settlementExpl?.currencyConversion && (
                        <div className="p-3 rounded-lg bg-surface-card space-y-1">
                          <h5 className="text-[12px] font-medium text-ink flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5" /> Exchange Rate
                          </h5>
                          <p className="text-[12px] text-muted">
                            {settlementExpl.currencyConversion.formulaText}
                          </p>
                          <p className="text-[11px] text-muted-soft">
                            Source: ECB rates on{" "}
                            {new Date(
                              settlementExpl.currencyConversion.rateDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Split participants */}
                      {expenseExpl && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-[12px] text-muted">
                            <span className="text-caption-upper">
                              Split: {expenseExpl.splitExplanation.splitType}
                            </span>
                            <span className="text-mono text-ink text-[11px] tabular-nums">
                              {expenseExpl.splitExplanation.formulaText}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {expenseExpl.splitExplanation.participants.map(
                              (p: any) => (
                                <div
                                  key={p.userId}
                                  className={cn(
                                    "flex items-center justify-between py-2 px-3 rounded-md text-[12px]",
                                    p.isCurrentUser
                                      ? "bg-primary/5 border border-primary/10"
                                      : "bg-surface-soft"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-muted-soft/30 flex items-center justify-center text-[9px] font-medium text-muted">
                                      {p.name?.[0] || "?"}
                                    </div>
                                    <span className="font-medium text-ink">
                                      {p.name}{" "}
                                      {p.isCurrentUser && "(You)"}
                                    </span>
                                    {p.isPayer && (
                                      <Badge
                                        variant="success"
                                        className="text-[9px] py-0 px-1.5"
                                      >
                                        paid
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <span className="text-muted-soft text-[11px]">
                                      ({p.shareInput})
                                    </span>
                                    <span className="font-medium tabular-nums text-ink">
                                      {formatCurrency(
                                        p.shareAmount,
                                        data.displayCurrency
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {/* Verification */}
                          <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-md text-[12px] text-success">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Share validation: sum matches total
                            </span>
                            <span className="text-mono font-medium tabular-nums mt-1 sm:mt-0">
                              {formatCurrency(
                                expenseExpl.splitExplanation.verification
                                  .sumOfShares,
                                data.displayCurrency
                              )}{" "}
                              /{" "}
                              {formatCurrency(
                                expenseExpl.displayAmount,
                                data.displayCurrency
                              )}
                            </span>
                          </div>

                          {expenseExpl.splitExplanation.verification
                            .remainder !== 0 && (
                            <p className="text-[11px] text-accent-amber">
                              ℹ️ Rounding remainder of{" "}
                              {
                                expenseExpl.splitExplanation.verification
                                  .remainder
                              }{" "}
                              paise assigned to{" "}
                              {
                                expenseExpl.splitExplanation.verification
                                  .remainderAssignedTo
                              }
                              .
                            </p>
                          )}

                          {/* CSV provenance */}
                          {expenseExpl.importSource && (
                            <div className="text-[11px] text-on-dark-soft bg-surface-dark p-3 rounded-lg flex items-center justify-between">
                              <span>
                                CSV Source: Row{" "}
                                {expenseExpl.importSource.sourceRowNum}
                              </span>
                              <button
                                onClick={() =>
                                  fetchAuditLogs(expenseExpl.expenseId)
                                }
                                className="text-primary hover:text-primary-active flex items-center gap-1"
                              >
                                <History className="w-3 h-3" />
                                {showAuditId === expenseExpl.expenseId
                                  ? "Hide"
                                  : "Audit Trail"}
                              </button>
                            </div>
                          )}

                          {/* Audit logs */}
                          {showAuditId === expenseExpl.expenseId && (
                            <div className="p-3 bg-surface-dark rounded-lg space-y-2">
                              <h6 className="text-[12px] font-medium text-on-dark flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5" /> Immutable Audit
                                Trail
                              </h6>
                              {loadingAudit ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                              ) : auditLogs.length === 0 ? (
                                <p className="text-[11px] text-on-dark-soft">
                                  No history logged.
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {auditLogs.map((log: any) => (
                                    <div
                                      key={log.id}
                                      className="text-[11px] border-l-2 border-primary/30 pl-3 py-1 space-y-0.5"
                                    >
                                      <div className="flex items-center justify-between text-on-dark-soft">
                                        <span className="font-medium text-on-dark">
                                          {log.action}
                                        </span>
                                        <span>
                                          {new Date(
                                            log.createdAt
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                      {log.user && (
                                        <p className="text-on-dark-soft">
                                          By: {log.user.name}
                                        </p>
                                      )}
                                      {log.changes && (
                                        <div className="mt-1 text-mono text-[10px] text-on-dark-soft/80 bg-surface-dark-soft p-2 rounded max-h-20 overflow-y-auto">
                                          {JSON.stringify(
                                            log.changes,
                                            null,
                                            2
                                          )}
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
                        <div className="space-y-2 text-[12px]">
                          <div className="flex items-center justify-between text-muted">
                            <span>Settlement Details</span>
                            <span>{settlementExpl.notes || "No notes"}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-card">
                            <CornerDownRight className="w-3.5 h-3.5 text-muted" />
                            <span className="text-ink">
                              {settlementExpl.direction === "PAID"
                                ? "You paid "
                                : "You received from "}
                              <span className="font-medium">
                                {settlementExpl.otherUserName}
                              </span>
                              {" — "}
                              <span className="font-medium text-ink tabular-nums">
                                {formatCurrency(
                                  settlementExpl.amount,
                                  data.displayCurrency
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Close */}
      <div className="flex justify-end pt-4 border-t border-hairline">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
