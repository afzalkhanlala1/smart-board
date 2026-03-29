import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFilePath, fileExists } from "@/lib/storage";
import { createReadStream, statSync } from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const lecture = await db.lecture.findUnique({
      where: { id: params.videoId },
      include: {
        course: {
          select: { teacherId: true },
        },
      },
    });

    if (!lecture) {
      return new Response("Lecture not found", { status: 404 });
    }

    if (!lecture.recordingUrl) {
      return new Response("No recording available", { status: 404 });
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

      if (!enrollment) {
        return new Response("Not enrolled in this course", { status: 403 });
      }
    }

    const exists = await fileExists(lecture.recordingUrl);
    if (!exists) {
      return new Response("Video file not found", { status: 404 });
    }

    const absolutePath = await getFilePath(lecture.recordingUrl);
    const stat = statSync(absolutePath);
    const fileSize = stat.size;

    const ext = path.extname(lecture.recordingUrl).toLowerCase();
    const contentType = MIME_TYPES[ext] || "video/mp4";

    const download = req.nextUrl.searchParams.get("download") === "true";
    const dispositionType = download ? "attachment" : "inline";
    const fileName = `${lecture.title}${ext}`;

    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const nodeStream = createReadStream(absolutePath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => {
            controller.enqueue(new Uint8Array(chunk as Buffer));
          });
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new Response(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(fileName)}"`,
        },
      });
    }

    const nodeStream = createReadStream(absolutePath);
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          controller.enqueue(new Uint8Array(chunk as Buffer));
        });
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
