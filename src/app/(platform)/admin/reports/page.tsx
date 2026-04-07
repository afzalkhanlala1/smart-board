import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { AdminReportsView } from "@/components/dashboard/admin-reports-view";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [revenueAgg, allTransactions, topCourses, topTeachers] = await Promise.all([
    db.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true, platformFee: true, teacherEarning: true },
    }),
    db.transaction.findMany({
      select: { createdAt: true, platformFee: true, amount: true, teacherEarning: true, status: true },
    }),
    db.course.findMany({
      where: { transactions: { some: { status: "COMPLETED" } } },
      orderBy: { transactions: { _count: "desc" } },
      take: 10,
      select: {
        id: true, title: true,
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true } },
        transactions: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    }),
    db.user.findMany({
      where: { role: "TEACHER", isApproved: true, teacherEarning: { isNot: null } },
      orderBy: { teacherEarning: { totalEarned: "desc" } },
      take: 10,
      select: {
        id: true, name: true, email: true,
        teacherEarning: { select: { totalEarned: true, pendingBalance: true, paidOut: true } },
        _count: { select: { courses: true } },
      },
    }),
  ]);

  const grossRevenue = revenueAgg._sum.amount?.toNumber() ?? 0;
  const platformFees = revenueAgg._sum.platformFee?.toNumber() ?? 0;
  const teacherPayouts = revenueAgg._sum.teacherEarning?.toNumber() ?? 0;

  const completed = allTransactions.filter((t) => t.status === "COMPLETED");
  const refunded = allTransactions
    .filter((t) => t.status === "REFUNDED")
    .reduce((s, t) => s + (t.amount?.toNumber() ?? 0), 0);

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const monthTx = completed.filter((t) => t.createdAt >= mStart && t.createdAt <= mEnd);
    return {
      month: format(month, "MMM"),
      revenue: Math.round(monthTx.reduce((s, t) => s + (t.amount?.toNumber() ?? 0), 0) * 100) / 100,
      fees: Math.round(monthTx.reduce((s, t) => s + (t.platformFee?.toNumber() ?? 0), 0) * 100) / 100,
    };
  });

  const statusData = [
    { name: "Completed", value: allTransactions.filter((t) => t.status === "COMPLETED").length },
    { name: "Pending", value: allTransactions.filter((t) => t.status === "PENDING").length },
    { name: "Refunded", value: allTransactions.filter((t) => t.status === "REFUNDED").length },
  ].filter((d) => d.value > 0);

  const sortedTopCourses = topCourses
    .map((c) => ({ ...c, revenue: c.transactions.reduce((s, tx) => s + tx.amount.toNumber(), 0) }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-8">
      <AdminReportsView
        grossRevenue={grossRevenue}
        platformFees={platformFees}
        teacherPayouts={teacherPayouts}
        refunded={refunded}
        monthlyData={monthlyData}
        statusData={statusData}
      />

      {/* Top Courses */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-bold">Top Courses by Revenue</h3>
          <p className="text-sm text-muted-foreground mt-1">Highest earning courses on the platform</p>
        </div>
        {sortedTopCourses.length > 0 ? (
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
                  <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{course.title}</TableCell>
                  <TableCell className="text-muted-foreground">{course.teacher.name}</TableCell>
                  <TableCell className="text-center">{course._count.enrollments}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(course.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No revenue data yet.</p>
        )}
      </div>

      {/* Top Teachers */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-bold">Top Teachers by Earnings</h3>
          <p className="text-sm text-muted-foreground mt-1">Highest earning teachers on the platform</p>
        </div>
        {topTeachers.length > 0 ? (
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
                  <TableCell className="text-muted-foreground font-medium">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                  <TableCell className="text-center">{teacher._count.courses}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(teacher.teacherEarning?.totalEarned.toNumber() ?? 0)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatPrice(teacher.teacherEarning?.pendingBalance.toNumber() ?? 0)}</TableCell>
                  <TableCell className="text-right">{formatPrice(teacher.teacherEarning?.paidOut.toNumber() ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No teacher earnings data yet.</p>
        )}
      </div>
    </div>
  );
}
