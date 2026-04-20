import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRoomName } from "@/lib/livekit";
import { RoomServiceClient } from "livekit-server-sdk";
import { z } from "zod";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!;

function getRoomService() {
  return new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

async function verifyTeacher(
  lectureId: string,
  userId: string,
  role?: string
) {
  const lecture = await db.lecture.findUnique({
    where: { id: lectureId },
    include: { course: { select: { teacherId: true } } },
  });

  if (!lecture) return { error: "Lecture not found", status: 404 } as const;
  if (lecture.course.teacherId !== userId && role !== "ADMIN") {
    return {
      error: "Only the course teacher can manage sessions",
      status: 403,
    } as const;
  }

  return { lecture } as const;
}

const sessionSchema = z.object({
  lectureId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lectureId } = sessionSchema.parse(body);

    const result = await verifyTeacher(
      lectureId,
      session.user.id,
      session.user.role
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const roomName = generateRoomName(lectureId);

    const liveSession = await db.liveSession.upsert({
      where: { lectureId },
      create: {
        lectureId,
        livekitRoom: roomName,
        startedAt: new Date(),
      },
      update: {
        startedAt: new Date(),
        endedAt: null,
      },
    });

    await db.lecture.update({
      where: { id: lectureId },
      data: { status: "LIVE" },
    });

    return NextResponse.json({
      session: liveSession,
      message: "Session started",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error starting session:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lectureId } = sessionSchema.parse(body);

    const result = await verifyTeacher(
      lectureId,
      session.user.id,
      session.user.role
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const liveSession = await db.liveSession.findUnique({
      where: { lectureId },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    const updatedSession = await db.liveSession.update({
      where: { id: liveSession.id },
      data: {
        endedAt: new Date(),
      },
    });

    const updateData: { status: "COMPLETED"; recordingUrl?: string } = {
      status: "COMPLETED",
    };

    if (liveSession.recordingUrl) {
      updateData.recordingUrl = liveSession.recordingUrl;
    }

    await db.lecture.update({
      where: { id: lectureId },
      data: updateData,
    });

    return NextResponse.json({
      session: updatedSession,
      message: "Session ended",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error ending session:", error);
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}

const permissionSchema = z.object({
  lectureId: z.string().min(1),
  participantId: z.string().min(1),
  canPublish: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lectureId, participantId, canPublish } = permissionSchema.parse(body);

    const result = await verifyTeacher(
      lectureId,
      session.user.id,
      session.user.role
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const roomName = generateRoomName(lectureId);
    const roomService = getRoomService();

    await roomService.updateParticipant(roomName, participantId, undefined, {
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json({
      message: canPublish ? "Publish permission granted" : "Publish permission revoked",
      participantId,
      canPublish,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant permissions" },
      { status: 500 }
    );
  }
}
