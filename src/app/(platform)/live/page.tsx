import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Clock, Video, Users, CalendarDays } from "lucide-react";
import { Prisma } from "@prisma/client";

export default async function LiveIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isTeacher = session.user.role === "TEACHER";
  const isAdmin = session.user.role === "ADMIN";

  const now = new Date();

  const baseWhere: Prisma.LectureWhereInput = { type: "LIVE" };
  if (isTeacher) {
    baseWhere.course = { teacherId: session.user.id };
  } else if (!isAdmin) {
    baseWhere.course = {
      enrollments: {
        some: {
          studentId: session.user.id,
          paymentStatus: "COMPLETED",
        },
      },
    };
  }

  const liveLectures = await db.lecture.findMany({
    where: { ...baseWhere, status: "LIVE" },
    include: {
      course: { select: { id: true, title: true, teacher: { select: { name: true } } } },
      liveSession: { select: { id: true, startedAt: true, participantsCount: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const upcomingLectures = await db.lecture.findMany({
    where: { ...baseWhere, status: "SCHEDULED", scheduledAt: { gte: now } },
    include: {
      course: { select: { id: true, title: true, teacher: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Live Sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isTeacher
            ? "Your active and upcoming live lectures"
            : "Join live lectures or see what's coming up"}
        </p>
      </div>

      {/* Currently Live */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <h2 className="text-lg font-semibold">Live Now</h2>
          {liveLectures.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {liveLectures.length}
            </Badge>
          )}
        </div>

        {liveLectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No sessions are live right now</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveLectures.map((lecture) => (
              <Card key={lecture.id} className="overflow-hidden border-red-500/30">
                <div className="h-1.5 bg-red-500" />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold truncate">{lecture.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {lecture.course.title}
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0 gap-1 animate-pulse">
                      <Radio className="h-2.5 w-2.5" />
                      LIVE
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lecture.liveSession?.participantsCount ?? 0} watching
                    </span>
                    {!isTeacher && (
                      <span>by {lecture.course.teacher.name}</span>
                    )}
                  </div>
                  <Button asChild className="w-full gap-2" size="sm">
                    <Link href={`/live/${lecture.id}`}>
                      <Video className="h-4 w-4" />
                      {isTeacher ? "Rejoin Session" : "Join Now"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Upcoming</h2>
        </div>

        {upcomingLectures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border bg-card">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No upcoming live lectures scheduled</p>
            {isTeacher && (
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/schedule">Go to Schedule</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingLectures.map((lecture) => (
              <Card key={lecture.id} className="overflow-hidden">
                <div className="h-1.5 bg-primary/60" />
                <CardContent className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold truncate">{lecture.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {lecture.course.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lecture.scheduledAt
                        ? formatDate(lecture.scheduledAt)
                        : "TBD"}
                    </span>
                    {lecture.duration && (
                      <span>{lecture.duration} min</span>
                    )}
                  </div>
                  {!isTeacher && (
                    <p className="text-xs text-muted-foreground">
                      by {lecture.course.teacher.name}
                    </p>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Link href={`/live/${lecture.id}`}>
                      <Video className="h-4 w-4" />
                      {isTeacher ? "Go to Session" : "View Details"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
