"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Clock,
  Video,
  ShieldCheck,
  DollarSign,
  Info,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsListProps {
  initialNotifications: Notification[];
  totalPages: number;
  currentPage: number;
  currentFilter: string;
  unreadCount: number;
  totalCount: number;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  ENROLLMENT: BookOpen,
  LECTURE_REMINDER: Clock,
  RECORDING_AVAILABLE: Video,
  TEACHER_APPROVED: ShieldCheck,
  PAYOUT: DollarSign,
  SYSTEM: Info,
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] || Bell;
}

const TYPE_LABELS: Record<string, string> = {
  ENROLLMENT: "Enrollment",
  LECTURE_REMINDER: "Reminder",
  RECORDING_AVAILABLE: "Recording",
  TEACHER_APPROVED: "Approved",
  PAYOUT: "Payout",
  SYSTEM: "System",
};

export function NotificationsList({
  initialNotifications,
  totalPages,
  currentPage,
  currentFilter,
  unreadCount,
  totalCount,
}: NotificationsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/notifications?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    startTransition(() => {
      router.push(`/notifications?${params.toString()}`);
    });
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Failed to mark notifications as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch {
        /* fail silently */
      }
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className={cn("space-y-4", isPending && "opacity-70")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={currentFilter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-1.5">
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
          <Bell className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">
            {currentFilter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
          <p className="mt-1 text-xs">
            {currentFilter === "unread"
              ? "You're all caught up!"
              : "Notifications will appear here when there's activity."}
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex w-full gap-4 p-4 text-left transition-colors hover:bg-muted/50",
                  !notification.isRead && "bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    notification.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {TYPE_LABELS[notification.type] || notification.type}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(
                          new Date(notification.createdAt),
                          { addSuffix: true }
                        )}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
