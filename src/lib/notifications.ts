import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  return db.notification.create({ data: params });
}

export async function notifyEnrolledStudents(
  courseId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string
) {
  const enrollments = await db.enrollment.findMany({
    where: { courseId, paymentStatus: "COMPLETED" },
    select: { studentId: true },
  });

  if (enrollments.length === 0) return;

  return db.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.studentId,
      title,
      message,
      type,
      link,
    })),
  });
}

export function generateGoogleCalendarUrl(params: {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
}) {
  const url = new URL("https://calendar.google.com/calendar/event");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set(
    "dates",
    `${formatGCalDate(params.startDate)}/${formatGCalDate(params.endDate)}`
  );
  if (params.description) url.searchParams.set("details", params.description);
  if (params.location) url.searchParams.set("location", params.location);
  return url.toString();
}

function formatGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
