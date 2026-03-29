import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getProgressPercent(progress: unknown): number {
  if (!progress || typeof progress !== "object") return 0;

  const p = progress as Record<string, unknown>;
  const completed = Object.values(p).filter(Boolean).length;
  const total = Object.keys(p).length;

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export default async function MyCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: session.user.id,
      paymentStatus: "COMPLETED",
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          subject: true,
          gradeLevel: true,
          teacher: { select: { name: true } },
          _count: { select: { lectures: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 rounded-full bg-muted p-6">
          <GraduationCap className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          No courses yet
        </h2>
        <p className="mt-2 text-muted-foreground">
          You haven&apos;t enrolled in any courses. Browse the catalog to get
          started!
        </p>
        <Button asChild className="mt-6">
          <Link href="/courses">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          My Courses
        </h2>
        <p className="text-muted-foreground">
          {enrollments.length}{" "}
          {enrollments.length === 1 ? "course" : "courses"} enrolled
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => {
          const { course } = enrollment;
          const progress = getProgressPercent(enrollment.progress);

          return (
            <Card
              key={enrollment.id}
              className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-video bg-muted">
                {course.thumbnail ? (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {course.subject}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {course.gradeLevel}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1 text-base">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {course.teacher.name}
                </p>
              </CardHeader>

              <CardContent className="flex-1 pb-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {course.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {course._count.lectures}{" "}
                  {course._count.lectures === 1 ? "lecture" : "lectures"}
                </p>
              </CardContent>

              <CardFooter className="flex-col items-stretch gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <Button asChild className="w-full" size="sm">
                  <Link href={`/courses/${course.id}`}>
                    {progress > 0 ? "Continue Learning" : "Start Learning"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
