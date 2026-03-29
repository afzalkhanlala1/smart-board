"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Loader2,
  Plus,
  Radio,
  Video,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CalendarWidget = dynamic(
  () => import("@/components/schedule/calendar-widget"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface Course {
  id: string;
  title: string;
}

interface Lecture {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  duration: number | null;
  type: "LIVE" | "RECORDED";
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  course?: { title: string };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    lecture: Lecture;
    courseTitle: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  SCHEDULED: { bg: "#10b981", border: "#059669" },
  LIVE: { bg: "#ef4444", border: "#dc2626" },
  COMPLETED: { bg: "#6b7280", border: "#4b5563" },
  CANCELLED: { bg: "#9ca3af", border: "#6b7280" },
};

export default function SchedulePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [newLecture, setNewLecture] = useState({
    courseId: "",
    title: "",
    scheduledAt: "",
    duration: 60,
  });

  const fetchData = useCallback(async () => {
    try {
      const coursesRes = await fetch("/api/courses?mine=true&limit=50");
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const courseList: Course[] = coursesData.courses ?? [];
        setCourses(courseList);

        const allLectures: Lecture[] = [];
        for (const course of courseList) {
          const lecturesRes = await fetch(
            `/api/courses/${course.id}/lectures`
          );
          if (lecturesRes.ok) {
            const lecturesData = await lecturesRes.json();
            const liveLectures = lecturesData
              .filter((l: Lecture) => l.type === "LIVE" && l.scheduledAt)
              .map((l: Lecture) => ({ ...l, course: { title: course.title } }));
            allLectures.push(...liveLectures);
          }
        }
        setLectures(allLectures);
      }
    } catch (err) {
      console.error("Error fetching schedule data:", err);
      toast.error("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      lectures.map((lecture) => {
        const colors = STATUS_COLORS[lecture.status] || STATUS_COLORS.SCHEDULED;
        const start = new Date(lecture.scheduledAt!);
        const end = new Date(
          start.getTime() + (lecture.duration || 60) * 60000
        );

        return {
          id: lecture.id,
          title: `${lecture.course?.title ? lecture.course.title + " - " : ""}${lecture.title}`,
          start: start.toISOString(),
          end: end.toISOString(),
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: "#ffffff",
          extendedProps: {
            lecture,
            courseTitle: lecture.course?.title || "",
          },
        };
      }),
    [lectures]
  );

  const handleEventClick = useCallback((info: EventClickArg) => {
    const lecture = info.event.extendedProps.lecture as Lecture;
    setSelectedLecture(lecture);
    setDetailDialogOpen(true);
  }, []);

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    const dateStr = format(info.start, "yyyy-MM-dd'T'HH:mm");
    setNewLecture((prev) => ({ ...prev, scheduledAt: dateStr }));
    setCreateDialogOpen(true);
  }, []);

  const handleCreateLecture = useCallback(async () => {
    if (!newLecture.courseId || !newLecture.title || !newLecture.scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(
        `/api/courses/${newLecture.courseId}/lectures`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newLecture.title,
            type: "LIVE",
            scheduledAt: new Date(newLecture.scheduledAt).toISOString(),
            duration: newLecture.duration,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create lecture");
      }

      toast.success("Live lecture scheduled");
      setCreateDialogOpen(false);
      setNewLecture({ courseId: "", title: "", scheduledAt: "", duration: 60 });
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create lecture"
      );
    } finally {
      setIsCreating(false);
    }
  }, [newLecture, fetchData]);

  const handleStartSession = useCallback(
    (lectureId: string) => {
      setDetailDialogOpen(false);
      router.push(`/live/${lectureId}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lecture Schedule
          </h1>
          <p className="text-muted-foreground">
            Manage your live lecture schedule
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Lecture
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No courses yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a course first to start scheduling live lectures.
          </p>
          <Button className="mt-4" onClick={() => router.push("/create-course")}>
            Create Course
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <CalendarWidget
            events={calendarEvents}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
          />
        </div>
      )}

      {/* Create Lecture Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Schedule Live Lecture
            </DialogTitle>
            <DialogDescription>
              Create a new live lecture session for your students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select
                value={newLecture.courseId}
                onValueChange={(val) =>
                  setNewLecture((prev) => ({ ...prev, courseId: val }))
                }
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Lecture Title</Label>
              <Input
                id="title"
                value={newLecture.title}
                onChange={(e) =>
                  setNewLecture((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g., Introduction to Algebra"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={newLecture.scheduledAt}
                  onChange={(e) =>
                    setNewLecture((prev) => ({
                      ...prev,
                      scheduledAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={480}
                  value={newLecture.duration}
                  onChange={(e) =>
                    setNewLecture((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 60,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLecture} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lecture Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          {selectedLecture && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedLecture.title}</DialogTitle>
                <DialogDescription>
                  {selectedLecture.course?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedLecture.status === "LIVE"
                        ? "destructive"
                        : selectedLecture.status === "COMPLETED"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {selectedLecture.status === "LIVE" && (
                      <Radio className="mr-1 h-3 w-3" />
                    )}
                    {selectedLecture.status}
                  </Badge>
                </div>

                {selectedLecture.scheduledAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(
                      new Date(selectedLecture.scheduledAt),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </div>
                )}

                {selectedLecture.scheduledAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(selectedLecture.scheduledAt), "h:mm a")}
                    {selectedLecture.duration &&
                      ` (${selectedLecture.duration} min)`}
                  </div>
                )}

                {selectedLecture.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLecture.description}
                  </p>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {(selectedLecture.status === "SCHEDULED" ||
                  selectedLecture.status === "LIVE") && (
                  <Button
                    onClick={() => handleStartSession(selectedLecture.id)}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {selectedLecture.status === "LIVE"
                      ? "Join Session"
                      : "Start Session"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
