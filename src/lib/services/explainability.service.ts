import { prisma } from "@/lib/db";
import { CurrencyService } from "./currency.service";
import { formatCurrency } from "@/lib/utils/currency";

export interface CurrencyConversionProof {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: Date;
  rateSource: string;
  originalAmount: number;
  convertedAmount: number;
  formulaText: string;
}

export interface SplitParticipant {
  userId: string;
  name: string;
  isCurrentUser: boolean;
  isPayer: boolean;
  shareInput: string;
  shareAmount: number;
  sharePercentOfTotal: number;
}

export interface SplitExplanation {
  splitType: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARE";
  totalAmount: number;
  participantCount: number;
  paidByName: string;
  formulaText: string;
  participants: SplitParticipant[];
  verification: {
    sumOfShares: number;
    isBalanced: boolean;
    remainder: number;
    remainderAssignedTo: string;
  };
}

export interface ExpenseExplanation {
  expenseId: string;
  date: Date;
  description: string;
  notes: string | null;
  originalAmount: number;
  originalCurrency: string;
  displayAmount: number;
  currencyConversion: CurrencyConversionProof | null;
  splitExplanation: SplitExplanation;
  userImpact: {
    role: "PAYER" | "PARTICIPANT" | "BOTH";
    amountPaid: number;
    shareOwed: number;
    netEffect: number;
    netDirection: "CREDIT" | "DEBIT" | "NEUTRAL";
  };
  importSource: {
    batchId: string | null;
    sourceRowNum: number | null;
    originalCsvLine: string | null;
  } | null;
}

export interface SettlementExplanation {
  settlementId: string;
  date: Date;
  direction: "PAID" | "RECEIVED";
  otherUserName: string;
  amount: number;
  originalCurrency: string;
  notes: string | null;
  currencyConversion: CurrencyConversionProof | null;
}

export interface WaterfallDataPoint {
  expenseId: string;
  date: Date;
  label: string;
  type: "CREDIT" | "DEBIT" | "SETTLEMENT" | "NET";
  amount: number;
  runningBalance: number;
  currency: string;
  displayAmount: number;
  isHighlighted: boolean;
}

export interface BalanceExplanation {
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  displayCurrency: string;
  generatedAt: Date;
  summary: {
    netBalance: number;
    totalPaid: number;
    totalOwed: number;
    grossBalance: number;
    totalSettledOut: number;
    totalSettledIn: number;
    netSettlements: number;
    formula: {
      expression: string;
      values: Record<string, number>;
    };
  };
  waterfall: WaterfallDataPoint[];
  expenseTrail: ExpenseExplanation[];
  settlements: SettlementExplanation[];
  membershipContext: {
    activeFrom: Date;
    activeTo: Date | null;
    totalActiveDays: number;
    expensesBeforeMembership: number;
    expensesAfterMembership: number;
  };
}

export class ExplainabilityService {
  /**
   * Build the detailed mathematical explanation of a user's net balance.
   */
  static async buildBalanceExplanation(
    groupId: string,
    userId: string,
    displayCurrency: string = "INR"
  ): Promise<BalanceExplanation> {
    // ── Fetch all data in parallel ──
    const [expenses, settlements, memberships, user, group] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId, status: "ACTIVE" },
        include: {
          splits: { include: { user: true } },
          paidBy: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.settlement.findMany({
        where: {
          groupId,
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        include: { fromUser: true, toUser: true },
        orderBy: { date: "asc" },
      }),
      prisma.groupMembership.findMany({
        where: { userId, groupId },
        orderBy: { joinedAt: "asc" },
      }),
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.group.findUniqueOrThrow({ where: { id: groupId } }),
    ]);

    // ── Prefetch all needed exchange rates ──
    const ratesNeeded = new Set<string>();
    for (const exp of expenses) {
      if (exp.currency !== displayCurrency) {
        ratesNeeded.add(`${exp.currency}:${exp.date.toISOString().slice(0, 10)}`);
      }
    }
    for (const s of settlements) {
      if (s.currency !== displayCurrency) {
        ratesNeeded.add(`${s.currency}:${s.date.toISOString().slice(0, 10)}`);
      }
    }

    const rateMap = new Map<string, number>();
    for (const pair of ratesNeeded) {
      const [base, dateStr] = pair.split(":");
      const rate = await CurrencyService.getRate(base, displayCurrency, new Date(dateStr));
      rateMap.set(pair, rate);
    }

    // ── Build per-expense explanations ──
    let totalPaid = 0;
    let totalOwed = 0;
    const expenseTrail: ExpenseExplanation[] = [];
    const waterfall: WaterfallDataPoint[] = [];
    let runningBalance = 0;

    for (const expense of expenses) {
      const userSplit = expense.splits.find((s) => s.userId === userId);
      const isPayer = expense.paidById === userId;

      // Skip expenses where this user is neither payer nor participant
      if (!userSplit && !isPayer) continue;

      const rateKey = `${expense.currency}:${expense.date.toISOString().slice(0, 10)}`;
      const rate = expense.currency !== displayCurrency ? (rateMap.get(rateKey) ?? 1) : 1;

      // Currency conversion proof
      let conversionProof: CurrencyConversionProof | null = null;
      let displayTotal = expense.amount;

      if (expense.currency !== displayCurrency) {
        displayTotal = Math.round(expense.amount * rate);
        conversionProof = {
          fromCurrency: expense.currency,
          toCurrency: displayCurrency,
          rate,
          rateDate: expense.date,
          rateSource: "ECB via frankfurter.app",
          originalAmount: expense.amount,
          convertedAmount: displayTotal,
          formulaText: `${formatCurrency(expense.amount, expense.currency)} × ${rate.toFixed(4)} = ${formatCurrency(displayTotal, displayCurrency)}`,
        };
      }

      // Split explanation
      const splitExplanation = this.buildSplitExplanation(
        expense,
        displayTotal,
        displayCurrency,
        userId,
        rate
      );

      // User impact
      const amountPaid = isPayer ? displayTotal : 0;
      const shareOwed = userSplit ? Math.round(userSplit.amount * rate) : 0;

      totalPaid += amountPaid;
      totalOwed += shareOwed;

      const netEffect = amountPaid - shareOwed;
      runningBalance += netEffect;

      expenseTrail.push({
        expenseId: expense.id,
        date: expense.date,
        description: expense.description,
        notes: expense.notes,
        originalAmount: expense.amount,
        originalCurrency: expense.currency,
        displayAmount: displayTotal,
        currencyConversion: conversionProof,
        splitExplanation,
        userImpact: {
          role: isPayer && userSplit ? "BOTH" : isPayer ? "PAYER" : "PARTICIPANT",
          amountPaid,
          shareOwed,
          netEffect,
          netDirection: netEffect > 0 ? "CREDIT" : netEffect < 0 ? "DEBIT" : "NEUTRAL",
        },
        importSource: expense.importBatchId
          ? { batchId: expense.importBatchId, sourceRowNum: expense.sourceRowNum, originalCsvLine: null }
          : null,
      });

      waterfall.push({
        expenseId: expense.id,
        date: expense.date,
        label: expense.description.length > 15 ? expense.description.slice(0, 12) + "..." : expense.description,
        type: netEffect >= 0 ? "CREDIT" : "DEBIT",
        amount: netEffect,
        runningBalance,
        currency: expense.currency,
        displayAmount: Math.abs(netEffect),
        isHighlighted: false,
      });
    }

    // Highlight the largest absolute contributor in the waterfall
    if (waterfall.length > 0) {
      let maxIdx = 0;
      let maxVal = -1;
      for (let i = 0; i < waterfall.length; i++) {
        const absVal = Math.abs(waterfall[i].amount);
        if (absVal > maxVal) {
          maxVal = absVal;
          maxIdx = i;
        }
      }
      waterfall[maxIdx].isHighlighted = true;
    }

    // ── Settlement explanations ──
    let totalSettledOut = 0;
    let totalSettledIn = 0;
    const settlementExplanations: SettlementExplanation[] = [];

    for (const s of settlements) {
      const direction = s.fromUserId === userId ? "PAID" : "RECEIVED";
      const rateKey = `${s.currency}:${s.date.toISOString().slice(0, 10)}`;
      const rate = s.currency !== displayCurrency ? (rateMap.get(rateKey) ?? 1) : 1;

      let displayAmount = s.amount;
      let sConversion: CurrencyConversionProof | null = null;

      if (s.currency !== displayCurrency) {
        displayAmount = Math.round(s.amount * rate);
        sConversion = {
          fromCurrency: s.currency,
          toCurrency: displayCurrency,
          rate,
          rateDate: s.date,
          rateSource: "ECB via frankfurter.app",
          originalAmount: s.amount,
          convertedAmount: displayAmount,
          formulaText: `${formatCurrency(s.amount, s.currency)} × ${rate.toFixed(4)} = ${formatCurrency(displayAmount, displayCurrency)}`,
        };
      }

      if (direction === "PAID") totalSettledOut += displayAmount;
      else totalSettledIn += displayAmount;

      const effect = direction === "PAID" ? -displayAmount : displayAmount;
      runningBalance += effect;

      waterfall.push({
        expenseId: s.id,
        date: s.date,
        label: direction === "PAID" ? `Paid ${s.toUser.name}` : `Recv from ${s.fromUser.name}`,
        type: "SETTLEMENT",
        amount: effect,
        runningBalance,
        currency: s.currency,
        displayAmount,
        isHighlighted: false,
      });

      settlementExplanations.push({
        settlementId: s.id,
        date: s.date,
        direction,
        otherUserName: direction === "PAID" ? s.toUser.name : s.fromUser.name,
        amount: displayAmount,
        originalCurrency: s.currency,
        notes: s.notes,
        currencyConversion: sConversion,
      });
    }

    // Net balance
    const netBalance = totalPaid - totalOwed - totalSettledOut + totalSettledIn;

    // Add Net Balance as final waterfall node
    waterfall.push({
      expenseId: "net",
      date: new Date(),
      label: "Net Balance",
      type: "NET",
      amount: netBalance,
      runningBalance: netBalance,
      currency: displayCurrency,
      displayAmount: Math.abs(netBalance),
      isHighlighted: false,
    });

    const activeFrom = memberships[0]?.joinedAt ?? new Date();
    const activeTo = memberships[memberships.length - 1]?.leftAt ?? null;
    const totalActiveDays = this.calculateActiveDays(memberships);

    return {
      userId,
      userName: user.name,
      groupId,
      groupName: group.name,
      displayCurrency,
      generatedAt: new Date(),
      summary: {
        netBalance,
        totalPaid,
        totalOwed,
        grossBalance: totalPaid - totalOwed,
        totalSettledOut,
        totalSettledIn,
        netSettlements: totalSettledIn - totalSettledOut,
        formula: {
          expression: "totalPaid - totalOwed - settledOut + settledIn = netBalance",
          values: { totalPaid, totalOwed, totalSettledOut, totalSettledIn, netBalance },
        },
      },
      waterfall,
      expenseTrail,
      settlements: settlementExplanations,
      membershipContext: {
        activeFrom,
        activeTo,
        totalActiveDays,
        expensesBeforeMembership: 0,
        expensesAfterMembership: 0,
      },
    };
  }

  private static buildSplitExplanation(
    expense: any,
    displayTotal: number,
    displayCurrency: string,
    currentUserId: string,
    rate: number
  ): SplitExplanation {
    const participants = expense.splits.map((split: any) => {
      const displayShare = Math.round(split.amount * rate);
      return {
        userId: split.userId,
        name: split.user.name,
        isCurrentUser: split.userId === currentUserId,
        isPayer: split.userId === expense.paidById,
        shareInput: this.formatShareInput(expense.splitType, split, expense.splits.length, expense.currency),
        shareAmount: displayShare,
        sharePercentOfTotal: displayTotal > 0 ? (displayShare / displayTotal) * 100 : 0,
      };
    });

    const sumOfShares = participants.reduce((s: number, p: any) => s + p.shareAmount, 0);
    const remainder = displayTotal - sumOfShares;

    return {
      splitType: expense.splitType,
      totalAmount: displayTotal,
      participantCount: participants.length,
      paidByName: expense.paidBy.name,
      formulaText: this.buildFormulaText(expense, displayTotal, displayCurrency, currentUserId, rate),
      participants,
      verification: {
        sumOfShares,
        isBalanced: Math.abs(remainder) <= 1,
        remainder,
        remainderAssignedTo: remainder !== 0 ? expense.paidBy.name : "None",
      },
    };
  }

  private static buildFormulaText(
    expense: any,
    displayTotal: number,
    currency: string,
    userId: string,
    rate: number
  ): string {
    const userSplit = expense.splits.find((s: any) => s.userId === userId);
    const displayShare = userSplit ? Math.round(userSplit.amount * rate) : 0;

    const fmt = (val: number) => formatCurrency(val, currency);

    switch (expense.splitType) {
      case "EQUAL":
        return `${fmt(displayTotal)} ÷ ${expense.splits.length} members = ${fmt(displayShare)} each`;
      case "PERCENTAGE":
        const pct = userSplit?.percentage ?? 0;
        return `${fmt(displayTotal)} × ${pct}% = ${fmt(displayShare)}`;
      case "SHARE":
        const userShares = userSplit?.shareUnits ?? 0;
        const totalShares = expense.splits.reduce((s: number, sp: any) => s + (sp.shareUnits ?? 0), 0);
        return `${fmt(displayTotal)} × (${userShares} / ${totalShares} shares) = ${fmt(displayShare)}`;
      case "UNEQUAL":
        return `Unequal split: specified share is ${fmt(displayShare)}`;
      default:
        return fmt(displayShare);
    }
  }

  private static formatShareInput(
    splitType: string,
    split: any,
    totalCount: number,
    currency: string
  ): string {
    switch (splitType) {
      case "EQUAL":
        return `1/${totalCount}`;
      case "PERCENTAGE":
        return `${split.percentage}%`;
      case "SHARE":
        return `${split.shareUnits} shares`;
      case "UNEQUAL":
        return formatCurrency(split.amount, currency);
      default:
        return "—";
    }
  }

  private static calculateActiveDays(memberships: any[]): number {
    let days = 0;
    for (const m of memberships) {
      const start = new Date(m.joinedAt);
      const end = m.leftAt ? new Date(m.leftAt) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      days += diffDays;
    }
    return days;
  }
}
