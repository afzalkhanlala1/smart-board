import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  DollarSign,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/dashboard/stats-card";

const STATUS_VARIANT: Record<string, "default" | "success" | "secondary" | "warning"> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const statusFilter = searchParams.status?.toUpperCase();
  const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  const whereStatus =
    statusFilter && validStatuses.includes(statusFilter)
      ? { status: statusFilter as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
      : {};

  const [courses, stats] = await Promise.all([
    db.course.findMany({
      where: whereStatus,
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    }),
    db.course.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    stats.map((s) => [s.status, s._count.id])
  );

  const totalCourses =
    (statusCounts.DRAFT ?? 0) +
    (statusCounts.PUBLISHED ?? 0) +
    (statusCounts.ARCHIVED ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Management</h1>
        <p className="text-muted-foreground">
          View and manage all courses on the platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Courses"
          value={totalCourses}
          icon={BookOpen}
        />
        <StatsCard
          title="Published"
          value={statusCounts.PUBLISHED ?? 0}
          icon={GraduationCap}
        />
        <StatsCard
          title="Drafts"
          value={statusCounts.DRAFT ?? 0}
          icon={BookOpen}
        />
        <StatsCard
          title="Archived"
          value={statusCounts.ARCHIVED ?? 0}
          icon={BookOpen}
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Filter:
        </span>
        <div className="flex gap-1">
          {[
            { label: "All", value: "" },
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ].map((filter) => {
            const isActive =
              (!searchParams.status && filter.value === "") ||
              searchParams.status === filter.value;
            return (
              <Link
                key={filter.value}
                href={
                  filter.value
                    ? `/admin/courses?status=${filter.value}`
                    : "/admin/courses"
                }
              >
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {filter.label}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>
            {courses.length} course{courses.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Title</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Enrollments</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => {
                    const revenue = course.transactions.reduce(
                      (sum, tx) => sum + tx.amount.toNumber(),
                      0
                    );

                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Link
                            href={`/courses/${course.id}`}
                            className="font-medium hover:underline line-clamp-1"
                          >
                            {course.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {course.subject} &middot; {course.gradeLevel}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.teacher.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[course.status]}>
                            {course.status.charAt(0) +
                              course.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {course.price.toNumber() === 0
                            ? "Free"
                            : formatPrice(course.price.toNumber())}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {course._count.enrollments}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(revenue)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(course.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No courses match the selected filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
