"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDialog } from "./upload-dialog";
import {
  Video,
  Radio,
  Clock,
  FileText,
  Download,
  Plus,
  Upload,
  Play,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface Lecture {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  duration: number | null;
  recordingUrl: string | null;
  type: "LIVE" | "RECORDED";
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  sortOrder: number;
  resources: Resource[];
}

interface ContentLibraryProps {
  courseId: string;
  isTeacher: boolean;
  isEnrolled: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-yellow-500/15 text-yellow-700 border-yellow-200",
  LIVE: "bg-red-500/15 text-red-700 border-red-200",
  COMPLETED: "bg-green-500/15 text-green-700 border-green-200",
  CANCELLED: "bg-gray-500/15 text-gray-500 border-gray-200",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContentLibrary({
  courseId,
  isTeacher,
  isEnrolled,
}: ContentLibraryProps) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadLectureId, setUploadLectureId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "RECORDED" as "LIVE" | "RECORDED",
    scheduledAt: "",
    duration: "",
  });

  const fetchLectures = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/lectures`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLectures(data);
    } catch {
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const handleCreateLecture = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (form.type === "LIVE" && !form.scheduledAt) {
      toast.error("Live lectures need a scheduled date");
      return;
    }

    // <input type="datetime-local"> returns `YYYY-MM-DDTHH:mm` without a
    // timezone. The API's Zod schema uses `.datetime()`, which requires a
    // full ISO string, so convert via the browser.
    const scheduledAtIso = form.scheduledAt
      ? new Date(form.scheduledAt).toISOString()
      : undefined;
    const durationNum = form.duration ? parseInt(form.duration, 10) : undefined;

    setCreating(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/lectures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          scheduledAt: scheduledAtIso,
          duration:
            durationNum && durationNum > 0 ? durationNum : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create lecture");
      }

      toast.success("Lecture created");
      setShowAddDialog(false);
      setForm({ title: "", description: "", type: "RECORDED", scheduledAt: "", duration: "" });
      fetchLectures();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lecture");
    } finally {
      setCreating(false);
    }
  };

  const handleUploadComplete = async (result: {
    url: string;
    fileType: string;
    fileSize: number;
  }) => {
    if (uploadLectureId) {
      try {
        const res = await fetch(
          `/api/courses/${courseId}/lectures/${uploadLectureId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recordingUrl: result.url,
              status: "COMPLETED",
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to update lecture");
        toast.success("Video attached to lecture");
      } catch {
        toast.error("Upload succeeded but failed to attach to lecture");
      }
    }

    setShowUploadDialog(false);
    setUploadLectureId(null);
    fetchLectures();
  };

  const recorded = lectures.filter((l) => l.type === "RECORDED");
  const live = lectures.filter((l) => l.type === "LIVE");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Course Content</h2>
        {isTeacher && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lecture
            </Button>
          </div>
        )}
      </div>

      {lectures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No lectures yet</p>
            {isTeacher && (
              <p className="text-sm mt-1">
                Get started by adding your first lecture.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="recorded" className="w-full">
          <TabsList>
            <TabsTrigger value="recorded" className="gap-2">
              <Video className="h-4 w-4" />
              Recorded ({recorded.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2">
              <Radio className="h-4 w-4" />
              Live ({live.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recorded" className="mt-4 space-y-3">
            {recorded.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recorded lectures yet.
              </p>
            ) : (
              recorded.map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  courseId={courseId}
                  isTeacher={isTeacher}
                  isEnrolled={isEnrolled}
                  onUploadVideo={() => {
                    setUploadLectureId(lecture.id);
                    setShowUploadDialog(true);
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="live" className="mt-4 space-y-3">
            {live.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No live lectures scheduled.
              </p>
            ) : (
              live.map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  courseId={courseId}
                  isTeacher={isTeacher}
                  isEnrolled={isEnrolled}
                  onUploadVideo={() => {
                    setUploadLectureId(lecture.id);
                    setShowUploadDialog(true);
                  }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Add Lecture Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lecture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lecture-title">Title</Label>
              <Input
                id="lecture-title"
                placeholder="Introduction to the topic..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lecture-desc">Description</Label>
              <Textarea
                id="lecture-desc"
                placeholder="What this lecture covers..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as "LIVE" | "RECORDED" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECORDED">Recorded</SelectItem>
                    <SelectItem value="LIVE">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lecture-duration">Duration (min)</Label>
                <Input
                  id="lecture-duration"
                  type="number"
                  placeholder="45"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                />
              </div>
            </div>
            {form.type === "LIVE" && (
              <div className="space-y-2">
                <Label htmlFor="lecture-schedule">Scheduled Date & Time</Label>
                <Input
                  id="lecture-schedule"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLecture} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Lecture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <UploadDialog
        courseId={courseId}
        lectureId={uploadLectureId ?? undefined}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

function LectureCard({
  lecture,
  courseId,
  isTeacher,
  isEnrolled,
  onUploadVideo,
}: {
  lecture: Lecture;
  courseId: string;
  isTeacher: boolean;
  isEnrolled: boolean;
  onUploadVideo: () => void;
}) {
  const hasVideo = !!lecture.recordingUrl;
  const canWatch = (isTeacher || isEnrolled) && hasVideo;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 shrink-0">
              {lecture.type === "RECORDED" ? (
                <Video className="h-4 w-4 text-primary" />
              ) : (
                <Radio className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">
                {lecture.title}
              </CardTitle>
              {lecture.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {lecture.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={STATUS_COLORS[lecture.status]}
            >
              {lecture.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {lecture.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {lecture.duration} min
            </span>
          )}
          {lecture.scheduledAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(lecture.scheduledAt)}
            </span>
          )}
        </div>

        {/* Resources */}
        {lecture.resources.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resources
              </span>
              {lecture.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={`/api/files/${resource.fileUrl}`}
                  download
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate">{resource.title}</span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    ({formatFileSize(resource.fileSize)})
                  </span>
                  <Download className="h-3 w-3 ml-auto shrink-0" />
                </a>
              ))}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {canWatch && (
            <Link href={`/courses/${courseId}/watch/${lecture.id}`}>
              <Button size="sm">
                <Play className="h-4 w-4 mr-1.5 fill-current" />
                Watch
              </Button>
            </Link>
          )}
          {isTeacher && lecture.type === "RECORDED" && !hasVideo && (
            <Button variant="outline" size="sm" onClick={onUploadVideo}>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Video
            </Button>
          )}
          {isTeacher && lecture.type === "RECORDED" && hasVideo && (
            <Button variant="ghost" size="sm" onClick={onUploadVideo}>
              <Upload className="h-4 w-4 mr-1.5" />
              Replace Video
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
