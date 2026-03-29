"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import {
  Video,
  Clock,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
function generateGoogleCalendarUrl(params: {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
}) {
  const formatGCalDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const url = new URL("https://calendar.google.com/calendar/event");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set(
    "dates",
    `${formatGCalDate(params.startDate)}/${formatGCalDate(params.endDate)}`
  );
  if (params.description) url.searchParams.set("details", params.description);
  return url.toString();
}

interface CalendarEvent extends EventInput {
  extendedProps: {
    courseTitle: string;
    courseId: string;
    lectureId: string;
    type: string;
    status: string;
    description?: string;
    recordingUrl?: string;
  };
}

interface Course {
  id: string;
  title: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  courses: Course[];
}

interface SelectedEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  courseTitle: string;
  courseId: string;
  lectureId: string;
  type: string;
  status: string;
  description?: string;
  recordingUrl?: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: "#10b981", border: "#059669", text: "#ffffff" },
  LIVE: { bg: "#ef4444", border: "#dc2626", text: "#ffffff" },
  COMPLETED: { bg: "#6b7280", border: "#4b5563", text: "#ffffff" },
  CANCELLED: { bg: "#9ca3af", border: "#6b7280", text: "#ffffff" },
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Upcoming",
  LIVE: "Live Now",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  SCHEDULED: "default",
  LIVE: "destructive",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

export default function CalendarPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryParam = selectedCourseId !== "all" ? `?courseId=${selectedCourseId}` : "";

  const { data, isLoading } = useQuery<CalendarResponse>({
    queryKey: ["calendar-events", selectedCourseId],
    queryFn: async () => {
      const res = await fetch(`/api/calendar${queryParam}`);
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      return res.json();
    },
  });

  const calendarEvents = useMemo(() => {
    if (!data?.events) return [];
    return data.events.map((event) => {
      const colors = STATUS_COLORS[event.extendedProps.status] || STATUS_COLORS.SCHEDULED;
      return {
        ...event,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
      };
    });
  }, [data?.events]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const { event } = info;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start!,
      end: event.end || event.start!,
      courseTitle: event.extendedProps.courseTitle,
      courseId: event.extendedProps.courseId,
      lectureId: event.extendedProps.lectureId,
      type: event.extendedProps.type,
      status: event.extendedProps.status,
      description: event.extendedProps.description,
      recordingUrl: event.extendedProps.recordingUrl,
    });
    setDialogOpen(true);
  }, []);

  const googleCalUrl = useMemo(() => {
    if (!selectedEvent) return "";
    return generateGoogleCalendarUrl({
      title: `${selectedEvent.title} - ${selectedEvent.courseTitle}`,
      startDate: selectedEvent.start,
      endDate: selectedEvent.end,
      description: selectedEvent.description,
    });
  }, [selectedEvent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            View your upcoming lectures and schedule.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Upcoming
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Live
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              Cancelled
            </span>
          </div>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {data?.courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-[600px] w-full" />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            contentHeight={650}
            eventDisplay="block"
            dayMaxEvents={3}
            nowIndicator
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedEvent.type === "LIVE" ? (
                    <Video className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  )}
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription>{selectedEvent.courseTitle}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE_VARIANT[selectedEvent.status] || "outline"}>
                    {STATUS_LABELS[selectedEvent.status] || selectedEvent.status}
                  </Badge>
                  <Badge variant="outline">
                    {selectedEvent.type === "LIVE" ? "Live Lecture" : "Recorded"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{formatDate(selectedEvent.start)}</span>
                  </div>
                  {selectedEvent.description && (
                    <p className="text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {(selectedEvent.status === "SCHEDULED" ||
                    selectedEvent.status === "LIVE") &&
                    selectedEvent.type === "LIVE" && (
                      <Button asChild>
                        <a href={`/live/${selectedEvent.lectureId}`}>
                          <Video className="mr-2 h-4 w-4" />
                          {selectedEvent.status === "LIVE"
                            ? "Join Live Session"
                            : "Join When Live"}
                        </a>
                      </Button>
                    )}

                  {selectedEvent.status === "COMPLETED" &&
                    selectedEvent.recordingUrl && (
                      <Button asChild variant="outline">
                        <a href={selectedEvent.recordingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-2 h-4 w-4" />
                          Watch Recording
                        </a>
                      </Button>
                    )}

                  {selectedEvent.status === "SCHEDULED" && (
                    <Button asChild variant="outline">
                      <a href={googleCalUrl} target="_blank" rel="noopener noreferrer">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Add to Google Calendar
                      </a>
                    </Button>
                  )}

                  <Button asChild variant="ghost">
                    <a href={`/courses/${selectedEvent.courseId}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Course
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
