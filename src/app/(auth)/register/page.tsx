"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MonitorPlay, GraduationCap, Users, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type RegisterRole = "STUDENT" | "TEACHER";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<RegisterRole>("STUDENT");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data: { error?: string; message?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        toast.error(
          typeof data.error === "string" ? data.error : "Registration failed",
        );
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error("Account created but sign-in failed. Try logging in.");
        router.push("/login");
        return;
      }

      if (role === "TEACHER") {
        toast.success(
          data.message ??
            "Registration successful. Your teacher account is pending admin approval.",
        );
        router.push("/pending-approval");
        router.refresh();
      } else {
        toast.success(data.message ?? "Welcome! Your account is ready.");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 py-10 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/8 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-sky-700/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/30">
            <MonitorPlay className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Create an account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join Edutania today
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-black/20">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Role selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I want to join as</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setRole("STUDENT")}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    role === "STUDENT"
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        role === "STUDENT"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <GraduationCap className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-foreground">Student</p>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Enroll, attend live sessions, track progress.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setRole("TEACHER")}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    role === "TEACHER"
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        role === "TEACHER"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Users className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-foreground">Teacher</p>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Create courses, host classes, earn. Approval required.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                disabled={isLoading}
                className="bg-secondary/50 border-border/60 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-secondary/50 border-border/60 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="bg-secondary/50 border-border/60 focus:border-primary focus:ring-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 shadow-md shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
