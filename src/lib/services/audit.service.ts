import { prisma } from "@/lib/db";

type AuditAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "RESTORED"
  | "IMPORTED"
  | "STATUS_CHANGED"
  | "DUPLICATE_FLAGGED"
  | "SETTLEMENT_RECLASSIFIED"
  | "ANOMALY_RESOLVED";

interface AuditLogParams {
  entityType: "Expense" | "Settlement" | "Group" | "GroupMembership" | "ImportAnomaly";
  entityId: string;
  action: AuditAction;
  userId?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  /**
   * Log an audit event. This is append-only — no updates or deletes.
   */
  static async log(params: AuditLogParams): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId ?? undefined,
        changes: (params.changes as any) ?? undefined,
        metadata: (params.metadata as any) ?? undefined,
      },
    });
  }

  /**
   * Compare two objects and return only the changed fields.
   * Used for UPDATE audit logs.
   */
  static diff<T extends Record<string, unknown>>(
    oldObj: T,
    newObj: Partial<T>
  ): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const key of Object.keys(newObj)) {
      const oldVal = oldObj[key];
      const newVal = newObj[key as keyof typeof newObj];

      if (oldVal !== newVal) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }

    return changes;
  }

  /**
   * Get the full audit trail for an entity.
   */
  static async getHistory(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
