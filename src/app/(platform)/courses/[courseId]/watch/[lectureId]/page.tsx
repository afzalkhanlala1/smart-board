import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { VideoPlayer } from "@/components/course/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Video,
  Clock,
  CheckCircle2,
  Play,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export default async function WatchPage({
  params,
}: {
  params: { courseId: string; lectureId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lecture = await db.lecture.findUnique({
    where: { id: params.lectureId },
    include: {
      resources: true,
      course: {
        select: {
          id: true,
          title: true,
          teacherId: true,
          lectures: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              duration: true,
              recordingUrl: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  if (!lecture || lecture.courseId !== params.courseId) notFound();

  const isTeacher = lecture.course.teacherId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  let enrollment: { id: string; progress: unknown } | null = null;
  if (!isTeacher && !isAdmin) {
    enrollment = await db.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId: params.courseId,
        },
      },
      select: { id: true, progress: true },
    });

    if (!enrollment) redirect(`/courses/${params.courseId}`);
  }

  if (!lecture.recordingUrl) {
    redirect(`/courses/${params.courseId}`);
  }

  const allLectures = lecture.course.lectures;
  const currentIndex = allLectures.findIndex((l) => l.id === params.lectureId);
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex < allLectures.length - 1
      ? allLectures[currentIndex + 1]
      : null;

  const progress =
    (enrollment?.progress as Record<string, boolean> | null) ?? {};
  const isWatched = progress[params.lectureId] === true;

  async function markAsWatched() {
    "use server";

    const sess = await auth();
    if (!sess?.user) return;

    const enroll = await db.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: sess.user.id,
          courseId: params.courseId,
        },
      },
    });

    if (!enroll) return;

    const currentProgress =
      (enroll.progress as Record<string, boolean>) || {};
    if (currentProgress[params.lectureId]) return;

    currentProgress[params.lectureId] = true;

    await db.enrollment.update({
      where: { id: enroll.id },
      data: { progress: currentProgress },
    });

    revalidatePath(
      `/courses/${params.courseId}/watch/${params.lectureId}`
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/courses/${params.courseId}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate">
          {lecture.course.title}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <VideoPlayer
            videoUrl={`/api/stream/${params.lectureId}`}
            title={lecture.title}
          />

          <div className="mt-5 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{lecture.title}</h1>
              {lecture.description && (
                <p className="text-muted-foreground mt-2">
                  {lecture.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {lecture.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {lecture.duration} min
                  </span>
                )}
                <Badge variant="outline">{lecture.type}</Badge>
              </div>
            </div>

            {/* Navigation + Mark as watched */}
            <div className="flex items-center gap-3 flex-wrap">
              {prevLecture && (
                <Link
                  href={`/courses/${params.courseId}/watch/${prevLecture.id}`}
                >
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              )}
              {nextLecture && (
                <Link
                  href={`/courses/${params.courseId}/watch/${nextLecture.id}`}
                >
                  <Button variant="outline" size="sm">
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
              <div className="flex-1" />
              {enrollment && !isWatched && (
                <form action={markAsWatched}>
                  <Button type="submit" size="sm" variant="secondary">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Mark as Watched
                  </Button>
                </form>
              )}
              {isWatched && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Watched
                </div>
              )}
            </div>

            {/* Resources */}
            {lecture.resources.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Lecture Resources</h3>
                  <div className="space-y-2">
                    {lecture.resources.map((r) => (
                      <a
                        key={r.id}
                        href={`/api/files/${r.fileUrl}`}
                        download
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Video className="h-4 w-4" />
                        {r.title}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-card border rounded-lg overflow-hidden sticky top-6">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">Course Content</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allLectures.length} lecture{allLectures.length !== 1 && "s"}
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {allLectures.map((l, idx) => {
                const isCurrent = l.id === params.lectureId;
                const watched = progress[l.id] === true;
                const hasRecording = !!l.recordingUrl;

                return (
                  <Link
                    key={l.id}
                    href={
                      hasRecording
                        ? `/courses/${params.courseId}/watch/${l.id}`
                        : "#"
                    }
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm border-b last:border-b-0 transition-colors",
                      isCurrent
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-muted/50",
                      !hasRecording && "opacity-50 cursor-default"
                    )}
                  >
                    <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                      {watched ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : isCurrent ? (
                        <Play className="h-4 w-4 text-primary fill-primary" />
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate",
                          isCurrent && "font-medium text-primary"
                        )}
                      >
                        {l.title}
                      </p>
                      {l.duration && (
                        <p className="text-xs text-muted-foreground">
                          {l.duration} min
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
