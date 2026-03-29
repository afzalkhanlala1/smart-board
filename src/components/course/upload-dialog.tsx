"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileVideo, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadDialogProps {
  courseId: string;
  lectureId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (result: {
    url: string;
    fileType: string;
    fileSize: number;
  }) => void;
}

const ACCEPT_MAP = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function UploadDialog({
  courseId,
  lectureId,
  open,
  onOpenChange,
  onUploadComplete,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setDone(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_MAP,
    maxFiles: 1,
    disabled: uploading,
    onDropRejected: () => {
      toast.error("Invalid file type. Accepted: mp4, webm, mov, pdf, pptx, docx");
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    const isVideo = VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const limit = isVideo ? "500MB" : "50MB";
      toast.error(`File too large. Maximum size for ${isVideo ? "videos" : "documents"} is ${limit}`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      const result = await new Promise<{
        url: string;
        fileType: string;
        fileSize: number;
      }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || "Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      setDone(true);
      setProgress(100);
      toast.success("File uploaded successfully");
      onUploadComplete(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (uploading) return;
    if (!open) {
      setFile(null);
      setProgress(0);
      setDone(false);
    }
    onOpenChange(open);
  };

  const isVideo = file ? VIDEO_TYPES.includes(file.type) : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lectureId ? "Upload Lecture Video" : "Upload File"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dropzone */}
          {!file && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop a file, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Videos: MP4, WebM, MOV (up to 500MB)
                <br />
                Documents: PDF, PPTX, DOCX (up to 50MB)
              </p>
            </div>
          )}

          {/* Selected file */}
          {file && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {isVideo ? (
                  <FileVideo className="h-8 w-8 text-emerald-500 shrink-0" />
                ) : (
                  <FileText className="h-8 w-8 text-orange-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!uploading && !done && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {done && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
              </div>

              {/* Progress */}
              {(uploading || done) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {done ? "Complete" : "Uploading..."}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        done ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload button */}
              {!done && (
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
