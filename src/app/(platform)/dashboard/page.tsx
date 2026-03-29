import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  DollarSign,
  GraduationCap,
  Users,
  Video,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  iconBg,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardDescription className="text-sm">{label}</CardDescription>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon className={`h-4 w-4 ${iconClass}`} />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`flex items-center gap-1 text-xs ${
            trend === "up"
              ? "text-emerald-400"
              : trend === "down"
              ? "text-rose-400"
              : "text-muted-foreground"
          }`}
        >
          {trend === "up" && <TrendingUp className="h-3 w-3" />}
          {trend === "down" && <TrendingDown className="h-3 w-3" />}
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, role } = session.user;
  const firstName = name?.split(" ")[0] ?? "there";

  /* ── Student ──────────────────────────────────────────────────── */
  if (role === "STUDENT") {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back,{" "}
              <span className="text-primary">{firstName}</span>
            </h2>
            <p className="mt-1 text-muted-foreground">
              Here&apos;s a snapshot of your learning progress.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-xs px-3 py-1"
          >
            Student
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Enrolled courses"
            value="6"
            sub="2 in progress this week"
            icon={BookOpen}
            iconClass="text-emerald-400"
            iconBg="bg-emerald-500/10"
            trend="up"
          />
          <StatCard
            label="Upcoming lectures"
            value="4"
            sub="Next: Data Science · Tomorrow 10:00"
            icon={Calendar}
            iconClass="text-sky-400"
            iconBg="bg-sky-500/10"
            trend="neutral"
          />
          <StatCard
            label="Hours watched"
            value="38"
            sub="+6h from last week"
            icon={Clock}
            iconClass="text-violet-400"
            iconBg="bg-violet-500/10"
            trend="up"
          />
          <StatCard
            label="Assignments due"
            value="2"
            sub="Both due within 5 days"
            icon={ClipboardList}
            iconClass="text-orange-400"
            iconBg="bg-orange-500/10"
            trend="neutral"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming lectures</CardTitle>
                  <CardDescription>Your live sessions this week</CardDescription>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  title: "Linear Algebra — Office hours",
                  when: "Wed · 14:00",
                  badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
                },
                {
                  title: "Web Development — Live Q&A",
                  when: "Thu · 11:30",
                  badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
                },
                {
                  title: "Statistics — Midterm review",
                  when: "Fri · 09:00",
                  badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className="group flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-sm font-medium text-foreground">
                    {row.title}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${row.badge}`}
                  >
                    {row.when}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recently watched</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { title: "React Hooks deep dive", pct: 72, color: "bg-sky-500" },
                { title: "Probability fundamentals", pct: 45, color: "bg-violet-500" },
                { title: "Public speaking basics", pct: 100, color: "bg-emerald-500" },
              ].map((row) => (
                <div
                  key={row.title}
                  className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {row.title}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        row.pct === 100
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {row.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className={`h-1.5 rounded-full ${row.color} transition-all`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ── Teacher ──────────────────────────────────────────────────── */
  if (role === "TEACHER") {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Teacher Dashboard
            </h2>
            <p className="mt-1 text-muted-foreground">
              Overview of your courses, learners, and payouts.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs px-3 py-1"
          >
            Teacher
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Earnings (30 days)"
            value="$4,280"
            sub="+12% vs previous period"
            icon={DollarSign}
            iconClass="text-emerald-400"
            iconBg="bg-emerald-500/10"
            trend="up"
          />
          <StatCard
            label="Active courses"
            value="5"
            sub="3 published · 2 drafts"
            icon={BookOpen}
            iconClass="text-sky-400"
            iconBg="bg-sky-500/10"
            trend="neutral"
          />
          <StatCard
            label="Total students"
            value="842"
            sub="Across all courses"
            icon={Users}
            iconClass="text-violet-400"
            iconBg="bg-violet-500/10"
            trend="up"
          />
          <StatCard
            label="Upcoming live lectures"
            value="3"
            sub="Next session in 2 days"
            icon={Video}
            iconClass="text-orange-400"
            iconBg="bg-orange-500/10"
            trend="neutral"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Earnings overview</CardTitle>
                  <CardDescription>Revenue breakdown this period</CardDescription>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Course sales", value: "$3,100", pct: 72, color: "bg-emerald-500" },
                { label: "Live sessions", value: "$980", pct: 23, color: "bg-sky-500" },
                { label: "Tips & bundles", value: "$200", pct: 5, color: "bg-violet-500" },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground">{row.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className={`h-1.5 rounded-full ${row.color}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border/60 flex justify-between text-sm">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary">$4,280</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Upcoming lectures</CardTitle>
                  <CardDescription>Your scheduled live events</CardDescription>
                </div>
                <Video className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  title: "Advanced React Patterns",
                  when: "Mar 26 · 15:00",
                  enrolled: "48 enrolled",
                },
                {
                  title: "UI Design critique",
                  when: "Mar 28 · 10:00",
                  enrolled: "22 enrolled",
                },
                {
                  title: "Career AMA",
                  when: "Mar 30 · 18:00",
                  enrolled: "120 enrolled",
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {row.title}
                    </p>
                    <span className="text-xs text-primary font-medium">
                      {row.enrolled}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.when}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ── Admin ────────────────────────────────────────────────────── */
  if (role === "ADMIN") {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Admin Dashboard
            </h2>
            <p className="mt-1 text-muted-foreground">
              High-level metrics for the whole platform.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs px-3 py-1"
          >
            Admin
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value="12,480"
            sub="+320 new this month"
            icon={Users}
            iconClass="text-sky-400"
            iconBg="bg-sky-500/10"
            trend="up"
          />
          <StatCard
            label="Total courses"
            value="384"
            sub="312 published"
            icon={BookOpen}
            iconClass="text-violet-400"
            iconBg="bg-violet-500/10"
            trend="neutral"
          />
          <StatCard
            label="Platform revenue (YTD)"
            value="$1.2M"
            sub="Net of refunds"
            icon={DollarSign}
            iconClass="text-emerald-400"
            iconBg="bg-emerald-500/10"
            trend="up"
          />
          <StatCard
            label="Active teachers"
            value="186"
            sub="12 pending approval"
            icon={GraduationCap}
            iconClass="text-orange-400"
            iconBg="bg-orange-500/10"
            trend="neutral"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 bg-card lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Platform health</CardTitle>
                  <CardDescription>Snapshot for operations</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Support tickets",
                  value: "14 open",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10 border-orange-500/20",
                },
                {
                  label: "Live lectures today",
                  value: "27",
                  color: "text-sky-400",
                  bg: "bg-sky-500/10 border-sky-500/20",
                },
                {
                  label: "Avg. completion rate",
                  value: "68%",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  label: "Churn (30d)",
                  value: "2.1%",
                  color: "text-rose-400",
                  bg: "bg-rose-500/10 border-rose-500/20",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg border ${item.bg} p-4`}
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Review pending teacher applications",
                "Audit flagged transactions",
                "Export monthly revenue report",
                "Moderate flagged course content",
              ].map((action) => (
                <button
                  key={action}
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 text-left text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {action}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
