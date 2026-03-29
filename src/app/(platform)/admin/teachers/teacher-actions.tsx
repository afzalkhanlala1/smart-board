"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TeacherActionsProps {
  teacherId: string;
  status: "pending" | "approved";
}

export function TeacherActions({ teacherId, status }: TeacherActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(
        action === "approve"
          ? "Teacher approved successfully"
          : "Teacher rejected"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  if (status !== "pending") return null;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-1" />
        )}
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <XCircle className="h-4 w-4 mr-1" />
        )}
        Reject
      </Button>
    </div>
  );
}
