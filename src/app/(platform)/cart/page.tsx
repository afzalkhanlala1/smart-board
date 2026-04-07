"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, ShoppingCart, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

interface CartCourse {
  id: string;
  title: string;
  price: string | number;
  thumbnail: string | null;
  teacher: { name: string };
}

interface CartItem {
  id: string;
  courseId: string;
  addedAt: string;
  course: CartCourse;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Failed to load cart");
      const data = await res.json();
      setItems(data.items);
    } catch {
      toast.error("Could not load your cart");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(courseId: string) {
    setRemovingId(courseId);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove item");
      }

      setItems((prev) => prev.filter((item) => item.courseId !== courseId));
      toast.success("Removed from cart");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove item"
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout"
      );
      setCheckingOut(false);
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.course.price),
    0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-lg border border-border bg-card p-4"
              >
                <Skeleton className="h-20 w-28 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h3 className="font-bold text-lg">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Browse our course catalog and find something to learn!
        </p>
        <Button asChild className="mt-4 gap-2">
          <Link href="/courses">
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {items.length} {items.length === 1 ? "course" : "courses"} in your
          cart
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.course.thumbnail ? (
                  <Image
                    src={item.course.thumbnail}
                    alt={item.course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {item.course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.course.teacher.name}
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatPrice(item.course.price)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.courseId)}
                disabled={removingId === item.courseId}
              >
                {removingId === item.courseId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({items.length}{" "}
                  {items.length === 1 ? "item" : "items"})
                </span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
