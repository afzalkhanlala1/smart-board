import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateLectureSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(["LIVE", "RECORDED"]).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  recordingUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

type RouteParams = { params: { courseId: string; lectureId: string } };

async function verifyOwnership(courseId: string, userId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  return course?.teacherId === userId;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const lecture = await db.lecture.findUnique({
      where: { id: params.lectureId },
      include: {
        resources: true,
        liveSession: true,
        course: {
          select: { id: true, title: true, teacherId: true },
        },
      },
    });

    if (!lecture || lecture.courseId !== params.courseId) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    return NextResponse.json(lecture);
  } catch (error) {
    console.error("Error fetching lecture:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecture" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await verifyOwnership(params.courseId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.lecture.findUnique({
      where: { id: params.lectureId },
      select: { courseId: true },
    });

    if (!existing || existing.courseId !== params.courseId) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateLectureSchema.parse(body);

    const lecture = await db.lecture.update({
      where: { id: params.lectureId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.recordingUrl !== undefined && { recordingUrl: data.recordingUrl }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { resources: true },
    });

    return NextResponse.json(lecture);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating lecture:", error);
    return NextResponse.json(
      { error: "Failed to update lecture" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await verifyOwnership(params.courseId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.lecture.findUnique({
      where: { id: params.lectureId },
      select: { courseId: true },
    });

    if (!existing || existing.courseId !== params.courseId) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    await db.lecture.delete({ where: { id: params.lectureId } });

    return NextResponse.json({ message: "Lecture deleted" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    return NextResponse.json(
      { error: "Failed to delete lecture" },
      { status: 500 }
    );
  }
}
