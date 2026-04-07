"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign, BookOpen, Users, Plus, ArrowRight, Video, TrendingUp, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradientStatCard } from "./gradient-stat-card";
import { format } from "date-fns";

interface Course {
  id: string;
  title: string;
  status: string;
  subject: string;
  _count: { enrollments: number };
}

interface Lecture {
  id: string;
  title: string;
  scheduledAt: string | null;
  course: { title: string };
}

interface TeacherDashboardProps {
  firstName: string;
  courses: Course[];
  upcomingLectures: Lecture[];
  totalEarned: number;
  pendingBalance: number;
}

export function TeacherDashboard({ firstName, courses, upcomingLectures, totalEarned, pendingBalance }: TeacherDashboardProps) {
  const totalStudents = courses.reduce((s, c) => s + (c._count.enrollments || 0), 0);
  const publishedCount = courses.filter((c) => c.status === "PUBLISHED").length;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-3xl font-black tracking-tight mt-1">{firstName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/20">Teacher</Badge>
          <Link href="/create-course">
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Course</Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard label="Pending Balance" value={`$${pendingBalance.toFixed(2)}`} description="Ready to withdraw" icon={DollarSign} gradient="from-emerald-500/20 to-emerald-500/5" accent="text-emerald-400" delay={0.1} />
        <GradientStatCard label="Active Courses" value={publishedCount} description={`${courses.length} total`} icon={BookOpen} gradient="from-sky-500/20 to-sky-500/5" accent="text-sky-400" delay={0.17} />
        <GradientStatCard label="Total Students" value={totalStudents} description="Across all courses" icon={Users} gradient="from-violet-500/20 to-violet-500/5" accent="text-violet-400" delay={0.24} />
        <GradientStatCard label="Upcoming Live" value={upcomingLectures.length} description="Scheduled sessions" icon={Radio} gradient="from-orange-500/20 to-orange-500/5" accent="text-orange-400" delay={0.31} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Your Courses</h3>
            <Link href="/teacher/courses">
              <Button variant="ghost" size="sm" className="gap-1 text-primary h-8">Manage <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Create your first course</p>
              <Link href="/create-course">
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Create Course</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 4).map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="group flex items-center justify-between rounded-xl bg-muted/30 border border-border/50 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/5 flex items-center justify-center text-sky-400 font-bold text-sm">
                      {c.title?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c._count.enrollments} students · {c.subject}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${c.status === "PUBLISHED" ? "border-emerald-500/30 text-emerald-400" : "text-muted-foreground"}`}>
                    {c.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Upcoming Sessions</h3>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="gap-1 text-primary h-8">Calendar <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          {upcomingLectures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Video className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No sessions scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingLectures.map((l) => (
                <Link key={l.id} href={`/live/${l.id}`} className="group flex items-center gap-3 rounded-xl bg-muted/30 border border-border/50 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
                    <Radio className="h-4 w-4 text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.course.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {l.scheduledAt && (
                      <>
                        <p className="text-xs font-medium text-primary">{format(new Date(l.scheduledAt), "MMM d")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(l.scheduledAt), "h:mm a")}</p>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Total Earned</span>
              <span className="font-bold text-emerald-400">${totalEarned.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
