import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Receipt,
  ArrowRight,
  Coins,
  Plus,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          _count: { select: { expenses: true, memberships: true, settlements: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalExpenses = await prisma.expense.count({
    where: {
      group: { memberships: { some: { userId: session.user.id } } },
      status: "ACTIVE",
    },
  });

  const totalGroups = memberships.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalGroups} {totalGroups === 1 ? "group" : "groups"} · {totalExpenses} {totalExpenses === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <Link href="/dashboard/groups/new">
          <Button size="sm">
            <Plus className="w-3.5 h-3.5" />
            New group
          </Button>
        </Link>
      </div>

      {/* Groups */}
      {memberships.length === 0 ? (
        <Card>
          <CardContent className="pt-0 text-center py-16">
            <p className="text-muted-foreground mb-4">
              No groups yet. Create one to start tracking shared expenses.
            </p>
            <Link href="/dashboard/groups/new">
              <Button>
                <Plus className="w-3.5 h-3.5" />
                Create your first group
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {memberships.map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/groups/${m.group.id}`}
              className="block"
            >
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-border hover:bg-secondary/50 transition-colors duration-150">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-sm">{m.group.name}</span>
                    <Badge variant={m.role === "ADMIN" ? "default" : "secondary"}>
                      {m.role.toLowerCase()}
                    </Badge>
                  </div>
                  {m.group.description && (
                    <p className="text-xs text-[var(--color-tertiary)] mt-0.5 truncate">
                      {m.group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-4 shrink-0">
                  <span>{m.group._count.memberships} members</span>
                  <span>{m.group._count.expenses} expenses</span>
                  <span className="text-[var(--color-tertiary)]">{m.group.defaultCurrency}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
