"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Flame, ArrowRight, Target, Play, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradientStatCard } from "./gradient-stat-card";
import { format } from "date-fns";

interface Enrollment {
  id: string;
  courseId: string;
  progress: Record<string, boolean> | null;
  course: { title: string };
}

interface UpcomingLecture {
  id: string;
  title: string;
  scheduledAt: string | null;
  course: { title: string };
}

interface StudentDashboardProps {
  firstName: string;
  enrollments: Enrollment[];
  upcomingLectures: UpcomingLecture[];
}

function getProgressPercent(progress: Record<string, boolean> | null): number {
  if (!progress || typeof progress !== "object") return 0;
  const entries = Object.values(progress);
  if (entries.length === 0) return 0;
  return Math.round((entries.filter(Boolean).length / entries.length) * 100);
}

export function StudentDashboard({ firstName, enrollments, upcomingLectures }: StudentDashboardProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting}</p>
          <h1 className="text-3xl font-black tracking-tight mt-1">{firstName}</h1>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/20">Student</Badge>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard label="Enrolled" value={enrollments.length} description="Active courses" icon={BookOpen} gradient="from-emerald-500/20 to-emerald-500/5" accent="text-emerald-400" delay={0.1} />
        <GradientStatCard label="Live Sessions" value={upcomingLectures.length} description="Upcoming" icon={Radio} gradient="from-sky-500/20 to-sky-500/5" accent="text-sky-400" delay={0.17} />
        <GradientStatCard label="Hours Watched" value="24h" description="This month" icon={Clock} gradient="from-violet-500/20 to-violet-500/5" accent="text-violet-400" delay={0.24} />
        <GradientStatCard label="Day Streak" value="7" description="Keep it up!" icon={Flame} gradient="from-orange-500/20 to-orange-500/5" accent="text-orange-400" delay={0.31} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Upcoming Live Sessions</h3>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="gap-1 text-primary h-8">View all <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          {upcomingLectures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
              <Link href="/courses">
                <Button size="sm" className="mt-3 gap-2"><BookOpen className="h-4 w-4" />Browse Courses</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingLectures.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/50 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <Radio className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{l.title}</p>
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
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">Continue Learning</h3>
            <Link href="/my-courses">
              <Button variant="ghost" size="sm" className="gap-1 text-primary h-8">View all <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Target className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Start your first course</p>
              <Link href="/courses">
                <Button size="sm" className="mt-3 gap-2"><Play className="h-4 w-4" />Explore Courses</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 4).map((e) => {
                const pct = getProgressPercent(e.progress);
                return (
                  <Link key={e.id} href={`/courses/${e.courseId}`} className="group flex items-center gap-3 rounded-xl bg-muted/30 border border-border/50 p-3 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {e.course.title?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{e.course.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
