import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import path from "path";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];
const DOC_EXTENSIONS = [".pdf", ".pptx", ".docx", ".txt"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

type FileKind = "video" | "doc" | "image";

function classify(ext: string): FileKind | null {
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (DOC_EXTENSIONS.includes(ext)) return "doc";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only teachers can upload files" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kindHint = (formData.get("kind") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const kind = classify(ext);

    if (!kind) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Accepted: ${[
            ...VIDEO_EXTENSIONS,
            ...DOC_EXTENSIONS,
            ...IMAGE_EXTENSIONS,
          ].join(", ")}`,
        },
        { status: 400 }
      );
    }

    const maxSize =
      kind === "video"
        ? MAX_VIDEO_SIZE
        : kind === "image"
          ? MAX_IMAGE_SIZE
          : MAX_DOC_SIZE;

    if (file.size > maxSize) {
      const limitMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File too large. Maximum size is ${limitMB}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_+/g, "_");
    const uniqueName = `${timestamp}-${random}-${safeName}`;

    // Allow the client to opt into the thumbnails folder for images.
    let directory: string;
    if (kind === "video") directory = "videos";
    else if (kind === "image")
      directory = kindHint === "thumbnail" ? "thumbnails" : "thumbnails";
    else directory = "resources";

    const filePath = `${directory}/${uniqueName}`;

    await uploadFile(buffer, filePath);

    const fileType = MIME_MAP[ext] || file.type;

    return NextResponse.json({
      url: filePath,
      filePath,
      fileType,
      fileSize: file.size,
      kind,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
