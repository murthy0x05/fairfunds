"use client";

import { useState } from "react";
import { resolveAndAddUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, UserPlus, Loader2 } from "lucide-react";

interface AddMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddMemberModal({ groupId, isOpen, onClose }: AddMemberModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [joinedAt, setJoinedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await resolveAndAddUser(groupId, email, name, joinedAt);
      if (res.error) {
        setError(res.error);
      } else {
        onClose();
        setEmail("");
        setName("");
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
            <UserPlus className="w-4 h-4 text-ink" />
            <h2 className="text-title-sm">Add Member</h2>
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
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., John Doe"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink">Join Date</label>
            <Input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              required
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
