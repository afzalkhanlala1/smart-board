"use client";

import { motion } from "framer-motion";
import { DollarSign, Wallet, CreditCard, Calendar, ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GradientStatCard } from "./gradient-stat-card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  createdAt: string;
  courseTitle: string;
  studentName: string;
  amount: number;
  teacherEarning: number;
  status: string;
}

interface EarningsViewProps {
  totalEarned: number;
  pendingBalance: number;
  paidOut: number;
  lastPayout: string | null;
  transactions: Transaction[];
  chartData: Array<{ month: string; earnings: number }>;
  earningId: string | null;
}

const statusColors: Record<string, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-0",
  PENDING: "bg-orange-500/15 text-orange-400 border-0",
  REFUNDED: "bg-rose-500/15 text-rose-400 border-0",
};

export function EarningsView({ totalEarned, pendingBalance, paidOut, lastPayout, transactions, chartData, earningId }: EarningsViewProps) {
  const router = useRouter();

  const requestPayout = async () => {
    if (pendingBalance < 50) {
      toast.error("Minimum payout threshold is $50");
      return;
    }
    try {
      const res = await fetch("/api/earnings/payout", { method: "POST" });
      if (res.ok) {
        toast.success("Payout requested successfully");
        router.refresh();
      } else {
        toast.error("Failed to request payout");
      }
    } catch {
      toast.error("Failed to request payout");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Earnings</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your revenue and request payouts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard label="Total Earned" value={`$${totalEarned.toFixed(2)}`} icon={TrendingUp} gradient="from-emerald-500/20 to-emerald-500/5" accent="text-emerald-400" delay={0} />
        <GradientStatCard label="Pending Balance" value={`$${pendingBalance.toFixed(2)}`} icon={Wallet} gradient="from-orange-500/20 to-orange-500/5" accent="text-orange-400" delay={0.07}>
          {pendingBalance >= 50 && (
            <Button size="sm" className="mt-3 h-7 text-xs gap-1 w-full" onClick={requestPayout}>
              <ArrowUpRight className="h-3 w-3" /> Request Payout
            </Button>
          )}
        </GradientStatCard>
        <GradientStatCard label="Paid Out" value={`$${paidOut.toFixed(2)}`} icon={CreditCard} gradient="from-sky-500/20 to-sky-500/5" accent="text-sky-400" delay={0.14} />
        <GradientStatCard label="Last Payout" value={lastPayout ?? "Never"} icon={Calendar} gradient="from-violet-500/20 to-violet-500/5" accent="text-violet-400" delay={0.21} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Earnings Over Time</h3>
          <Badge variant="outline" className="text-xs">Last 6 months</Badge>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earningsGradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
              <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="url(#earningsGradNew)" strokeWidth={2} name="Earnings ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="font-bold">Transaction History</h3>
          <Badge variant="outline">{transactions.length} total</Badge>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Date</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Your Cut</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs text-muted-foreground">{t.createdAt}</TableCell>
                  <TableCell className="text-sm font-medium">{t.courseTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.studentName}</TableCell>
                  <TableCell className="font-semibold">${t.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-primary">${t.teacherEarning.toFixed(2)}</TableCell>
                  <TableCell><Badge className={`text-xs ${statusColors[t.status] || ""}`}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
