import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const updateCourseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  gradeLevel: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  price: z.coerce.number().min(0).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  thumbnail: z.string().nullable().optional(),
});

type RouteContext = { params: { courseId: string } };

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      include: {
        teacher: { select: { id: true, name: true, avatar: true, bio: true } },
        lectures: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            scheduledAt: true,
            duration: true,
            sortOrder: true,
          },
        },
        resources: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const session = await auth();
    const isOwner = session?.user?.id === course.teacherId;
    const isAdmin = session?.user?.role === "ADMIN";

    if (course.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let isEnrolled = false;
    if (session?.user?.id) {
      const enrollment = await db.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: session.user.id,
            courseId: course.id,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    return NextResponse.json({
      ...course,
      price: course.price.toNumber(),
      enrollmentCount: course._count.enrollments,
      isOwner,
      isEnrolled,
      _count: undefined,
    });
  } catch (error) {
    console.error("GET /api/courses/[courseId] error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: { teacherId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this course" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateCourseSchema.parse(body);

    const updateData: Prisma.CourseUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.gradeLevel !== undefined) updateData.gradeLevel = data.gradeLevel;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;

    const updated = await db.course.update({
      where: { id: params.courseId },
      data: updateData,
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ...updated, price: updated.price.toNumber() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("PUT /api/courses/[courseId] error:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: { teacherId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized to delete this course" }, { status: 403 });
    }

    await db.course.delete({ where: { id: params.courseId } });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/courses/[courseId] error:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
