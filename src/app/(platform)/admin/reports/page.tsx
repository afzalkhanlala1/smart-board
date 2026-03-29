import { redirect } from "next/navigation";
import {
  Users,
  BookOpen,
  DollarSign,
  Building2,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

function buildMonthlyRevenueData(
  transactions: Array<{
    createdAt: Date;
    platformFee: { toNumber(): number };
    teacherEarning: { toNumber(): number };
  }>
) {
  const monthMap = new Map<string, { revenue: number; commission: number }>();

  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthMap.set(key, { revenue: 0, commission: 0 });
  }

  for (const tx of transactions) {
    const d = new Date(tx.createdAt);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const entry = monthMap.get(key);
    if (entry) {
      entry.revenue += tx.teacherEarning.toNumber();
      entry.commission += tx.platformFee.toNumber();
    }
  }

  return Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue * 100) / 100,
    commission: Math.round(data.commission * 100) / 100,
  }));
}

export default async function AdminReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    userCounts,
    courseCount,
    revenueAgg,
    topCourses,
    topTeachers,
    completedTransactions,
  ] = await Promise.all([
    db.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    db.course.count(),
    db.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: {
        amount: true,
        platformFee: true,
        teacherEarning: true,
      },
    }),
    db.course.findMany({
      where: {
        transactions: { some: { status: "COMPLETED" } },
      },
      orderBy: {
        transactions: { _count: "desc" },
      },
      take: 10,
      select: {
        id: true,
        title: true,
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    }),
    db.user.findMany({
      where: {
        role: "TEACHER",
        isApproved: true,
        teacherEarning: { isNot: null },
      },
      orderBy: {
        teacherEarning: { totalEarned: "desc" },
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        teacherEarning: {
          select: { totalEarned: true, pendingBalance: true, paidOut: true },
        },
        _count: { select: { courses: true } },
      },
    }),
    db.transaction.findMany({
      where: { status: "COMPLETED" },
      select: {
        createdAt: true,
        platformFee: true,
        teacherEarning: true,
      },
    }),
  ]);

  const roleMap = Object.fromEntries(
    userCounts.map((r) => [r.role, r._count.id])
  );
  const totalUsers =
    (roleMap.ADMIN ?? 0) + (roleMap.TEACHER ?? 0) + (roleMap.STUDENT ?? 0);

  const totalRevenue = revenueAgg._sum.amount?.toNumber() ?? 0;
  const totalCommission = revenueAgg._sum.platformFee?.toNumber() ?? 0;

  const chartData = buildMonthlyRevenueData(completedTransactions);

  const sortedTopCourses = topCourses
    .map((c) => ({
      ...c,
      revenue: c.transactions.reduce(
        (sum, tx) => sum + tx.amount.toNumber(),
        0
      ),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Reports</h1>
        <p className="text-muted-foreground">
          Key metrics and analytics for the platform.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          description={`${roleMap.STUDENT ?? 0} students, ${roleMap.TEACHER ?? 0} teachers, ${roleMap.ADMIN ?? 0} admins`}
          icon={Users}
        />
        <StatsCard
          title="Total Courses"
          value={courseCount}
          icon={BookOpen}
        />
        <StatsCard
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          description="All completed transactions"
          icon={DollarSign}
        />
        <StatsCard
          title="Platform Commission"
          value={formatPrice(totalCommission)}
          description="15% of each sale"
          icon={Building2}
        />
      </div>

      {/* Role breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roleMap.STUDENT ?? 0}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roleMap.TEACHER ?? 0}</p>
              <p className="text-xs text-muted-foreground">Teachers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roleMap.ADMIN ?? 0}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData} />

      {/* Top Courses by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Top Courses by Revenue</CardTitle>
          <CardDescription>Highest earning courses on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTopCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-center">Enrollments</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTopCourses.map((course, idx) => (
                    <TableRow key={course.id}>
                      <TableCell className="text-muted-foreground font-medium">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {course.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {course.teacher.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {course._count.enrollments}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(course.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No revenue data yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Teachers by Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Teachers by Earnings</CardTitle>
          <CardDescription>Highest earning teachers on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {topTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Courses</TableHead>
                    <TableHead className="text-right">Total Earned</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Paid Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTeachers.map((teacher, idx) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="text-muted-foreground font-medium">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {teacher.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher.email}
                      </TableCell>
                      <TableCell className="text-center">
                        {teacher._count.courses}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(
                          teacher.teacherEarning?.totalEarned.toNumber() ?? 0
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(
                          teacher.teacherEarning?.pendingBalance.toNumber() ?? 0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(
                          teacher.teacherEarning?.paidOut.toNumber() ?? 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No teacher earnings data yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
