import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const leaveSchema = z.object({
  lectureId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lectureId } = leaveSchema.parse(body);

    const liveSession = await db.liveSession.findUnique({
      where: { lectureId },
    });

    if (liveSession && liveSession.participantsCount > 0) {
      await db.liveSession.update({
        where: { id: liveSession.id },
        data: { participantsCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ message: "Left session" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error leaving session:", error);
    return NextResponse.json(
      { error: "Failed to leave session" },
      { status: 500 }
    );
  }
}
