import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Payment Successful!
          </h1>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Thank you for your purchase. You now have access to your new
            courses. Start learning right away!
          </p>
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
