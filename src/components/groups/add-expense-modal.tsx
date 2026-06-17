"use client";

import { useState } from "react";
import { createExpense } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddExpenseModalProps {
  groupId: string;
  currency: string;
  members: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
}

type SplitType = "EQUAL" | "UNEQUAL";

export function AddExpenseModal({ groupId, currency, members, isOpen, onClose }: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState(members[0]?.id || "");
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  
  // For EQUAL splits: tracks which users are participating (default all)
  const [participatingUsers, setParticipatingUsers] = useState<Set<string>>(
    new Set(members.map(m => m.id))
  );

  // For UNEQUAL splits: tracks exact amounts per user
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleParticipant = (userId: string) => {
    const newSet = new Set(participatingUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setParticipatingUsers(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      setError("Please enter a valid positive amount");
      setIsLoading(false);
      return;
    }

    let splits: any[] = [];

    if (splitType === "EQUAL") {
      if (participatingUsers.size === 0) {
        setError("At least one person must participate in the split.");
        setIsLoading(false);
        return;
      }
      // Server will divide equally based on shares, but we pass shareUnits or fixed amount
      // Actually, createExpense action requires split properties based on schema:
      // percentage, shareUnits, or fixedAmount.
      // If EQUAL, we can just pass shareUnits = 1 for all participants
      splits = Array.from(participatingUsers).map(userId => ({
        userId,
        shareUnits: 1
      }));
    } else if (splitType === "UNEQUAL") {
      let sum = 0;
      splits = Object.entries(exactAmounts).map(([userId, amt]) => {
        const parsedAmt = parseFloat(amt) || 0;
        sum += parsedAmt;
        return { userId, fixedAmount: parsedAmt };
      }).filter(s => s.fixedAmount > 0);

      // We allow minor float imprecision checking
      if (Math.abs(sum - totalAmount) > 0.01) {
        setError(`Total split amounts (${sum}) must exactly equal the expense amount (${totalAmount})`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("groupId", groupId);
      formData.append("paidById", paidById);
      formData.append("description", description);
      formData.append("amount", amount);
      formData.append("currency", currency);
      formData.append("date", new Date(date).toISOString());
      formData.append("splitType", splitType);
      formData.append("splits", JSON.stringify(splits));

      const res = await createExpense(formData);
      if (res.error) {
        setError(res.error);
      } else {
        onClose();
        setDescription("");
        setAmount("");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-hairline bg-canvas flex flex-col shadow-dropdown max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-ink" />
            <h2 className="text-title-sm">Add Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-soft text-muted hover:text-ink transition-colors-fast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-[13px] text-error bg-error/10 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-ink">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Dinner at Mario's"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-ink">Amount ({currency})</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-ink">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-ink">Paid By</label>
              <select
                className="w-full px-3 py-2 text-[14px] bg-surface-soft border border-hairline rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                required
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-hairline-soft">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-ink">Split Type</label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={splitType === "EQUAL" ? "default" : "secondary"} 
                    size="sm" 
                    onClick={() => setSplitType("EQUAL")}
                    className="h-7 text-[11px]"
                  >
                    Equal
                  </Button>
                  <Button 
                    type="button" 
                    variant={splitType === "UNEQUAL" ? "default" : "secondary"} 
                    size="sm" 
                    onClick={() => setSplitType("UNEQUAL")}
                    className="h-7 text-[11px]"
                  >
                    Exact Amounts
                  </Button>
                </div>
              </div>

              <div className="bg-surface-soft rounded-md border border-hairline p-3 mt-2 space-y-2 max-h-48 overflow-y-auto">
                {splitType === "EQUAL" && members.map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={participatingUsers.has(m.id)}
                      onChange={() => toggleParticipant(m.id)}
                      className="rounded border-hairline text-primary focus:ring-primary"
                    />
                    <span className="text-[13px] text-ink">{m.name}</span>
                  </label>
                ))}

                {splitType === "UNEQUAL" && members.map(m => (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-ink truncate">{m.name}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24 h-7 text-[13px]"
                      placeholder="0.00"
                      value={exactAmounts[m.id] || ""}
                      onChange={(e) => setExactAmounts(prev => ({...prev, [m.id]: e.target.value}))}
                    />
                  </div>
                ))}
              </div>
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-hairline bg-surface-card flex justify-end gap-3 shrink-0">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button form="expense-form" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Expense
          </Button>
        </div>
      </div>
    </div>
  );
}
