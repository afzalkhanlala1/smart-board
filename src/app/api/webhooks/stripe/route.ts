import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { fulfillCoursePurchase } from "@/lib/enrollment";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes("placeholder")) {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    let courseIds: string[] = [];
    try {
      courseIds = JSON.parse(courseIdsRaw);
    } catch {
      return NextResponse.json(
        { error: "Invalid courseIds metadata" },
        { status: 400 }
      );
    }

    try {
      await fulfillCoursePurchase({
        studentId,
        courseIds,
        stripeSessionId: session.id,
        stripePaymentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      });

      const courses = await db.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true },
      });

      await Promise.all(
        courses.map((c) =>
          createNotification({
            userId: studentId,
            title: "Enrollment successful",
            message: `You've been enrolled in "${c.title}".`,
            type: "ENROLLMENT",
            link: `/courses/${c.id}`,
          })
        )
      );
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
