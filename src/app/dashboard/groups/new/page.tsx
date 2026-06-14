"use client";

import { useState } from "react";
import { createGroup } from "@/actions/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
      <Card>
        <CardHeader>
          <CardTitle>Create new group</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Group name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Flat Expenses 2026"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description
                <span className="text-[var(--color-tertiary)] font-normal ml-1">optional</span>
              </label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Monthly shared expenses"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="defaultCurrency" className="text-sm font-medium">
                Default currency
              </label>
              <select
                id="defaultCurrency"
                name="defaultCurrency"
                defaultValue="INR"
                className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
                <option value="GBP">£ GBP — British Pound</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Creating…" : "Create group"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
