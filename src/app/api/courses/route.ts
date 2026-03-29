import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  subject: z.string().min(1, "Subject is required"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
  thumbnail: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const search = searchParams.get("search") || "";
    const subject = searchParams.get("subject") || "";
    const grade = searchParams.get("grade") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sort = searchParams.get("sort") || "newest";

    const session = await auth();
    const isTeacher = session?.user?.role === "TEACHER";
    const mine = searchParams.get("mine") === "true";

    const where: Prisma.CourseWhereInput = {};

    if (mine && isTeacher && session?.user?.id) {
      where.teacherId = session.user.id;
    } else if (!isTeacher) {
      where.status = "PUBLISHED";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (subject) {
      where.subject = subject;
    }

    if (grade) {
      where.gradeLevel = grade;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = new Prisma.Decimal(minPrice);
      if (maxPrice) where.price.lte = new Prisma.Decimal(maxPrice);
    }

    const orderBy: Prisma.CourseOrderByWithRelationInput =
      sort === "oldest" ? { createdAt: "asc" }
      : sort === "price-low" ? { price: "asc" }
      : sort === "price-high" ? { price: "desc" }
      : sort === "title" ? { title: "asc" }
      : { createdAt: "desc" };

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          teacher: { select: { id: true, name: true, avatar: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      db.course.count({ where }),
    ]);

    const serialized = courses.map((course) => ({
      ...course,
      price: course.price.toNumber(),
      enrollmentCount: course._count.enrollments,
      _count: undefined,
    }));

    return NextResponse.json({
      courses: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Only teachers can create courses" }, { status: 403 });
    }

    if (!session.user.isApproved) {
      return NextResponse.json({ error: "Your account is pending approval" }, { status: 403 });
    }

    const body = await req.json();
    const data = createCourseSchema.parse(body);

    const course = await db.course.create({
      data: {
        teacherId: session.user.id,
        title: data.title,
        description: data.description,
        gradeLevel: data.gradeLevel,
        subject: data.subject,
        price: new Prisma.Decimal(data.price),
        status: data.status,
        thumbnail: data.thumbnail || null,
      },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { ...course, price: course.price.toNumber() },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
