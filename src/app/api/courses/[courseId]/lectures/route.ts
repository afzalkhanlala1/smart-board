import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createLectureSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["LIVE", "RECORDED"]),
  scheduledAt: z.string().datetime().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const lectures = await db.lecture.findMany({
      where: { courseId: params.courseId },
      orderBy: { sortOrder: "asc" },
      include: {
        resources: true,
        liveSession: {
          select: { id: true, livekitRoom: true, startedAt: true, endedAt: true },
        },
      },
    });

    return NextResponse.json(lectures);
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return NextResponse.json(
      { error: "Failed to fetch lectures" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: params.courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the course owner can add lectures" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createLectureSchema.parse(body);

    const lastLecture = await db.lecture.findFirst({
      where: { courseId: params.courseId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const lecture = await db.lecture.create({
      data: {
        courseId: params.courseId,
        title: data.title,
        description: data.description,
        type: data.type,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        duration: data.duration ?? null,
        sortOrder: (lastLecture?.sortOrder ?? -1) + 1,
      },
      include: { resources: true },
    });

    return NextResponse.json(lecture, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating lecture:", error);
    return NextResponse.json(
      { error: "Failed to create lecture" },
      { status: 500 }
    );
  }
}
