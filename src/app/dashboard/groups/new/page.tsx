"use client";

import { useState } from "react";
import { createGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users } from "lucide-react";

export default function NewGroupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <Users className="w-5 h-5 text-ink" />
          <h1 className="text-display-sm">Create New Group</h1>
        </div>
        <p className="text-body-sm text-muted">
          Set up an expense sharing group
        </p>
      </div>

      <div className="bg-surface-card rounded-lg p-8">
        <form action={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-error/8 border border-error/15 px-4 py-3 text-[14px] text-error">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="name" className="text-caption text-ink">
              Group Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Flat Expenses 2026"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-caption text-ink">
              Description (optional)
            </label>
            <Input
              id="description"
              name="description"
              placeholder="e.g., Monthly shared expenses for our apartment"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="defaultCurrency" className="text-caption text-ink">
              Default Currency
            </label>
            <select
              id="defaultCurrency"
              name="defaultCurrency"
              defaultValue="INR"
              className="flex h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-[16px] text-ink font-sans transition-colors-fast focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15"
            >
              <option value="INR">₹ INR — Indian Rupee</option>
              <option value="USD">$ USD — US Dollar</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="GBP">£ GBP — British Pound</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </div>
    </div>
  );
}
