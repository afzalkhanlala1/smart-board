import { redirect } from "next/navigation";
import { CheckCircle, XCircle, UserCheck, UserX, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TeacherActions } from "./teacher-actions";

export default async function AdminTeachersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [pendingTeachers, approvedTeachers] = await Promise.all([
    db.user.findMany({
      where: { role: "TEACHER", isApproved: false },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "TEACHER", isApproved: true },
      orderBy: { name: "asc" },
      include: {
        courses: {
          select: {
            id: true,
            _count: { select: { enrollments: true } },
          },
        },
        teacherEarning: {
          select: { totalEarned: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Teacher Management</h1>
        <p className="text-muted-foreground">
          Review applications and manage approved teachers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Pending Approval"
          value={pendingTeachers.length}
          description="Awaiting review"
          icon={UserX}
        />
        <StatsCard
          title="Approved Teachers"
          value={approvedTeachers.length}
          description="Currently active"
          icon={UserCheck}
        />
        <StatsCard
          title="Total Teachers"
          value={pendingTeachers.length + approvedTeachers.length}
          description="All registered teachers"
          icon={Users}
        />
      </div>

      {/* Pending Approval */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approval</CardTitle>
          <CardDescription>
            Teachers waiting for account verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTeachers.length > 0 ? (
            <div className="space-y-4">
              {pendingTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {teacher.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium">{teacher.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.email}
                      </p>
                      {teacher.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-lg">
                          {teacher.bio}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Registered {formatDate(teacher.createdAt)}
                      </p>
                    </div>
                  </div>
                  <TeacherActions teacherId={teacher.id} status="pending" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-green-500/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No pending applications
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Teachers */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Teachers</CardTitle>
          <CardDescription>
            Active teachers on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Courses</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedTeachers.map((teacher) => {
                    const courseCount = teacher.courses.length;
                    const studentCount = teacher.courses.reduce(
                      (sum, c) => sum + c._count.enrollments,
                      0
                    );
                    const earnings =
                      teacher.teacherEarning?.totalEarned.toNumber() ?? 0;

                    return (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {teacher.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{teacher.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {teacher.email}
                        </TableCell>
                        <TableCell className="text-center">{courseCount}</TableCell>
                        <TableCell className="text-center">{studentCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(earnings)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">Approved</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No approved teachers yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
