import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Pencil,
  PlayCircle,
  ShoppingCart,
  Users,
  Video,
  Calendar,
} from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPrice, formatDate, getStorageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PageProps {
  params: { courseId: string };
}

async function getCourse(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: {
        select: { id: true, name: true, avatar: true, bio: true },
      },
      lectures: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          scheduledAt: true,
          duration: true,
          sortOrder: true,
        },
      },
      resources: {
        select: {
          id: true,
          title: true,
          fileUrl: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  return course;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function CourseDetailPage({ params }: PageProps) {
  const [course, session] = await Promise.all([
    getCourse(params.courseId),
    auth(),
  ]);

  if (!course) notFound();

  const isOwner = session?.user?.id === course.teacherId;
  const isAdmin = session?.user?.role === "ADMIN";

  if (course.status !== "PUBLISHED" && !isOwner && !isAdmin) {
    notFound();
  }

  let isEnrolled = false;
  if (session?.user?.id) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId: course.id,
        },
      },
    });
    isEnrolled = !!enrollment;
  }

  const enrollmentCount = course._count.enrollments;
  const lectureCount = course.lectures.length;
  const liveLectures = course.lectures.filter((l) => l.type === "LIVE").length;
  const recordedLectures = course.lectures.filter((l) => l.type === "RECORDED").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            {course.thumbnail ? (
              <Image
                src={getStorageUrl(course.thumbnail)}
                alt={course.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <GraduationCap className="h-20 w-20 text-primary/30" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>{course.subject}</Badge>
            <Badge variant="outline">{course.gradeLevel}</Badge>
            {course.status !== "PUBLISHED" && (
              <Badge variant="warning">{course.status}</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>

          {/* Teacher Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(course.teacher.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{course.teacher.name}</p>
              {course.teacher.bio && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {course.teacher.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {enrollmentCount} student{enrollmentCount !== 1 ? "s" : ""} enrolled
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {lectureCount} lecture{lectureCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Updated {formatDate(course.updatedAt)}
            </span>
          </div>
        </div>

        {/* Sidebar Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-4">
              <div className="text-3xl font-bold">
                {course.price.toNumber() === 0
                  ? "Free"
                  : formatPrice(course.price.toNumber())}
              </div>

              {isOwner ? (
                <div className="space-y-2">
                  <Link href={`/create-course?courseId=${course.id}`} className="block">
                    <Button className="w-full" size="lg">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    {enrollmentCount} student{enrollmentCount !== 1 ? "s" : ""} enrolled
                  </p>
                </div>
              ) : isEnrolled ? (
                <div className="space-y-2">
                  <Button className="w-full" size="lg" variant="outline" disabled>
                    Already Enrolled
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You have access to this course
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {session?.user ? (
                    <Button className="w-full" size="lg">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  ) : (
                    <Link href="/login" className="block">
                      <Button className="w-full" size="lg">
                        Sign in to Enroll
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{course.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Grade Level</span>
                  <span className="font-medium">{course.gradeLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lectures</span>
                  <span className="font-medium">{lectureCount}</span>
                </div>
                {liveLectures > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Live Sessions</span>
                    <span className="font-medium">{liveLectures}</span>
                  </div>
                )}
                {course.resources.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Resources</span>
                    <span className="font-medium">{course.resources.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">
            Curriculum ({lectureCount})
          </TabsTrigger>
          <TabsTrigger value="resources">
            Resources ({course.resources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About This Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-wrap">
                {course.description}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              {course.lectures.length > 0 ? (
                <div className="space-y-1">
                  {course.lectures.map((lecture, index) => (
                    <div
                      key={lecture.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{lecture.title}</p>
                        {lecture.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {lecture.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lecture.type === "LIVE" ? (
                          <Badge variant="success" className="text-xs">
                            <Video className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Recorded
                          </Badge>
                        )}
                        {lecture.duration && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lecture.duration} min
                          </span>
                        )}
                        {lecture.scheduledAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(lecture.scheduledAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No lectures added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Resources</CardTitle>
            </CardHeader>
            <CardContent>
              {course.resources.length > 0 ? (
                <div className="space-y-1">
                  {course.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted flex-shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {resource.fileType.toUpperCase()} &middot;{" "}
                          {formatFileSize(resource.fileSize)}
                        </p>
                      </div>
                      {(isEnrolled || isOwner) && (
                        <a
                          href={getStorageUrl(resource.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No resources added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
