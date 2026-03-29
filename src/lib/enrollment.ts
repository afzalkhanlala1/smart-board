import { db } from "@/lib/db";

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
