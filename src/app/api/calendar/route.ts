import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userId = session.user.id;
    const role = session.user.role;

    let courseFilter: { id?: string; teacherId?: string; enrollments?: object };

    if (role === "TEACHER") {
      courseFilter = {
        teacherId: userId,
        ...(courseId && { id: courseId }),
      };
    } else {
      courseFilter = {
        enrollments: {
          some: {
            studentId: userId,
            paymentStatus: "COMPLETED",
          },
        },
        ...(courseId && { id: courseId }),
      };
    }

    const lectures = await db.lecture.findMany({
      where: {
        course: courseFilter,
        scheduledAt: { not: null },
      },
      include: {
        course: {
          select: { title: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const events = lectures.map((lecture) => {
      const start = lecture.scheduledAt!;
      const durationMs = (lecture.duration || 60) * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      return {
        id: lecture.id,
        title: lecture.title,
        start: start.toISOString(),
        end: end.toISOString(),
        extendedProps: {
          courseTitle: lecture.course.title,
          courseId: lecture.courseId,
          lectureId: lecture.id,
          type: lecture.type,
          status: lecture.status,
          description: lecture.description,
          recordingUrl: lecture.recordingUrl,
        },
      };
    });

    const courses = await db.course.findMany({
      where: courseFilter,
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ events, courses });
  } catch (error) {
    console.error("Calendar GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
