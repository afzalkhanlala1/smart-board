import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsList } from "./notifications-list";

interface PageProps {
  searchParams: { filter?: string; page?: string };
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const filter = searchParams.filter ?? "all";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const pageSize = 20;

  const where = {
    userId: session.user.id,
    ...(filter === "unread" && { isRead: false }),
  };

  const [notifications, totalCount, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    db.notification.count({ where }),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <NotificationsList
        initialNotifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
        totalPages={totalPages}
        currentPage={page}
        currentFilter={filter}
        unreadCount={unreadCount}
        totalCount={totalCount}
      />
    </div>
  );
}
