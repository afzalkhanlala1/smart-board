import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, GraduationCap, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPrice, formatDate, getStorageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            Manage your courses and track enrollments
          </p>
        </div>
        <Link href="/create-course">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </Link>
      </div>

      {courses.length > 0 ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{courses.length}</p>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {courses.filter((c) => c.status === "PUBLISHED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {courses.reduce((sum, c) => sum + c._count.enrollments, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Enrollments</p>
                </div>
              </CardContent>
            </Card>
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
                          <Link href={`/create-course?courseId=${course.id}`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No courses yet</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md">
            Create your first course and start teaching students.
          </p>
          <Link href="/create-course">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
