import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { GroupTabs } from "@/components/groups/group-tabs";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
  const { groupId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, isGuest: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      expenses: {
        where: { status: "ACTIVE" },
        include: {
          splits: {
            include: { user: { select: { id: true, name: true } } },
          },
          paidBy: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { date: "desc" },
        take: 50,
      },
      settlements: {
        include: {
          fromUser: { select: { id: true, name: true, avatarUrl: true } },
          toUser: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!group) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-display-md">{group.name}</h1>
        {group.description && (
          <p className="text-body-md text-muted mt-1">
            {group.description}
          </p>
        )}
      </div>

      <GroupTabs group={group} currentUserId={session.user.id} />
    </div>
  );
}
