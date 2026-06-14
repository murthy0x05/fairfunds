/**
 * Debt Simplification — Minimizes the number of transactions to settle all debts.
 *
 * Uses a greedy algorithm: repeatedly match the largest debtor with the largest
 * creditor. This produces the minimum number of transfers for most real-world cases.
 *
 * Time complexity: O(n log n) where n = number of users.
 */

export interface Transfer {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number; // in smallest currency unit, always positive
}

interface UserBalance {
  userId: string;
  name: string;
  balance: number; // positive = owed money, negative = owes money
}

/**
 * Given net balances for all users, compute the minimum set of transfers
 * to settle all debts.
 *
 * @param balances Map of userId → { name, balance }
 *   - positive balance = this user is owed money (creditor)
 *   - negative balance = this user owes money (debtor)
 * @returns Array of transfers, sorted by amount descending
 */
export function simplifyDebts(
  balances: Map<string, { name: string; balance: number }>
): Transfer[] {
  // Separate into creditors and debtors
  const creditors: UserBalance[] = [];
  const debtors: UserBalance[] = [];

  for (const [userId, { name, balance }] of balances) {
    if (balance > 0) {
      creditors.push({ userId, name, balance });
    } else if (balance < 0) {
      debtors.push({ userId, name, balance: Math.abs(balance) });
    }
    // balance === 0: no action needed
  }

  // Sort both by amount descending (largest first)
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  // Greedy matching
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const transferAmount = Math.min(creditor.balance, debtor.balance);

    if (transferAmount > 0) {
      transfers.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: transferAmount,
      });
    }

    creditor.balance -= transferAmount;
    debtor.balance -= transferAmount;

    if (creditor.balance === 0) ci++;
    if (debtor.balance === 0) di++;
  }

  // Sort by amount descending for display
  transfers.sort((a, b) => b.amount - a.amount);

  return transfers;
}
