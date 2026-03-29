"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  Calendar,
  PlusCircle,
  DollarSign,
  Users,
  BarChart3,
  ClipboardList,
  LogOut,
  ChevronLeft,
  MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = { href: string; label: string; icon: LucideIcon };

const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Browse Courses", icon: BookOpen },
  { href: "/my-courses", label: "My Courses", icon: GraduationCap },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const teacherNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/courses", label: "My Courses", icon: BookOpen },
  { href: "/create-course", label: "Create Course", icon: PlusCircle },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/earnings", label: "Earnings", icon: DollarSign },
];

const adminNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teachers", label: "Teachers", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: ClipboardList },
  { href: "/admin/transactions", label: "Transactions", icon: DollarSign },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function navForRole(role: string | undefined): NavItem[] {
  switch (role) {
    case "ADMIN":
      return adminNav;
    case "TEACHER":
      return teacherNav;
    case "STUDENT":
    default:
      return studentNav;
  }
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user;
  const items = navForRole(user?.role);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/60 bg-card transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[4.5rem]" : "w-72"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/60 px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 truncate"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary shadow-md shadow-primary/30">
              <MonitorPlay className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              SmartBoard
            </span>
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground", collapsed && "mx-auto")}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border/60 p-2.5">
        {status === "loading" && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg bg-secondary/50 p-2",
              collapsed && "justify-center"
            )}
          >
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            {!collapsed && (
              <div className="min-w-0 flex-1 space-y-1">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-2 w-16 animate-pulse rounded bg-muted" />
              </div>
            )}
          </div>
        )}

        {status === "unauthenticated" && (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">{collapsed ? "In" : "Sign in"}</Link>
          </Button>
        )}

        {status === "authenticated" && user && (
          <div className={cn("flex flex-col gap-1", collapsed && "items-center")}>
            <div
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-lg p-2",
                collapsed && "justify-center p-0"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size={collapsed ? "icon" : "sm"}
              className={cn(
                "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                collapsed && "justify-center h-8 w-8"
              )}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="ml-2">Sign out</span>}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
