import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { fulfillCoursePurchase } from "@/lib/enrollment";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  searchParams: { session_id?: string; mock?: string };
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let enrolledCourses: { id: string; title: string; price: number }[] = [];

  // If we're returning from a real Stripe session, verify it and make sure
  // fulfillment ran (webhook may not be configured in local dev).
  if (
    searchParams.session_id &&
    isStripeConfigured() &&
    stripe &&
    !searchParams.mock
  ) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(
        searchParams.session_id
      );

      if (
        checkout.payment_status === "paid" &&
        checkout.metadata?.studentId === session.user.id
      ) {
        const courseIds: string[] = JSON.parse(
          checkout.metadata?.courseIds ?? "[]"
        );
        await fulfillCoursePurchase({
          studentId: session.user.id,
          courseIds,
          stripeSessionId: checkout.id,
          stripePaymentId:
            typeof checkout.payment_intent === "string"
              ? checkout.payment_intent
              : checkout.payment_intent?.id ?? null,
        });
      }
    } catch (err) {
      console.error("Could not verify Stripe session:", err);
    }
  }

  // Show the most recent completed enrollments so the user sees what they got.
  const recentEnrollments = await db.enrollment.findMany({
    where: { studentId: session.user.id, paymentStatus: "COMPLETED" },
    include: { course: { select: { id: true, title: true, price: true } } },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });
  enrolledCourses = recentEnrollments.map((e) => ({
    id: e.course.id,
    title: e.course.title,
    price: Number(e.course.price),
  }));

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {searchParams.mock ? "Enrollment Successful!" : "Payment Successful!"}
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You now have access to your new courses. Start learning right away!
          </p>

          {enrolledCourses.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border text-left">
              {enrolledCourses.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/60 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {c.title}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {c.price === 0 ? "Free" : formatPrice(c.price)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/my-courses">Go to My Courses</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/courses">Browse More Courses</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
