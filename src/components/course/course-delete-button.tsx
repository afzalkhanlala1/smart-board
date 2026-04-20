"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseDeleteButtonProps {
  courseId: string;
  courseTitle: string;
  redirectTo?: string;
  size?: "sm" | "default";
  variant?: "outline" | "destructive" | "ghost";
  iconOnly?: boolean;
}

export function CourseDeleteButton({
  courseId,
  courseTitle,
  redirectTo = "/teacher/courses",
  size = "sm",
  variant = "outline",
  iconOnly = false,
}: CourseDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete course");
      }
      toast.success("Course deleted");
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive"
        title="Delete course"
      >
        <Trash2 className={iconOnly ? "h-3.5 w-3.5" : "h-4 w-4 mr-2"} />
        {!iconOnly && "Delete"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete course</DialogTitle>
            <DialogDescription>
              This will permanently delete <b>{courseTitle}</b> along with all
              lectures, resources, chat history and recordings. Enrolled
              students will lose access. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
