"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, BookOpen, TrendingUp, UserCheck, ChevronRight, Shield, BarChart3, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GradientStatCard } from "./gradient-stat-card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface AdminDashboardProps {
  totalUsers: number;
  totalCourses: number;
  platformRevenue: number;
  teacherCount: number;
  monthlyData: MonthlyRevenue[];
}

const quickActions = [
  { label: "Teacher Approvals", desc: "Review pending applications", path: "/admin/teachers", icon: UserCheck, color: "text-sky-400", bg: "bg-sky-500/15" },
  { label: "All Courses", desc: "Monitor platform courses", path: "/admin/courses", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/15" },
  { label: "Transactions", desc: "Payment records", path: "/admin/transactions", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { label: "Reports", desc: "Financial analytics", path: "/admin/reports", icon: BarChart3, color: "text-orange-400", bg: "bg-orange-500/15" },
];

export function AdminDashboard({ totalUsers, totalCourses, platformRevenue, teacherCount, monthlyData }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Platform Overview</p>
          <h1 className="text-3xl font-black tracking-tight mt-1">Admin Dashboard</h1>
        </div>
        <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 gap-1.5"><Shield className="h-3 w-3" />Admin</Badge>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard label="Total Users" value={totalUsers} icon={Users} gradient="from-sky-500/20 to-sky-500/5" accent="text-sky-400" delay={0.1} />
        <GradientStatCard label="Total Courses" value={totalCourses} icon={BookOpen} gradient="from-violet-500/20 to-violet-500/5" accent="text-violet-400" delay={0.17} />
        <GradientStatCard label="Platform Revenue" value={`$${platformRevenue.toFixed(2)}`} icon={TrendingUp} gradient="from-emerald-500/20 to-emerald-500/5" accent="text-emerald-400" delay={0.24} />
        <GradientStatCard label="Teachers" value={teacherCount} icon={UserCheck} gradient="from-orange-500/20 to-orange-500/5" accent="text-orange-400" delay={0.31} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold mb-4">Platform Fee Revenue (6 months)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <Link key={a.path} href={a.path} className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors group">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.bg}`}>
                  <a.icon className={`h-4 w-4 ${a.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
