export interface SplitInput {
  userId: string;
  shareUnits?: number;
  percentage?: number;
  fixedAmount?: number;
}

export interface SplitResult {
  userId: string;
  amount: number;
  shareUnits?: number;
  percentage?: number;
}

export function calculateEqualSplit(totalAmount: number, participants: SplitInput[]): SplitResult[] {
  const count = participants.length;
  if (count === 0) return [];
  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount - base * count;
  return participants.map((p, i) => ({
    userId: p.userId,
    amount: i < remainder ? base + 1 : base,
  }));
}

export function calculatePercentageSplit(totalAmount: number, participants: SplitInput[]): SplitResult[] {
  if (participants.length === 0) return [];
  let allocated = 0;
  const results: SplitResult[] = participants.map((p) => {
    const pct = p.percentage ?? 0;
    const raw = Math.round((totalAmount * pct) / 100);
    allocated += raw;
    return { userId: p.userId, amount: raw, percentage: pct };
  });
  const diff = totalAmount - allocated;
  if (diff !== 0 && results.length > 0) results[0].amount += diff;
  return results;
}

export function calculateShareSplit(totalAmount: number, participants: SplitInput[]): SplitResult[] {
  if (participants.length === 0) return [];
  const totalShares = participants.reduce((sum, p) => sum + (p.shareUnits ?? 1), 0);
  if (totalShares === 0) throw new Error("Total shares cannot be zero");
  let allocated = 0;
  const results: SplitResult[] = participants.map((p) => {
    const shares = p.shareUnits ?? 1;
    const raw = Math.round((totalAmount * shares) / totalShares);
    allocated += raw;
    return { userId: p.userId, amount: raw, shareUnits: shares };
  });
  const diff = totalAmount - allocated;
  if (diff !== 0 && results.length > 0) results[0].amount += diff;
  return results;
}

export function calculateUnequalSplit(totalAmount: number, participants: SplitInput[]): SplitResult[] {
  if (participants.length === 0) return [];
  return participants.map((p) => ({
    userId: p.userId,
    amount: p.fixedAmount ?? 0,
  }));
}

export function calculateSplit(
  splitType: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARE",
  totalAmount: number,
  participants: SplitInput[]
): SplitResult[] {
  switch (splitType) {
    case "EQUAL": return calculateEqualSplit(totalAmount, participants);
    case "PERCENTAGE": return calculatePercentageSplit(totalAmount, participants);
    case "SHARE": return calculateShareSplit(totalAmount, participants);
    case "UNEQUAL": return calculateUnequalSplit(totalAmount, participants);
    default: throw new Error(`Unknown split type: ${splitType}`);
  }
}
