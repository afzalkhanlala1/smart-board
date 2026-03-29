import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { teacherId: string } }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teacherId } = params;
  const body = await request.json();
  const { action } = body as { action: "approve" | "reject" };

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'reject'." },
      { status: 400 }
    );
  }

  const teacher = await db.user.findUnique({
    where: { id: teacherId },
  });

  if (!teacher || teacher.role !== "TEACHER") {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  if (action === "approve") {
    await db.$transaction([
      db.user.update({
        where: { id: teacherId },
        data: { isApproved: true },
      }),
      db.teacherEarning.upsert({
        where: { teacherId },
        create: { teacherId },
        update: {},
      }),
      db.notification.create({
        data: {
          userId: teacherId,
          title: "Account Approved",
          message:
            "Your teacher account has been approved! You can now create and publish courses.",
          type: "TEACHER_APPROVED",
          link: "/dashboard",
        },
      }),
    ]);
  } else {
    // Demote to STUDENT rather than hard-deleting, so the account is
    // preserved for audit purposes and the user can still log in.
    await db.user.update({
      where: { id: teacherId },
      data: { role: "STUDENT", isApproved: false },
    });
  }

  return NextResponse.json({ success: true });
}
