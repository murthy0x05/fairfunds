"use client";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";

interface TopBarProps {
  user: { name?: string | null };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 rounded-lg hover:bg-secondary">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-medium text-muted-foreground">
          Welcome back, <span className="text-foreground">{user.name}</span>
        </h2>
      </div>

      <form action={signOutAction}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </form>
    </header>
  );
}
