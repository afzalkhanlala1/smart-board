"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: Record<string, unknown>;
}

interface CalendarWidgetProps {
  events: CalendarEvent[];
  onEventClick: (info: EventClickArg) => void;
  onDateSelect: (info: DateSelectArg) => void;
}

export default function CalendarWidget({
  events,
  onEventClick,
  onDateSelect,
}: CalendarWidgetProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={events}
      eventClick={onEventClick}
      selectable={true}
      select={onDateSelect}
      editable={false}
      dayMaxEvents={3}
      nowIndicator={true}
      height="auto"
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        meridiem: "short",
      }}
    />
  );
}
