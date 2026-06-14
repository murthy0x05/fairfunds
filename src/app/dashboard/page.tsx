import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Users,
  Receipt,
  ArrowRight,
  Upload,
  TrendingUp,
  Coins,
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your expense overview at a glance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Active Groups",
            value: totalGroups,
            icon: Users,
            color: "from-indigo-500 to-purple-500",
          },
          {
            label: "Total Expenses",
            value: totalExpenses,
            icon: Receipt,
            color: "from-emerald-500 to-teal-500",
          },
          {
            label: "Import Ready",
            value: "CSV",
            icon: Upload,
            color: "from-amber-500 to-orange-500",
          },
        ].map((stat, i) => (
          <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Groups</h2>
          <Link href="/dashboard/groups/new">
            <Button size="sm">
              <Users className="w-4 h-4" />
              New Group
            </Button>
          </Link>
        </div>

        {memberships.length === 0 ? (
          <Card>
            <CardContent className="pt-0 text-center py-12">
              <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a group to start tracking shared expenses.
              </p>
              <Link href="/dashboard/groups/new">
                <Button>
                  <Users className="w-4 h-4" />
                  Create Your First Group
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map((m, i) => (
              <Link
                key={m.id}
                href={`/dashboard/groups/${m.group.id}`}
                className="block"
              >
                <Card
                  className="glass-card-hover cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${(i + 3) * 80}ms` }}
                >
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{m.group.name}</h3>
                        {m.group.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {m.group.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={m.role === "ADMIN" ? "default" : "secondary"}>
                        {m.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {m.group._count.memberships} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5" />
                        {m.group._count.expenses} expenses
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {m.group.defaultCurrency}
                      </span>
                    </div>
                    <div className="flex justify-end mt-3">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
