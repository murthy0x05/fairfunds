"use client";

import { useState } from "react";
import { createSettlement } from "@/actions/balances";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowRightLeft, Loader2 } from "lucide-react";

interface AddSettlementModalProps {
  groupId: string;
  currency: string;
  members: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export function AddSettlementModal({ groupId, currency, members, isOpen, onClose }: AddSettlementModalProps) {
  const [fromUserId, setFromUserId] = useState(members[0]?.id || "");
  const [toUserId, setToUserId] = useState(members[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromUserId === toUserId) {
      setError("Sender and receiver cannot be the same");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("groupId", groupId);
      formData.append("fromUserId", fromUserId);
      formData.append("toUserId", toUserId);
      formData.append("amount", amount);
      formData.append("currency", currency);
      formData.append("date", new Date(date).toISOString());
      if (notes) formData.append("notes", notes);

      const res = await createSettlement(formData);
      if (res.error) {
        setError(res.error);
      } else {
        onClose();
        setAmount("");
        setNotes("");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-hairline bg-canvas flex flex-col shadow-dropdown">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-ink" />
            <h2 className="text-title-sm">Record Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-soft text-muted hover:text-ink transition-colors-fast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-[13px] text-error bg-error/10 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-ink">From</label>
              <select
                className="w-full px-3 py-2 text-[14px] bg-surface-soft border border-hairline rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                required
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-ink">To</label>
              <select
                className="w-full px-3 py-2 text-[14px] bg-surface-soft border border-hairline rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                required
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
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
            <label className="text-[13px] font-medium text-ink">Notes (Optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Dinner settlement"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
