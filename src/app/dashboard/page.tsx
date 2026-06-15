import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ExpenseTrendChart } from "@/components/dashboard/expense-trend-chart";
import { RecentActivity, ActivityItem } from "@/components/dashboard/recent-activity";
import { TopGroups } from "@/components/dashboard/top-groups";
import { SystemStatus } from "@/components/dashboard/system-status";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  // Fetch groups user is part of
  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true, group: { select: { defaultCurrency: true, name: true } } },
  });
  const groupIds = memberships.map((m) => m.groupId);
  const primaryCurrency = memberships[0]?.group.defaultCurrency || "INR";

  // 1. Monthly Spending
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlySplits = await prisma.expenseSplit.aggregate({
    where: {
      userId,
      expense: { date: { gte: startOfMonth }, status: "ACTIVE" }
    },
    _sum: { amount: true }
  });
  const monthlySpending = monthlySplits._sum.amount || 0;

  // 2. Outstanding Balance
  const paid = await prisma.expense.aggregate({
    where: { paidById: userId, status: "ACTIVE" },
    _sum: { amount: true }
  }).then(r => r._sum.amount || 0);

  const owed = await prisma.expenseSplit.aggregate({
    where: { userId, expense: { status: "ACTIVE" } },
    _sum: { amount: true }
  }).then(r => r._sum.amount || 0);

  const settledOut = await prisma.settlement.aggregate({
    where: { fromUserId: userId },
    _sum: { amount: true }
  }).then(r => r._sum.amount || 0);

  const settledIn = await prisma.settlement.aggregate({
    where: { toUserId: userId },
    _sum: { amount: true }
  }).then(r => r._sum.amount || 0);

  const outstandingBalance = paid - owed - settledOut + settledIn;

  // 3. Active Members (Unique users in same groups)
  const activeMembersCount = await prisma.groupMembership.count({
    where: { groupId: { in: groupIds }, leftAt: null }
  });

  // 4. Pending Anomalies
  const pendingAnomalies = await prisma.importAnomaly.findMany({
    where: { 
      resolution: "PENDING",
      importBatch: { groupId: { in: groupIds } }
    },
    include: { importBatch: true },
    take: 5,
    orderBy: { createdAt: "desc" }
  });

  const totalPendingAnomalies = await prisma.importAnomaly.count({
    where: { 
      resolution: "PENDING",
      importBatch: { groupId: { in: groupIds } }
    }
  });

  // 5. Expense Trend Chart (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentExpenses = await prisma.expense.findMany({
    where: { groupId: { in: groupIds }, status: "ACTIVE", date: { gte: thirtyDaysAgo } },
    select: { date: true, amount: true }
  });

  // Group by date string
  const trendMap = new Map<string, number>();
  recentExpenses.forEach(e => {
    const dStr = e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendMap.set(dStr, (trendMap.get(dStr) || 0) + e.amount);
  });
  
  // Create last 30 days array
  const trendData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendData.push({
      date: dStr,
      amount: trendMap.get(dStr) || 0
    });
  }

  // 6. Recent Activity
  const activityExpenses = await prisma.expense.findMany({
    where: { groupId: { in: groupIds }, status: "ACTIVE" },
    include: { group: true, paidBy: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const activitySettlements = await prisma.settlement.findMany({
    where: { groupId: { in: groupIds } },
    include: { group: true, fromUser: true, toUser: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const rawActivities: ActivityItem[] = [
    ...activityExpenses.map(e => ({
      id: `exp-${e.id}`,
      type: "expense" as const,
      title: e.description,
      description: `${e.paidBy.name} added in ${e.group.name}`,
      amount: e.amount,
      currency: e.currency,
      date: e.createdAt,
      actualDate: e.date
    })),
    ...activitySettlements.map(s => ({
      id: `set-${s.id}`,
      type: "settlement" as const,
      title: "Settlement",
      description: `${s.fromUser.name} paid ${s.toUser.name}`,
      amount: s.amount,
      currency: s.currency,
      date: s.createdAt,
      actualDate: s.date
    }))
  ];
  
  const activities = rawActivities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  // 7. Top Groups Spending
  const groupSpending = await prisma.expense.groupBy({
    by: ['groupId'],
    where: { groupId: { in: groupIds }, status: "ACTIVE" },
    _sum: { amount: true }
  });

  const totalGroupSpending = groupSpending.reduce((acc, g) => acc + (g._sum.amount || 0), 0);
  const topGroups = groupSpending
    .map(g => {
      const gName = memberships.find(m => m.groupId === g.groupId)?.group.name || "Unknown";
      const amt = g._sum.amount || 0;
      return {
        name: gName,
        amount: amt,
        percentage: totalGroupSpending > 0 ? (amt / totalGroupSpending) * 100 : 0,
        currency: primaryCurrency
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 8. Import Health
  const recentBatches = await prisma.importBatch.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const importStats = recentBatches.reduce((acc, b) => {
    acc.total += b.totalRows;
    acc.valid += b.validRows;
    acc.error += b.errorRows;
    acc.skipped += b.skippedRows;
    return acc;
  }, { total: 0, valid: 0, error: 0, skipped: 0 });

  const mappedAnomalies = pendingAnomalies.map(a => ({
    id: a.id,
    description: a.description,
    severity: a.severity,
    groupId: a.importBatch.groupId || ""
  }));

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <h1 className="text-display-md">Overview</h1>

      <OverviewCards 
        monthlySpending={monthlySpending}
        outstandingBalance={outstandingBalance}
        activeMembers={activeMembersCount}
        pendingAnomalies={totalPendingAnomalies}
        currency={primaryCurrency}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="h-[340px]">
            <ExpenseTrendChart data={trendData} currency={primaryCurrency} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TopGroups groups={topGroups} />
            <SystemStatus importStats={importStats} anomalies={mappedAnomalies} />
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}
