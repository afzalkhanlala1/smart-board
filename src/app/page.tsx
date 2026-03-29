import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  MonitorPlay,
  GraduationCap,
  BookOpen,
  Bot,
  ShieldCheck,
  Eye,
  ArrowRight,
  Star,
  Users,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const features = [
    {
      title: "Live SmartBoard Classes",
      description:
        "Real-time annotations, drawing tools, and interactive teaching on a professional smart board interface.",
      icon: MonitorPlay,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Expert Certified Teachers",
      description:
        "Vetted instructors with structured curriculum paths aligned to UAE, British, American, IB, and CBSE standards.",
      icon: GraduationCap,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Cloud Recordings",
      description:
        "Every session is auto-recorded in full HD. Rewatch anytime from any device with full smart board overlay.",
      icon: BookOpen,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "STEM & Robotics",
      description:
        "Robotics, coding, AI fundamentals, and applied sciences — structured, graded curricula for all age groups.",
      icon: Bot,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Secure Payments",
      description:
        "Flexible plans — per class, monthly, per term, or annual. Trusted checkout with full billing transparency.",
      icon: ShieldCheck,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      title: "Parent Dashboard",
      description:
        "Full visibility for parents — recordings, attendance, progress reports, and invoices from one login.",
      icon: Eye,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Students enrolled" },
    { value: "500+", label: "Courses available" },
    { value: "50+", label: "Certified teachers" },
    { value: "4.9★", label: "Average rating" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
              <MonitorPlay className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              SmartBoard{" "}
              <span className="text-primary">Academy</span>
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20" asChild>
              <Link href="/register">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:pb-24 sm:pt-32 sm:px-6">
          {/* Background glow orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[130px]" />
            <div className="absolute left-0 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-emerald-700/6 blur-[100px]" />
            <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-sky-700/5 blur-[100px]" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Next-Generation EdTech Platform
            </div>

            <h1 className="text-balance text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl md:text-7xl">
              Where great{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                teaching
              </span>{" "}
              meets{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-clip-text text-transparent">
                technology
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Full-curriculum, STEM-enriched education delivered via professional
              smart board technology. Live classes, cloud recordings, and
              transparent parent dashboards — all in one platform.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="min-w-[190px] gap-2 shadow-lg shadow-primary/25"
                asChild
              >
                <Link href="/courses">
                  <PlayCircle className="h-4 w-4" />
                  Start learning
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-[190px]"
                asChild
              >
                <Link href="/register?role=teacher">Become a teacher</Link>
              </Button>
            </div>

            {/* Trust pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                Rated 4.9 by students
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                10,000+ enrolled
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                UAE, British & IB aligned
              </span>
            </div>
          </div>
        </section>

        {/* ── Stats band ─────────────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-card/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 divide-x divide-border/60 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="py-8 text-center">
                  <p className="text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                Platform Features
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to teach and learn
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A complete education ecosystem for live instruction, cloud
                recordings, STEM labs, and full parental visibility.
              </p>
            </div>

            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title, description, icon: Icon, color, bg }) => (
                <li
                  key={title}
                  className="group relative rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${bg} ${color} transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Social proof ──────────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-card/20 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
                Why SmartBoard
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Built for serious learners
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "68% higher completion rate",
                  body: "Students on SmartBoard Academy complete courses at nearly twice the industry average.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  icon: MonitorPlay,
                  title: "Professional studio quality",
                  body: "Every live session uses a real smart board interface — not just a screen share or webcam.",
                  color: "text-sky-400",
                  bg: "bg-sky-500/10",
                },
                {
                  icon: Users,
                  title: "Curriculum-aligned content",
                  body: "Courses are structured to UAE, British, American, IB, and CBSE educational standards.",
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-card p-6"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} ${item.color}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card px-6 py-14 text-center sm:px-12 sm:py-20">
              {/* Glow blob */}
              <div className="pointer-events-none absolute -top-20 left-1/2 h-[250px] w-[500px] -translate-x-1/2 rounded-full bg-primary/15 blur-[90px]" />

              <div className="relative">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Free to get started
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to begin your journey?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                  Create a free account to enroll in courses or apply to teach
                  on the SmartBoard Academy platform.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="shadow-lg shadow-primary/20 gap-1.5"
                    asChild
                  >
                    <Link href="/register">
                      Create free account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/courses">Explore catalog</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary shadow shadow-primary/30">
              <MonitorPlay className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SmartBoard Academy</span>
          </div>
          <p>&copy; {new Date().getFullYear()} SmartBoard Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
