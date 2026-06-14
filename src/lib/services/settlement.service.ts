import { prisma } from "@/lib/db";
import { AuditLogger } from "./audit.service";

interface CreateSettlementData {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number; // smallest currency unit
  currency: string;
  date: Date;
  notes?: string;
  importBatchId?: string;
  sourceRowNum?: number;
  userId: string; // who's creating this
}

export class SettlementService {
  static async create(data: CreateSettlementData) {
    if (data.fromUserId === data.toUserId) {
      throw new Error("A user cannot settle with themselves");
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId: data.groupId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        amount: data.amount,
        currency: data.currency,
        date: data.date,
        notes: data.notes,
        importBatchId: data.importBatchId,
        sourceRowNum: data.sourceRowNum,
      },
    });

    await AuditLogger.log({
      entityType: "Settlement",
      entityId: settlement.id,
      action: data.importBatchId ? "IMPORTED" : "CREATED",
      userId: data.userId,
      metadata: data.importBatchId
        ? {
            importBatchId: data.importBatchId,
            sourceRowNum: data.sourceRowNum,
            reclassifiedFrom: "expense",
          }
        : undefined,
    });

    return settlement;
  }

  static async getByGroup(groupId: string) {
    return prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { date: "desc" },
    });
  }
}
