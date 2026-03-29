import { redirect } from "next/navigation";
import {
  DollarSign,
  Wallet,
  CreditCard,
  CalendarClock,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EarningsChart } from "@/components/dashboard/earnings-chart";

const PAYMENT_STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "destructive"
> = {
  PENDING: "warning",
  COMPLETED: "success",
  REFUNDED: "destructive",
};

function generateMonthlyData(
  transactions: Array<{ createdAt: Date; teacherEarning: { toNumber(): number } }>
) {
  const monthMap = new Map<string, number>();

  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthMap.set(key, 0);
  }

  for (const tx of transactions) {
    const d = new Date(tx.createdAt);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) ?? 0) + tx.teacherEarning.toNumber());
    }
  }

  return Array.from(monthMap.entries()).map(([month, earnings]) => ({
    month,
    earnings: Math.round(earnings * 100) / 100,
  }));
}

export default async function EarningsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  const [earningRecord, transactions] = await Promise.all([
    db.teacherEarning.findUnique({
      where: { teacherId: userId },
    }),
    db.transaction.findMany({
      where: {
        course: { teacherId: userId },
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { title: true } },
        student: { select: { name: true, email: true } },
      },
    }),
  ]);

  const totalEarned = earningRecord?.totalEarned.toNumber() ?? 0;
  const pendingBalance = earningRecord?.pendingBalance.toNumber() ?? 0;
  const paidOut = earningRecord?.paidOut.toNumber() ?? 0;
  const lastPayout = earningRecord?.lastPayoutDate;

  const recentTransactions = transactions.slice(0, 20);
  const chartData = generateMonthlyData(transactions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Track your revenue, payouts, and transaction history.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Earned"
          value={formatPrice(totalEarned)}
          description="Lifetime earnings after fees"
          icon={DollarSign}
        />
        <StatsCard
          title="Pending Balance"
          value={formatPrice(pendingBalance)}
          description="Available for payout"
          icon={Wallet}
        />
        <StatsCard
          title="Paid Out"
          value={formatPrice(paidOut)}
          description="Total transferred to you"
          icon={CreditCard}
        />
        <StatsCard
          title="Last Payout"
          value={lastPayout ? formatDate(lastPayout) : "N/A"}
          description="Most recent transfer date"
          icon={CalendarClock}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payout</h2>
          <p className="text-sm text-muted-foreground">
            Minimum payout threshold is $50.00
          </p>
        </div>
        <Button disabled={pendingBalance < 50} size="lg">
          Request Payout
        </Button>
      </div>

      <EarningsChart data={chartData} />

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Recent completed transactions for your courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Your Earning</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {tx.course.title}
                      </TableCell>
                      <TableCell>{tx.student.name}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(tx.amount.toNumber())}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(tx.platformFee.toNumber())}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(tx.teacherEarning.toNumber())}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PAYMENT_STATUS_VARIANT[tx.status]}>
                          {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No transactions yet. Earnings will appear here once students
                purchase your courses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
