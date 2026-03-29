"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronRight, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  courses: "Courses",
  "my-courses": "My Courses",
  cart: "Cart",
  calendar: "Calendar",
  teacher: "Teacher",
  "create-course": "Create Course",
  schedule: "Schedule",
  earnings: "Earnings",
  admin: "Admin",
  teachers: "Teachers",
  transactions: "Transactions",
  reports: "Reports",
  profile: "Profile",
  settings: "Settings",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  TEACHER: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  STUDENT: "bg-primary/15 text-primary border-primary/20",
};

function titleFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "Home";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Home";
  const last = parts[parts.length - 1];
  return (
    SEGMENT_LABELS[last] ??
    last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({
      href: acc,
      label:
        SEGMENT_LABELS[seg] ??
        seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  }

  const pageTitle = titleFromPath(pathname);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const roleColorClass =
    user?.role ? (ROLE_COLOR[user.role] ?? ROLE_COLOR.STUDENT) : ROLE_COLOR.STUDENT;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border/60 bg-background/90 px-6 backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        <nav
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Platform
          </Link>
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-foreground">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="transition-colors hover:text-foreground"
                >
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-0.5 truncate text-base font-bold tracking-tight text-foreground">
          {pageTitle}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 ring-2 ring-border/60 hover:ring-primary/30 transition-all"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                {user?.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 border-border/60 bg-card" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold leading-none text-foreground">
                  {user?.name ?? "Guest"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {user?.role && (
                  <Badge
                    variant="outline"
                    className={`w-fit text-xs capitalize px-2 py-0.5 border ${roleColorClass}`}
                  >
                    {user.role.toLowerCase()}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
