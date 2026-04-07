import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, name, role } = session.user;
  const firstName = name?.split(" ")[0] ?? "there";

  if (role === "STUDENT") {
    const [enrollments, upcomingLectures] = await Promise.all([
      db.enrollment.findMany({
        where: { studentId: userId, paymentStatus: "COMPLETED" },
        include: { course: { select: { title: true } } },
        take: 10,
      }),
      db.lecture.findMany({
        where: {
          type: "LIVE",
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
          course: { enrollments: { some: { studentId: userId, paymentStatus: "COMPLETED" } } },
        },
        include: { course: { select: { title: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
    ]);

    return (
      <StudentDashboard
        firstName={firstName}
        enrollments={enrollments.map((e) => ({
          id: e.id,
          courseId: e.courseId,
          progress: e.progress as Record<string, boolean> | null,
          course: { title: e.course.title },
        }))}
        upcomingLectures={upcomingLectures.map((l) => ({
          id: l.id,
          title: l.title,
          scheduledAt: l.scheduledAt?.toISOString() ?? null,
          course: { title: l.course.title },
        }))}
      />
    );
  }

  if (role === "TEACHER") {
    const [courses, upcomingLectures, earnings] = await Promise.all([
      db.course.findMany({
        where: { teacherId: userId },
        include: { _count: { select: { enrollments: true } } },
      }),
      db.lecture.findMany({
        where: { course: { teacherId: userId }, type: "LIVE", status: "SCHEDULED", scheduledAt: { gte: new Date() } },
        include: { course: { select: { title: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      db.teacherEarning.findFirst({ where: { teacherId: userId } }),
    ]);

    return (
      <TeacherDashboard
        firstName={firstName}
        courses={courses.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          subject: c.subject,
          _count: { enrollments: c._count.enrollments },
        }))}
        upcomingLectures={upcomingLectures.map((l) => ({
          id: l.id,
          title: l.title,
          scheduledAt: l.scheduledAt?.toISOString() ?? null,
          course: { title: l.course.title },
        }))}
        totalEarned={earnings?.totalEarned ?? 0}
        pendingBalance={earnings?.pendingBalance ?? 0}
      />
    );
  }

  if (role === "ADMIN") {
    const now = new Date();
    const [userCount, courseCount, teacherCount, transactions] = await Promise.all([
      db.user.count(),
      db.course.count(),
      db.user.count({ where: { role: "TEACHER" } }),
      db.transaction.findMany({ where: { status: "COMPLETED" }, select: { platformFee: true, createdAt: true } }),
    ]);

    const platformRevenue = transactions.reduce((s, t) => s + (t.platformFee ?? 0), 0);

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const revenue = transactions
        .filter((t) => t.createdAt >= mStart && t.createdAt <= mEnd)
        .reduce((s, t) => s + (t.platformFee ?? 0), 0);
      return { month: format(month, "MMM"), revenue: Math.round(revenue * 100) / 100 };
    });

    return (
      <AdminDashboard
        totalUsers={userCount}
        totalCourses={courseCount}
        platformRevenue={platformRevenue}
        teacherCount={teacherCount}
        monthlyData={monthlyData}
      />
    );
  }

  return null;
}
