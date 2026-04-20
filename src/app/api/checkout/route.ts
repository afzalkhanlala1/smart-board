import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { fulfillCoursePurchase } from "@/lib/enrollment";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await db.cartItem.findMany({
      where: { studentId: session.user.id },
      include: {
        course: {
          select: { id: true, title: true, price: true },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const courseIds = cartItems.map((item) => item.course.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Mock checkout for local development when Stripe isn't configured.
    // Students get instant enrollment so the rest of the platform is testable.
    if (!isStripeConfigured() || !stripe) {
      await fulfillCoursePurchase({
        studentId: session.user.id,
        courseIds,
      });

      await Promise.all(
        cartItems.map((item) =>
          createNotification({
            userId: session.user.id,
            title: "Enrollment successful",
            message: `You've been enrolled in "${item.course.title}".`,
            type: "ENROLLMENT",
            link: `/courses/${item.course.id}`,
          })
        )
      );

      return NextResponse.json({
        mock: true,
        url: `${appUrl}/cart/success?mock=1`,
      });
    }

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.course.title },
        unit_amount: Math.max(50, Math.round(Number(item.course.price) * 100)),
      },
      quantity: 1,
    }));

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        studentId: session.user.id,
        courseIds: JSON.stringify(courseIds),
      },
      success_url: `${appUrl}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
