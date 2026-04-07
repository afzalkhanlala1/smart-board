"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Percent, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GradientStatCard } from "./gradient-stat-card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(152, 65%, 48%)", "hsl(199, 89%, 48%)", "hsl(262, 83%, 58%)"];

interface MonthlyData {
  month: string;
  revenue: number;
  fees: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface AdminReportsViewProps {
  grossRevenue: number;
  platformFees: number;
  teacherPayouts: number;
  refunded: number;
  monthlyData: MonthlyData[];
  statusData: StatusData[];
}

export function AdminReportsView({
  grossRevenue, platformFees, teacherPayouts, refunded,
  monthlyData, statusData,
}: AdminReportsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Financial Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform revenue analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard label="Gross Revenue" value={`$${grossRevenue.toFixed(2)}`} icon={DollarSign} gradient="from-emerald-500/20 to-emerald-500/5" accent="text-emerald-400" delay={0} />
        <GradientStatCard label="Platform Fees" value={`$${platformFees.toFixed(2)}`} icon={TrendingUp} gradient="from-sky-500/20 to-sky-500/5" accent="text-sky-400" delay={0.07} />
        <GradientStatCard label="Teacher Payouts" value={`$${teacherPayouts.toFixed(2)}`} icon={Percent} gradient="from-violet-500/20 to-violet-500/5" accent="text-violet-400" delay={0.14} />
        <GradientStatCard label="Refunded" value={`$${refunded.toFixed(2)}`} icon={ArrowDownRight} gradient="from-rose-500/20 to-rose-500/5" accent="text-rose-400" delay={0.21} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Revenue Trend</h3>
            <Badge variant="outline" className="text-xs">Last 6 months</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} name="Revenue ($)" />
                <Area type="monotone" dataKey="fees" stroke="hsl(199, 89%, 48%)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Platform Fees ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold mb-4">Transaction Mix</h3>
          <div className="h-64">
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 space-y-2">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
