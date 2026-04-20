import { redirect } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  Building2,
  CreditCard,
  ArrowLeft,
  ArrowRight,
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

const PAGE_SIZE = 20;

const PAYMENT_STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "destructive"
> = {
  PENDING: "warning",
  COMPLETED: "success",
  REFUNDED: "destructive",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [transactions, totalCount, aggregates] = await Promise.all([
    db.transaction.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        student: { select: { name: true } },
        course: {
          select: {
            title: true,
            teacher: { select: { name: true } },
          },
        },
      },
    }),
    db.transaction.count(),
    db.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: {
        amount: true,
        platformFee: true,
        teacherEarning: true,
      },
    }),
  ]);

  const totalRevenue = aggregates._sum.amount?.toNumber() ?? 0;
  const totalCommission = aggregates._sum.platformFee?.toNumber() ?? 0;
  const totalPayouts = aggregates._sum.teacherEarning?.toNumber() ?? 0;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Complete transaction history across the platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Revenue"
          value={formatPrice(totalRevenue)}
          description="All completed transactions"
          icon={DollarSign}
        />
        <StatsCard
          title="Platform Commission"
          value={formatPrice(totalCommission)}
          description="15% of each transaction"
          icon={Building2}
        />
        <StatsCard
          title="Teacher Payouts"
          value={formatPrice(totalPayouts)}
          description="Earned by teachers"
          icon={CreditCard}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Log</CardTitle>
          <CardDescription>
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, totalCount)} of{" "}
            {totalCount} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">
                        Teacher Earning
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>{tx.student.name}</TableCell>
                        <TableCell className="max-w-[180px] truncate font-medium">
                          {tx.course.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.course.teacher.name}
                        </TableCell>
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
                            {tx.status.charAt(0) +
                              tx.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={`/admin/transactions?page=${currentPage - 1}`}
                      >
                        <Button variant="outline" size="sm">
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    )}
                    {currentPage < totalPages ? (
                      <Link
                        href={`/admin/transactions?page=${currentPage + 1}`}
                      >
                        <Button variant="outline" size="sm">
                          Next
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No transactions recorded yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
