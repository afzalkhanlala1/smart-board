"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, LogOut } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div
              className="h-20 w-20 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-500/30"
              aria-hidden
            >
              <ClipboardCheck className="h-10 w-10 text-amber-700 dark:text-amber-400" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Your teacher account is pending approval
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Thanks for registering. An administrator will review your account
              shortly. Once approved, you can access your dashboard and start
              creating courses.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            You can sign out and return later, or use another tab to read our
            help center while you wait.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 min-w-[140px]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
