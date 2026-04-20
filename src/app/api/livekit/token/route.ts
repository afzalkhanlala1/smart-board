import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createToken, generateRoomName } from "@/lib/livekit";
import { z } from "zod";

const tokenSchema = z.object({
  lectureId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lectureId } = tokenSchema.parse(body);

    const lecture = await db.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: { id: true, teacherId: true },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    if (lecture.type !== "LIVE") {
      return NextResponse.json(
        { error: "This lecture is not a live session" },
        { status: 400 }
      );
    }

    const isTeacher = lecture.course.teacherId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isTeacher && !isAdmin) {
      const enrollment = await db.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: session.user.id,
            courseId: lecture.courseId,
          },
        },
      });

      if (!enrollment || enrollment.paymentStatus !== "COMPLETED") {
        return NextResponse.json(
          { error: "You are not enrolled in this course" },
          { status: 403 }
        );
      }
    }

    const roomName = generateRoomName(lectureId);

    const liveSession = await db.liveSession.upsert({
      where: { lectureId },
      create: {
        lectureId,
        livekitRoom: roomName,
      },
      update: {},
    });

    const token = await createToken(
      roomName,
      session.user.name ?? "Guest",
      session.user.id,
      isTeacher || isAdmin
    );

    return NextResponse.json({
      token,
      roomName,
      isTeacher: isTeacher || isAdmin,
      liveSessionId: liveSession.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
