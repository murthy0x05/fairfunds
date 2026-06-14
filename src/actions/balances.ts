"use server";

import { auth } from "@/lib/auth";
import { BalanceService } from "@/lib/services/balance.service";
import { SettlementService } from "@/lib/services/settlement.service";
import { toSmallestUnit } from "@/lib/utils/currency";
import { createSettlementSchema } from "@/lib/validators/schemas";
import { revalidatePath } from "next/cache";

export async function getGroupBalances(groupId: string, displayCurrency?: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return BalanceService.calculateGroupBalances(groupId, displayCurrency);
}

export async function createSettlement(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const groupId = formData.get("groupId") as string;
  const currency = (formData.get("currency") as string) || "INR";
  const amount = parseFloat(formData.get("amount") as string);

  const raw = {
    groupId,
    fromUserId: formData.get("fromUserId") as string,
    toUserId: formData.get("toUserId") as string,
    amount,
    currency,
    date: formData.get("date") as string,
    notes: formData.get("notes") as string || undefined,
  };

  const parsed = createSettlementSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await SettlementService.create({
      ...parsed.data,
      amount: toSmallestUnit(parsed.data.amount, currency),
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function getGroupSettlements(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  return SettlementService.getByGroup(groupId);
}

export async function getBalanceExplanation(groupId: string, targetUserId: string, displayCurrency: string = "INR") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const { ExplainabilityService } = await import("@/lib/services/explainability.service");
  return ExplainabilityService.buildBalanceExplanation(groupId, targetUserId, displayCurrency);
}
