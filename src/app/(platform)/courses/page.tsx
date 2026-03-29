import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CourseCard } from "@/components/course/course-card";
import { CourseFilters, CourseSortSelect } from "@/components/course/course-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface PageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    subject?: string;
    grade?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

async function getCourses(searchParams: PageProps["searchParams"]) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.limit || "12")));
  const search = searchParams.search || "";
  const subject = searchParams.subject || "";
  const grade = searchParams.grade || "";
  const minPrice = searchParams.minPrice || "";
  const maxPrice = searchParams.maxPrice || "";
  const sort = searchParams.sort || "newest";

  const where: Prisma.CourseWhereInput = {
    status: "PUBLISHED",
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (subject) where.subject = subject;
  if (grade) where.gradeLevel = grade;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = new Prisma.Decimal(minPrice);
    if (maxPrice) where.price.lte = new Prisma.Decimal(maxPrice);
  }

  const orderBy: Prisma.CourseOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" }
    : sort === "price-low" ? { price: "asc" }
    : sort === "price-high" ? { price: "desc" }
    : sort === "title" ? { title: "asc" }
    : { createdAt: "desc" };

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        teacher: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  return {
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      subject: c.subject,
      gradeLevel: c.gradeLevel,
      price: c.price.toNumber(),
      enrollmentCount: c._count.enrollments,
      teacher: c.teacher,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CourseCatalogPage({ searchParams }: PageProps) {
  const { courses, pagination } = await getCourses(searchParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Browse Courses</h1>
          <p className="text-muted-foreground">
            Discover {pagination.total} course{pagination.total !== 1 ? "s" : ""} from expert teachers
          </p>
        </div>
        <div className="hidden lg:block">
          <Suspense>
            <CourseSortSelect />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-6">
            <Suspense>
              <CourseFilters />
            </Suspense>
          </div>
        </aside>

        {/* Course Grid */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<CourseGridSkeleton />}>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No courses found</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Try adjusting your search or filter criteria to find courses.
                </p>
              </div>
            )}
          </Suspense>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link
                  href={{
                    pathname: "/courses",
                    query: { ...searchParams, page: String(pagination.page - 1) },
                  }}
                >
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  const current = pagination.page;
                  return p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 2;
                })
                .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push("ellipsis");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "ellipsis" ? (
                    <span key={`e-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={{
                        pathname: "/courses",
                        query: { ...searchParams, page: String(item) },
                      }}
                    >
                      <Button
                        variant={item === pagination.page ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                      >
                        {item}
                      </Button>
                    </Link>
                  )
                )}

              {pagination.page < pagination.totalPages && (
                <Link
                  href={{
                    pathname: "/courses",
                    query: { ...searchParams, page: String(pagination.page + 1) },
                  }}
                >
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
