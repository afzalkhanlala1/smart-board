import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { stat } from "fs/promises";
import { auth } from "@/lib/auth";

const STORAGE_PATH = path.resolve(process.env.STORAGE_PATH || "./storage");

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".zip": "application/zip",
  ".json": "application/json",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join("/");

    // Thumbnails are public (needed for unauthenticated course browsing).
    // All other files (videos, PDFs, resources) require authentication.
    const isThumbnail = filePath.startsWith("thumbnails/");
    if (!isThumbnail) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const resolvedPath = path.resolve(STORAGE_PATH, filePath);
    if (!resolvedPath.startsWith(STORAGE_PATH)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    let fileStat;
    try {
      fileStat = await stat(resolvedPath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const mimeType = getMimeType(resolvedPath);
    const fileSize = fileStat.size;
    const rangeHeader = req.headers.get("range");

    if (rangeHeader && mimeType.startsWith("video/")) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(resolvedPath, { start, end });
      const readable = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
        cancel() {
          stream.destroy();
        },
      });

      return new NextResponse(readable, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const stream = fs.createReadStream(resolvedPath);
    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": mimeType.startsWith("image/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File serving error:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
