import { z } from "zod";

// ── Auth schemas ──

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// ── Group schemas ──

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(500).optional(),
  defaultCurrency: z.string().length(3).default("INR"),
});

export const addMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  joinedAt: z.coerce.date(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const removeMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  leftAt: z.coerce.date(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// ── Expense schemas ──

export const splitDetailSchema = z.object({
  userId: z.string(),
  shareUnits: z.number().optional(),
  percentage: z.number().optional(),
  fixedAmount: z.number().optional(),
});

export const createExpenseSchema = z.object({
  groupId: z.string(),
  paidById: z.string(),
  description: z.string().min(1, "Description is required").max(200),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3).default("INR"),
  date: z.coerce.date(),
  splitType: z.enum(["EQUAL", "UNEQUAL", "PERCENTAGE", "SHARE"]),
  splits: z.array(splitDetailSchema).min(1, "At least one split participant required"),
  notes: z.string().max(500).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ── Settlement schemas ──

export const createSettlementSchema = z.object({
  groupId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3).default("INR"),
  date: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
