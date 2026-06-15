"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Upload,
  BarChart3,
  Receipt,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { FairFundsWordmark } from "@/components/icons";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/groups", label: "Groups", icon: Users },
  { href: "/dashboard/import", label: "Import CSV", icon: Upload },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/balances", label: "Balances", icon: BarChart3 },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-hairline bg-canvas transition-transform duration-200 ease-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center px-6 h-16 border-b border-hairline shrink-0">
          <FairFundsWordmark logoSize={24} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5">
          <p className="px-3 mb-3 text-caption-upper">
            Navigation
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-nav-link transition-colors-fast",
                    isActive
                      ? "bg-surface-card text-ink font-medium"
                      : "text-muted hover:text-ink hover:bg-surface-soft"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-ink" : "text-muted"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-hairline space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-[12px] font-medium text-canvas shrink-0">
              {(user.name ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-ink">
                {user.name}
              </p>
              <p className="text-[11px] text-muted-soft truncate">
                {user.email}
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[13px] font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors-fast"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
