"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  courseId: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  fullWidth?: boolean;
}

export function AddToCartButton({
  courseId,
  className,
  size = "lg",
  variant = "default",
  fullWidth = true,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [, startTransition] = useTransition();

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading || added) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && /already in your cart/i.test(data?.error ?? "")) {
          setAdded(true);
          toast.message("Already in your cart", {
            action: {
              label: "View cart",
              onClick: () => router.push("/cart"),
            },
          });
          return;
        }
        if (res.status === 409 && /already enrolled/i.test(data?.error ?? "")) {
          toast.success("You already own this course");
          startTransition(() => router.refresh());
          return;
        }
        throw new Error(data?.error || "Could not add to cart");
      }

      setAdded(true);
      toast.success("Added to cart", {
        action: {
          label: "View cart",
          onClick: () => router.push("/cart"),
        },
      });
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={added ? "outline" : variant}
      className={fullWidth ? `w-full ${className ?? ""}` : className}
      onClick={handleAdd}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding…
        </>
      ) : added ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          In Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
