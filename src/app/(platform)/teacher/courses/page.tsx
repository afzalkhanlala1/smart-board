import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, GraduationCap, Pencil, Plus, Settings, Users } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPrice, formatDate, getStorageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoursePublishToggle } from "@/components/course/course-publish-toggle";
import { CourseDeleteButton } from "@/components/course/course-delete-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANTS: Record<string, "default" | "success" | "secondary" | "warning"> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export default async function TeacherCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const courses = await db.course.findMany({
    where: { teacherId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { enrollments: true, lectures: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your courses and track enrollments
          </p>
        </div>
        <Link href="/create-course">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      {courses.length > 0 ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                  <p className="text-3xl font-black mt-1">{courses.length}</p>
                </div>
                <BookOpen className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-sky-500/20 to-sky-500/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-3xl font-black mt-1">{courses.filter((c) => c.status === "PUBLISHED").length}</p>
                </div>
                <GraduationCap className="h-5 w-5 text-sky-400" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Enrollments</p>
                  <p className="text-3xl font-black mt-1">{courses.reduce((sum, c) => sum + c._count.enrollments, 0)}</p>
                </div>
                <Users className="h-5 w-5 text-violet-400" />
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Lectures</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                            {course.thumbnail ? (
                              <Image
                                src={getStorageUrl(course.thumbnail)}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-primary/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/courses/${course.id}`}
                              className="font-medium text-sm hover:underline line-clamp-1"
                            >
                              {course.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {course.subject} &middot; {course.gradeLevel}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[course.status]}>
                          {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {course.price.toNumber() === 0
                          ? "Free"
                          : formatPrice(course.price.toNumber())}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {course._count.enrollments}
                        </span>
                      </TableCell>
                      <TableCell>{course._count.lectures}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(course.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/teacher/courses/${course.id}`}>
                            <Button variant="ghost" size="sm" title="Manage content">
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/create-course?courseId=${course.id}`}>
                            <Button variant="ghost" size="sm" title="Edit details">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <CoursePublishToggle
                            courseId={course.id}
                            status={course.status}
                          />
                          <CourseDeleteButton
                            courseId={course.id}
                            courseTitle={course.title}
                            variant="ghost"
                            iconOnly
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="font-bold text-lg">No courses yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4 max-w-md">
            Create your first course and start teaching students.
          </p>
          <Link href="/create-course">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Course
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
