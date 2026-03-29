import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRoomName } from "@/lib/livekit";
import { LiveRoom } from "@/components/live/live-room";

interface LivePageProps {
  params: { lectureId: string };
}

export default async function LivePage({ params }: LivePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const lecture = await db.lecture.findUnique({
    where: { id: params.lectureId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          teacherId: true,
        },
      },
      liveSession: {
        select: { id: true },
      },
    },
  });

  if (!lecture) {
    redirect("/dashboard");
  }

  if (lecture.type !== "LIVE") {
    redirect(`/courses/${lecture.courseId}`);
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

    if (!enrollment || enrollment.paymentStatus !== "COMPLETED") {
      redirect(`/courses/${lecture.courseId}`);
    }
  }

  const roomName = generateRoomName(params.lectureId);

  return (
    <div className="-m-6">
      <LiveRoom
        lectureId={params.lectureId}
        roomName={roomName}
        userName={session.user.name}
        userId={session.user.id}
        isTeacher={isTeacher || isAdmin}
        courseTitle={lecture.course.title}
        lectureTitle={lecture.title}
        liveSessionId={lecture.liveSession?.id}
      />
    </div>
  );
}
