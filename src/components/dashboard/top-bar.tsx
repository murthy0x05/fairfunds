"use client";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface TopBarProps {
  user: { name?: string | null };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="flex items-center justify-end px-6 py-2.5 border-b border-border">
      <form action={signOutAction}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </form>
    </header>
  );
}
