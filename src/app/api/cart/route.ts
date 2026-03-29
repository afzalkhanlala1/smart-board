import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await db.cartItem.findMany({
      where: { studentId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnail: true,
            teacher: { select: { name: true } },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ items: cartItems });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const course = await db.course.findUnique({ where: { id: courseId } });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Course not found or not available" },
        { status: 404 }
      );
    }

    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment?.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 409 }
      );
    }

    const existingCartItem = await db.cartItem.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId,
        },
      },
    });

    if (existingCartItem) {
      return NextResponse.json(
        { error: "Course is already in your cart" },
        { status: 409 }
      );
    }

    const cartItem = await db.cartItem.create({
      data: {
        studentId: session.user.id,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnail: true,
            teacher: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ item: cartItem }, { status: 201 });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    await db.cartItem.deleteMany({
      where: {
        studentId: session.user.id,
        courseId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
