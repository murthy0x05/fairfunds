"use server";

import { auth } from "@/lib/auth";
import { GroupService } from "@/lib/services/group.service";
import { createGroupSchema } from "@/lib/validators/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string || undefined,
    defaultCurrency: (formData.get("defaultCurrency") as string) || "INR",
  };

  const parsed = createGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const group = await GroupService.create({
    ...parsed.data,
    createdByUserId: session.user.id,
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/groups/${group.id}`);
}

export async function getMyGroups() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return GroupService.getGroupsForUser(session.user.id);
}

export async function getGroupDetails(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return GroupService.getById(groupId);
}

export async function addMemberToGroup(
  groupId: string,
  userId: string,
  joinedAt: Date
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await GroupService.addMember({
      groupId,
      userId,
      joinedAt,
      addedByUserId: session.user.id,
    });
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function removeMemberFromGroup(
  groupId: string,
  userId: string,
  leftAt: Date
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await GroupService.removeMember({
      groupId,
      userId,
      leftAt,
      removedByUserId: session.user.id,
    });
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
