import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default function CheckoutCancelPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <XCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Checkout Cancelled
          </h1>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your checkout was cancelled and you have not been charged. Your cart
            items are still saved.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/cart">Return to Cart</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
