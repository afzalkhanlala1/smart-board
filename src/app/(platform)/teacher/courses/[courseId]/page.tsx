import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Pencil,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPrice, getStorageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContentLibrary } from "@/components/course/content-library";
import { CourseDeleteButton } from "@/components/course/course-delete-button";

interface PageProps {
  params: { courseId: string };
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "success" | "secondary" | "warning"
> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export default async function TeacherCourseDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      _count: { select: { enrollments: true, lectures: true } },
    },
  });

  if (!course) notFound();
  if (
    course.teacherId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/teacher/courses");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black tracking-tight truncate">
            {course.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {course.subject} &middot; {course.gradeLevel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/create-course?courseId=${course.id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </Link>
          <CourseDeleteButton courseId={course.id} courseTitle={course.title} />
        </div>
      </div>

      <Card>
        <CardContent className="flex gap-6 p-5">
          <div className="relative h-24 w-40 rounded-lg overflow-hidden bg-muted shrink-0">
            {course.thumbnail ? (
              <Image
                src={getStorageUrl(course.thumbnail)}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary/40" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANTS[course.status]}>
                {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {course._count.enrollments} students
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {course._count.lectures} lectures
              </Badge>
              <Badge variant="outline">
                {course.price.toNumber() === 0
                  ? "Free"
                  : formatPrice(course.price.toNumber())}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <ContentLibrary
        courseId={course.id}
        isTeacher
        isEnrolled
      />
    </div>
  );
}
