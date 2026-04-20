import { db } from "@/lib/db";
import { calculateFees } from "@/lib/stripe";

export async function hasAccessToCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId } },
  });
  return enrollment?.paymentStatus === "COMPLETED";
}

export async function getCartCount(userId: string): Promise<number> {
  return db.cartItem.count({ where: { studentId: userId } });
}

interface FulfillOptions {
  studentId: string;
  courseIds: string[];
  stripeSessionId?: string | null;
  stripePaymentId?: string | null;
  clearCart?: boolean;
}

/**
 * Shared fulfillment path used by the Stripe webhook and the dev-mode
 * checkout. Creates/updates Transaction rows, grants enrollment and bumps
 * teacher earnings in a single DB transaction.
 *
 * Uses `upsert` on the composite unique (`stripeSessionId`, `courseId`) so
 * the handler is idempotent — replaying the same event will not double
 * credit the teacher.
 */
export async function fulfillCoursePurchase({
  studentId,
  courseIds,
  stripeSessionId = null,
  stripePaymentId = null,
  clearCart = true,
}: FulfillOptions): Promise<{ enrolled: string[] }> {
  const enrolled: string[] = [];

  await db.$transaction(async (tx) => {
    for (const courseId of courseIds) {
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { price: true, teacherId: true },
      });
      if (!course) continue;

      const existingEnrollment = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
        select: { paymentStatus: true },
      });
      const alreadyPaid = existingEnrollment?.paymentStatus === "COMPLETED";

      const amount = Number(course.price);
      const fees = calculateFees(amount);

      if (stripeSessionId) {
        await tx.transaction.upsert({
          where: {
            stripeSessionId_courseId: { stripeSessionId, courseId },
          },
          create: {
            studentId,
            courseId,
            amount,
            platformFee: fees.platformFee,
            teacherEarning: fees.teacherEarning,
            stripePaymentId,
            stripeSessionId,
            status: "COMPLETED",
          },
          update: {
            status: "COMPLETED",
            stripePaymentId,
          },
        });
      } else {
        await tx.transaction.create({
          data: {
            studentId,
            courseId,
            amount,
            platformFee: fees.platformFee,
            teacherEarning: fees.teacherEarning,
            stripePaymentId,
            stripeSessionId,
            status: "COMPLETED",
          },
        });
      }

      await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        create: { studentId, courseId, paymentStatus: "COMPLETED" },
        update: { paymentStatus: "COMPLETED" },
      });

      // Only credit the teacher the first time this course is fulfilled
      // for this student — avoids double counting on webhook retries.
      if (!alreadyPaid) {
        await tx.teacherEarning.upsert({
          where: { teacherId: course.teacherId },
          create: {
            teacherId: course.teacherId,
            totalEarned: fees.teacherEarning,
            pendingBalance: fees.teacherEarning,
          },
          update: {
            totalEarned: { increment: fees.teacherEarning },
            pendingBalance: { increment: fees.teacherEarning },
          },
        });
      }

      enrolled.push(courseId);
    }

    if (clearCart) {
      await tx.cartItem.deleteMany({ where: { studentId } });
    }
  });

  return { enrolled };
}
