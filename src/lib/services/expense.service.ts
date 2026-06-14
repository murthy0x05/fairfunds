import { prisma } from "@/lib/db";
import { AuditLogger } from "./audit.service";
import { calculateSplit, type SplitInput, type SplitResult } from "@/lib/utils/split-calculator";
import { type SplitType, type ExpenseStatus } from "@prisma/client";

interface CreateExpenseData {
  groupId: string;
  paidById: string;
  description: string;
  amount: number; // in smallest currency unit
  currency: string;
  date: Date;
  splitType: SplitType;
  splits: SplitInput[];
  notes?: string;
  importBatchId?: string;
  sourceRowNum?: number;
  userId: string; // who's creating this
}

export class ExpenseService {
  static async create(data: CreateExpenseData) {
    // Calculate splits
    const splitResults = calculateSplit(data.splitType, data.amount, data.splits);

    // Validate: splits must sum to expense amount
    const splitSum = splitResults.reduce((sum, s) => sum + s.amount, 0);
    if (splitSum !== data.amount) {
      throw new Error(
        `Split amounts sum to ${splitSum}, expected ${data.amount}`
      );
    }

    // Create expense and splits in a single transaction
    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          groupId: data.groupId,
          paidById: data.paidById,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          date: data.date,
          splitType: data.splitType,
          notes: data.notes,
          importBatchId: data.importBatchId,
          sourceRowNum: data.sourceRowNum,
        },
      });

      await tx.expenseSplit.createMany({
        data: splitResults.map((s) => ({
          expenseId: exp.id,
          userId: s.userId,
          amount: s.amount,
          shareUnits: s.shareUnits,
          percentage: s.percentage,
        })),
      });

      return exp;
    });

    await AuditLogger.log({
      entityType: "Expense",
      entityId: expense.id,
      action: data.importBatchId ? "IMPORTED" : "CREATED",
      userId: data.userId,
      metadata: data.importBatchId
        ? { importBatchId: data.importBatchId, sourceRowNum: data.sourceRowNum }
        : undefined,
    });

    return expense;
  }

  static async getById(expenseId: string) {
    return prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        splits: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        auditLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async getByGroup(
    groupId: string,
    options?: { status?: ExpenseStatus; limit?: number; offset?: number }
  ) {
    return prisma.expense.findMany({
      where: {
        groupId,
        status: options?.status ?? "ACTIVE",
      },
      include: {
        splits: {
          include: { user: { select: { id: true, name: true } } },
        },
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { date: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  static async update(
    expenseId: string,
    data: Partial<{
      description: string;
      amount: number;
      currency: string;
      date: Date;
      notes: string;
    }>,
    userId: string
  ) {
    const existing = await prisma.expense.findUniqueOrThrow({
      where: { id: expenseId },
    });

    const changes = AuditLogger.diff(existing, data);

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data,
    });

    if (Object.keys(changes).length > 0) {
      await AuditLogger.log({
        entityType: "Expense",
        entityId: expenseId,
        action: "UPDATED",
        userId,
        changes,
      });
    }

    return updated;
  }

  static async updateStatus(
    expenseId: string,
    status: ExpenseStatus,
    userId: string
  ) {
    const existing = await prisma.expense.findUniqueOrThrow({
      where: { id: expenseId },
    });

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      ACTIVE: ["DUPLICATE", "DELETED"],
      DUPLICATE: ["ACTIVE"],
      DELETED: ["ACTIVE"],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new Error(
        `Invalid status transition: ${existing.status} → ${status}`
      );
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: { status },
    });

    await AuditLogger.log({
      entityType: "Expense",
      entityId: expenseId,
      action: status === "DELETED" ? "DELETED" : status === "ACTIVE" ? "RESTORED" : "DUPLICATE_FLAGGED",
      userId,
      changes: { status: { old: existing.status, new: status } },
    });

    return updated;
  }

  static async delete(expenseId: string, userId: string) {
    return this.updateStatus(expenseId, "DELETED", userId);
  }
}
