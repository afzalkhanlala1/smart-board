import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lectureId = searchParams.get("lectureId");

    if (!lectureId) {
      return NextResponse.json(
        { error: "lectureId is required" },
        { status: 400 }
      );
    }

    const liveSession = await db.liveSession.findUnique({
      where: { lectureId },
      select: { id: true },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live session not found" },
        { status: 404 }
      );
    }

    const messages = await db.chatMessage.findMany({
      where: { liveSessionId: liveSession.id },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

const chatSchema = z.object({
  liveSessionId: z.string().min(1),
  content: z.string().min(1).max(2000),
  type: z.enum(["TEXT", "SYSTEM", "HAND_RAISE"]).default("TEXT"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = chatSchema.parse(body);

    const liveSession = await db.liveSession.findUnique({
      where: { id: data.liveSessionId },
      select: { id: true },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: "Live session not found" },
        { status: 404 }
      );
    }

    const message = await db.chatMessage.create({
      data: {
        liveSessionId: data.liveSessionId,
        userId: session.user.id,
        content: data.content,
        type: data.type,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error saving chat message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
