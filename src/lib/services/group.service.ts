import { prisma } from "@/lib/db";
import { AuditLogger } from "./audit.service";

export class GroupService {
  static async create(data: {
    name: string;
    description?: string;
    defaultCurrency?: string;
    createdByUserId: string;
  }) {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        defaultCurrency: data.defaultCurrency ?? "INR",
      },
    });

    // Add creator as ADMIN
    await prisma.groupMembership.create({
      data: {
        userId: data.createdByUserId,
        groupId: group.id,
        role: "ADMIN",
        joinedAt: new Date(),
      },
    });

    await AuditLogger.log({
      entityType: "Group",
      entityId: group.id,
      action: "CREATED",
      userId: data.createdByUserId,
    });

    return group;
  }

  static async getById(groupId: string) {
    return prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, isGuest: true } } },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
  }

  static async getGroupsForUser(userId: string) {
    const memberships = await prisma.groupMembership.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { expenses: true, memberships: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    return memberships.map((m) => ({ ...m.group, membership: m }));
  }

  static async addMember(data: {
    groupId: string;
    userId: string;
    joinedAt: Date;
    role?: "ADMIN" | "MEMBER";
    addedByUserId: string;
  }) {
    const membership = await prisma.groupMembership.create({
      data: {
        userId: data.userId,
        groupId: data.groupId,
        role: data.role ?? "MEMBER",
        joinedAt: data.joinedAt,
      },
    });

    await AuditLogger.log({
      entityType: "GroupMembership",
      entityId: membership.id,
      action: "CREATED",
      userId: data.addedByUserId,
      metadata: { userId: data.userId, groupId: data.groupId, joinedAt: data.joinedAt },
    });

    return membership;
  }

  static async removeMember(data: {
    groupId: string;
    userId: string;
    leftAt: Date;
    removedByUserId: string;
  }) {
    // Find the active membership (leftAt is null)
    const membership = await prisma.groupMembership.findFirst({
      where: {
        userId: data.userId,
        groupId: data.groupId,
        leftAt: null,
      },
    });

    if (!membership) {
      throw new Error("User is not an active member of this group");
    }

    if (data.leftAt < membership.joinedAt) {
      throw new Error("Leave date cannot be before join date");
    }

    const updated = await prisma.groupMembership.update({
      where: { id: membership.id },
      data: { leftAt: data.leftAt },
    });

    await AuditLogger.log({
      entityType: "GroupMembership",
      entityId: membership.id,
      action: "UPDATED",
      userId: data.removedByUserId,
      changes: { leftAt: { old: null, new: data.leftAt } },
    });

    return updated;
  }

  static async getActiveMembers(groupId: string, asOfDate?: Date) {
    const date = asOfDate ?? new Date();
    return prisma.groupMembership.findMany({
      where: {
        groupId,
        joinedAt: { lte: date },
        OR: [{ leftAt: null }, { leftAt: { gte: date } }],
      },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, isGuest: true } } },
    });
  }
}
