"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoursePublishToggleProps {
  courseId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  size?: "sm" | "default";
}

export function CoursePublishToggle({
  courseId,
  status,
  size = "sm",
}: CoursePublishToggleProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const isPublished = status === "PUBLISHED";
  const nextStatus = isPublished ? "DRAFT" : "PUBLISHED";

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Update failed");
      }
      toast.success(isPublished ? "Course unpublished" : "Course published");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggle}
      disabled={loading}
      title={isPublished ? "Unpublish" : "Publish"}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPublished ? (
        <EyeOff className="h-3.5 w-3.5" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
