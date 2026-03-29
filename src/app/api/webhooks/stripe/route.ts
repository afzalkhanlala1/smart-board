import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const studentId = session.metadata?.studentId;
    const courseIdsRaw = session.metadata?.courseIds;

    if (!studentId || !courseIdsRaw) {
      console.error("Missing metadata in checkout session", session.id);
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    const courseIds: string[] = JSON.parse(courseIdsRaw);

    try {
      await db.$transaction(async (tx) => {
        for (const courseId of courseIds) {
          const course = await tx.course.findUnique({
            where: { id: courseId },
            select: { price: true, teacherId: true },
          });

          if (!course) continue;

          const amount = Number(course.price);
          const fees = calculateFees(amount);

          await tx.transaction.create({
            data: {
              studentId,
              courseId,
              amount,
              platformFee: fees.platformFee,
              teacherEarning: fees.teacherEarning,
              stripePaymentId: session.payment_intent as string | null,
              stripeSessionId: session.id,
              status: "COMPLETED",
            },
          });

          await tx.enrollment.upsert({
            where: {
              studentId_courseId: { studentId, courseId },
            },
            create: {
              studentId,
              courseId,
              paymentStatus: "COMPLETED",
            },
            update: {
              paymentStatus: "COMPLETED",
            },
          });

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

        await tx.cartItem.deleteMany({
          where: { studentId },
        });
      });
    } catch (error) {
      console.error("Error processing checkout session:", error);
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
