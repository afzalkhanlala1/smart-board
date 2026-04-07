import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EarningsView } from "@/components/dashboard/earnings-view";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default async function EarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TEACHER") redirect("/dashboard");

  const userId = session.user.id;

  const [earningRecord, transactions] = await Promise.all([
    db.teacherEarning.findUnique({ where: { teacherId: userId } }),
    db.transaction.findMany({
      where: { course: { teacherId: userId }, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true } },
        student: { select: { name: true } },
      },
    }),
  ]);

  const totalEarned = earningRecord?.totalEarned.toNumber() ?? 0;
  const pendingBalance = earningRecord?.pendingBalance.toNumber() ?? 0;
  const paidOut = earningRecord?.paidOut.toNumber() ?? 0;
  const lastPayout = earningRecord?.lastPayoutDate ? format(earningRecord.lastPayoutDate, "MMM d") : null;

  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const earnings = transactions
      .filter((t) => t.createdAt >= mStart && t.createdAt <= mEnd)
      .reduce((s, t) => s + t.teacherEarning.toNumber(), 0);
    return { month: format(month, "MMM"), earnings: Math.round(earnings * 100) / 100 };
  });

  const txData = transactions.slice(0, 30).map((t) => ({
    id: t.id,
    createdAt: format(t.createdAt, "MMM d, yyyy"),
    courseTitle: t.course.title,
    studentName: t.student.name ?? "Unknown",
    amount: t.amount.toNumber(),
    teacherEarning: t.teacherEarning.toNumber(),
    status: t.status,
  }));

  return (
    <EarningsView
      totalEarned={totalEarned}
      pendingBalance={pendingBalance}
      paidOut={paidOut}
      lastPayout={lastPayout}
      transactions={txData}
      chartData={chartData}
      earningId={earningRecord?.id ?? null}
    />
  );
}
