"use server";

import { auth } from "@/lib/auth";
import { ExpenseService } from "@/lib/services/expense.service";
import { createExpenseSchema } from "@/lib/validators/schemas";
import { toSmallestUnit } from "@/lib/utils/currency";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const groupId = formData.get("groupId") as string;
  const currency = (formData.get("currency") as string) || "INR";
  const amount = parseFloat(formData.get("amount") as string);
  const splitsJson = formData.get("splits") as string;

  let splits;
  try {
    splits = JSON.parse(splitsJson);
  } catch {
    return { error: "Invalid split data" };
  }

  const raw = {
    groupId,
    paidById: formData.get("paidById") as string,
    description: formData.get("description") as string,
    amount,
    currency,
    date: formData.get("date") as string,
    splitType: formData.get("splitType") as string,
    splits,
  };

  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const expense = await ExpenseService.create({
      ...parsed.data,
      amount: toSmallestUnit(parsed.data.amount, currency),
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true, expenseId: expense.id };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function getGroupExpenses(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  return ExpenseService.getByGroup(groupId);
}

export async function getExpenseDetails(expenseId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return ExpenseService.getById(expenseId);
}

export async function deleteExpense(expenseId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await ExpenseService.delete(expenseId, session.user.id);
    revalidatePath(`/dashboard/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function getExpenseHistory(expenseId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const { AuditLogger } = await import("@/lib/services/audit.service");
  return AuditLogger.getHistory("Expense", expenseId);
}
