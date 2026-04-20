import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { RoomServiceClient, EgressClient, EncodedFileOutput, EncodedFileType } from "livekit-server-sdk";

const apiKey = process.env.LIVEKIT_API_KEY!;
const apiSecret = process.env.LIVEKIT_API_SECRET!;
const livekitHost = process.env.LIVEKIT_URL?.replace("ws://", "http://").replace("wss://", "https://") || "http://localhost:7880";

const startSchema = z.object({
  lectureId: z.string().min(1),
  action: z.literal("start"),
});

const stopSchema = z.object({
  lectureId: z.string().min(1),
  action: z.literal("stop"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "start") {
      const { lectureId } = startSchema.parse(body);

      const liveSession = await db.liveSession.findUnique({
        where: { lectureId },
        include: { lecture: { include: { course: true } } },
      });

      if (!liveSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (
        liveSession.lecture.course.teacherId !== session.user.id &&
        session.user.role !== "ADMIN"
      ) {
        return NextResponse.json({ error: "Only the teacher can record" }, { status: 403 });
      }

      if (liveSession.egressId) {
        return NextResponse.json({ error: "Recording already in progress" }, { status: 400 });
      }

      try {
        const egressClient = new EgressClient(livekitHost, apiKey, apiSecret);
        const filepath = `recordings/${lectureId}-${Date.now()}.mp4`;
        const output = new EncodedFileOutput({
          fileType: EncodedFileType.MP4,
          filepath,
        });

        const egress = await egressClient.startRoomCompositeEgress(
          liveSession.livekitRoom,
          { file: output }
        );

        await db.liveSession.update({
          where: { id: liveSession.id },
          data: { egressId: egress.egressId, recordingUrl: filepath },
        });

        return NextResponse.json({
          message: "Recording started",
          egressId: egress.egressId,
        });
      } catch (egressError) {
        console.error("LiveKit Egress API error:", egressError);
        return NextResponse.json(
          {
            error: "Recording service unavailable. LiveKit Egress may not be configured.",
            details: "Ensure LiveKit Egress service is running alongside LiveKit server.",
          },
          { status: 503 }
        );
      }
    }

    if (body.action === "stop") {
      const { lectureId } = stopSchema.parse(body);

      const liveSession = await db.liveSession.findUnique({
        where: { lectureId },
        include: { lecture: { include: { course: true } } },
      });

      if (!liveSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (
        liveSession.lecture.course.teacherId !== session.user.id &&
        session.user.role !== "ADMIN"
      ) {
        return NextResponse.json({ error: "Only the teacher can stop recording" }, { status: 403 });
      }

      if (!liveSession.egressId) {
        return NextResponse.json({ error: "No recording in progress" }, { status: 400 });
      }

      try {
        const egressClient = new EgressClient(livekitHost, apiKey, apiSecret);
        await egressClient.stopEgress(liveSession.egressId);

        const recordingPath =
          liveSession.recordingUrl ??
          `recordings/${lectureId}-${Date.now()}.mp4`;

        await db.liveSession.update({
          where: { id: liveSession.id },
          data: {
            egressId: null,
            recordingUrl: recordingPath,
          },
        });

        await db.lecture.update({
          where: { id: lectureId },
          data: { recordingUrl: recordingPath },
        });

        return NextResponse.json({
          message: "Recording stopped",
          recordingUrl: recordingPath,
        });
      } catch (egressError) {
        console.error("LiveKit Egress stop error:", egressError);
        await db.liveSession.update({
          where: { id: liveSession.id },
          data: { egressId: null },
        });

        return NextResponse.json(
          { error: "Failed to stop recording. The egress may have already ended." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Recording API error:", error);
    return NextResponse.json({ error: "Failed to process recording" }, { status: 500 });
  }
}
