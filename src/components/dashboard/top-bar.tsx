"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

interface TopBarProps {
  user: { name?: string | null };
  onMenuClick?: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/groups": "Groups",
  "/dashboard/import": "Import CSV",
  "/dashboard/expenses": "Expenses",
  "/dashboard/balances": "Balances",
};

export function TopBar({ user, onMenuClick }: TopBarProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path) return title;
    }
    if (pathname.startsWith("/dashboard/groups/new")) return "New Group";
    if (pathname.startsWith("/dashboard/groups/")) return "Group";
    return "Dashboard";
  };

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 h-16 border-b border-hairline bg-canvas shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1.5 rounded-md hover:bg-surface-soft transition-colors-fast"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-ink" />
        </button>
        <div className="flex items-center gap-2 text-nav-link">
          <span className="text-muted">Dashboard</span>
          <span className="text-hairline">/</span>
          <span className="text-ink font-medium">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-[13px] font-medium text-canvas">
          {(user.name ?? "U")[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
