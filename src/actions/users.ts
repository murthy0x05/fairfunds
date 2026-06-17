"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addMemberToGroup } from "./groups";

export async function resolveAndAddUser(
  groupId: string,
  email: string,
  name: string,
  joinedAt: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Lookup user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create a guest user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          isGuest: true,
        },
      });
    }

    // Call existing add member logic
    const result = await addMemberToGroup(groupId, user.id, new Date(joinedAt));
    if (result?.error) {
      return { error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
