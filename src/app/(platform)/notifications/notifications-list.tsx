"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Bell, GraduationCap, Video, DollarSign, UserCheck, Info, CheckCheck,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  ENROLLMENT: { icon: GraduationCap, color: "bg-primary/15 text-primary", label: "Enrollment" },
  LECTURE_REMINDER: { icon: Video, color: "bg-sky-500/15 text-sky-400", label: "Reminder" },
  RECORDING_AVAILABLE: { icon: Video, color: "bg-violet-500/15 text-violet-400", label: "Recording" },
  TEACHER_APPROVED: { icon: UserCheck, color: "bg-emerald-500/15 text-emerald-400", label: "Approval" },
  PAYOUT: { icon: DollarSign, color: "bg-orange-500/15 text-orange-400", label: "Payout" },
  SYSTEM: { icon: Info, color: "bg-muted text-muted-foreground", label: "System" },
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
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") params.delete("filter");
    else params.set("filter", filter);
    params.delete("page");
    startTransition(() => router.push(`/notifications?${params.toString()}`));
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    startTransition(() => router.push(`/notifications?${params.toString()}`));
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
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch {
        /* fail silently */
      }
    }
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className={cn("space-y-6", isPending && "opacity-70")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleMarkAllRead} disabled={isMarkingAll}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Pill filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${totalCount})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-border bg-card">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-bold">You&apos;re all caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No {currentFilter === "unread" ? "unread " : ""}notifications
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n, i) => {
              const cfg = typeConfig[n.type] || typeConfig.SYSTEM;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all hover:border-primary/20 ${
                    n.isRead ? "border-border bg-card" : "border-primary/25 bg-primary/[0.03]"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <Badge variant="outline" className="text-xs h-5 px-2">{cfg.label}</Badge>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {n.link && (
                    <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={(e) => { e.stopPropagation(); router.push(n.link!); }}>
                      View
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || isPending}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isPending}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
