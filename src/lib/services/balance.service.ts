import { prisma } from "@/lib/db";
import { CurrencyService } from "./currency.service";
import { simplifyDebts, type Transfer } from "@/lib/utils/debt-simplifier";

export interface UserBalance {
  userId: string;
  name: string;
  totalPaid: number;      // in display currency
  totalOwed: number;      // in display currency
  settledOut: number;     // settlements paid
  settledIn: number;      // settlements received
  netBalance: number;     // positive = owed money, negative = owes money
}

export interface GroupBalances {
  groupId: string;
  displayCurrency: string;
  balances: UserBalance[];
  transfers: Transfer[];
  totalExpenses: number;
  expenseCount: number;
}

export class BalanceService {
  /**
   * Calculate balances for all members in a group.
   * Returns per-user balance breakdown and simplified transfers.
   */
  static async calculateGroupBalances(
    groupId: string,
    displayCurrency: string = "INR"
  ): Promise<GroupBalances> {
    // Fetch all active expenses with splits
    const expenses = await prisma.expense.findMany({
      where: { groupId, status: "ACTIVE" },
      include: {
        splits: true,
        paidBy: { select: { id: true, name: true } },
      },
    });

    // Fetch all settlements
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    // Fetch all members (including departed)
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Build unique user map
    const userMap = new Map<string, string>();
    for (const m of memberships) {
      userMap.set(m.userId, m.user.name || "Unknown");
    }

    // Prefetch exchange rates for all unique (currency, date) pairs
    const ratePairs = new Set<string>();
    for (const e of expenses) {
      if (e.currency !== displayCurrency) {
        ratePairs.add(`${e.currency}:${e.date.toISOString().slice(0, 10)}`);
      }
    }
    for (const s of settlements) {
      if (s.currency !== displayCurrency) {
        ratePairs.add(`${s.currency}:${s.date.toISOString().slice(0, 10)}`);
      }
    }

    const rateMap = new Map<string, number>();
    for (const pair of ratePairs) {
      const [base, dateStr] = pair.split(":");
      const rate = await CurrencyService.getRate(base, displayCurrency, new Date(dateStr));
      rateMap.set(pair, rate);
    }

    // ── Calculate per-user totals ──
    const paidMap = new Map<string, number>();   // userId → total paid
    const owedMap = new Map<string, number>();   // userId → total owed
    const settledOutMap = new Map<string, number>();
    const settledInMap = new Map<string, number>();

    let totalExpenses = 0;

    for (const expense of expenses) {
      const rateKey = `${expense.currency}:${expense.date.toISOString().slice(0, 10)}`;
      const rate = expense.currency !== displayCurrency
        ? (rateMap.get(rateKey) ?? 1)
        : 1;

      const displayAmount = Math.round(expense.amount * rate);
      totalExpenses += displayAmount;

      // Credit the payer
      const prevPaid = paidMap.get(expense.paidById) ?? 0;
      paidMap.set(expense.paidById, prevPaid + displayAmount);

      // Debit each split participant
      for (const split of expense.splits) {
        const splitDisplay = Math.round(split.amount * rate);
        const prevOwed = owedMap.get(split.userId) ?? 0;
        owedMap.set(split.userId, prevOwed + splitDisplay);
      }
    }

    // Process settlements
    for (const s of settlements) {
      const rateKey = `${s.currency}:${s.date.toISOString().slice(0, 10)}`;
      const rate = s.currency !== displayCurrency
        ? (rateMap.get(rateKey) ?? 1)
        : 1;

      const displayAmount = Math.round(s.amount * rate);

      const prevOut = settledOutMap.get(s.fromUserId) ?? 0;
      settledOutMap.set(s.fromUserId, prevOut + displayAmount);

      const prevIn = settledInMap.get(s.toUserId) ?? 0;
      settledInMap.set(s.toUserId, prevIn + displayAmount);
    }

    // ── Build balance array ──
    const balances: UserBalance[] = [];
    const balanceMap = new Map<string, { name: string; balance: number }>();

    for (const [userId, name] of userMap) {
      const totalPaid = paidMap.get(userId) ?? 0;
      const totalOwed = owedMap.get(userId) ?? 0;
      const settledOut = settledOutMap.get(userId) ?? 0;
      const settledIn = settledInMap.get(userId) ?? 0;
      const netBalance = totalPaid - totalOwed - settledOut + settledIn;

      balances.push({
        userId,
        name,
        totalPaid,
        totalOwed,
        settledOut,
        settledIn,
        netBalance,
      });

      balanceMap.set(userId, { name, balance: netBalance });
    }

    // Sort by absolute balance (largest first)
    balances.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));

    // ── Simplify debts ──
    const transfers = simplifyDebts(balanceMap);

    return {
      groupId,
      displayCurrency,
      balances,
      transfers,
      totalExpenses,
      expenseCount: expenses.length,
    };
  }
}
