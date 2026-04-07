"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  MonitorPlay, ArrowRight, Video, Users, Cloud, Cpu, Shield, Star,
  BookOpen, GraduationCap, Sparkles, Play, CheckCircle, ChevronDown,
  Zap, Globe, Award, TrendingUp, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = ["Features", "Courses", "Teachers", "Pricing"];

const STATS = [
  { value: "12,000+", label: "Students", icon: Users },
  { value: "500+", label: "Courses", icon: BookOpen },
  { value: "98%", label: "Satisfaction", icon: Star },
  { value: "50+", label: "Expert Teachers", icon: Award },
];

const FEATURES = [
  { icon: Video, title: "Live Interactive Classes", desc: "Real-time video sessions with raise-hand, chat, and screen sharing — just like being in the classroom.", color: "from-emerald-500/20 to-emerald-500/5", accent: "text-emerald-400" },
  { icon: Cloud, title: "Cloud Recordings", desc: "Every session recorded automatically. Rewatch lectures at your own pace, anytime, anywhere.", color: "from-sky-500/20 to-sky-500/5", accent: "text-sky-400" },
  { icon: Cpu, title: "STEM & Robotics", desc: "Cutting-edge courses in technology, engineering, AI, and robotics for the next generation.", color: "from-violet-500/20 to-violet-500/5", accent: "text-violet-400" },
  { icon: TrendingUp, title: "Progress Analytics", desc: "Detailed dashboards for students and parents to track learning progress and performance.", color: "from-orange-500/20 to-orange-500/5", accent: "text-orange-400" },
  { icon: Shield, title: "Verified Teachers", desc: "Every teacher is vetted, approved, and certified by our academic team before they can teach.", color: "from-rose-500/20 to-rose-500/5", accent: "text-rose-400" },
  { icon: Globe, title: "UAE & IB Aligned", desc: "Curriculum matched to UAE National, British, and International Baccalaureate frameworks.", color: "from-amber-500/20 to-amber-500/5", accent: "text-amber-400" },
];

const COURSES = [
  { title: "Advanced Mathematics", subject: "Mathematics", grade: "Grade 12", price: "$49.99", students: 142, img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80" },
  { title: "Python Programming", subject: "Computer Science", grade: "All Levels", price: "$39.99", students: 287, img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80" },
  { title: "Physics: Mechanics", subject: "Physics", grade: "Grade 11", price: "$44.99", students: 96, img: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80" },
  { title: "STEM Robotics", subject: "STEM & Robotics", grade: "Grade 10", price: "$59.99", students: 63, img: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=400&q=80" },
];

const TESTIMONIALS = [
  { name: "Aisha Al Mansoori", role: "Grade 12 Student", text: "Edutania transformed how I study. The live classes feel personal and the recordings help me revise before exams. My grades went from Bs to As.", avatar: "A" },
  { name: "Khalid Ibrahim", role: "Parent", text: "As a parent I can track my son's progress in real time. The teachers are exceptional and the platform is super easy to use.", avatar: "K" },
  { name: "Dr. Fatima Hassan", role: "Mathematics Teacher", text: "The platform lets me focus on teaching. Managing courses, scheduling live sessions, and getting paid is all seamless. Best EdTech I've used.", avatar: "F" },
];

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) setStarted(true);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const num = parseInt(target.replace(/\D/g, ""));
    let cur = 0;
    const step = Math.ceil(num / 60);
    const timer = setInterval(() => {
      cur = Math.min(cur + step, num);
      setCount(cur);
      if (cur >= num) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {target.includes("+") ? "+" : ""}
      {suffix}
    </span>
  );
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroBg = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);

  useEffect(() => {
    const interval = setInterval(
      () => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#060b14] text-white overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <MonitorPlay className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Edutania</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5">
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="px-4 py-1.5 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 gap-2">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-[#0d1525]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4"
            >
              {NAV_LINKS.map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`} className="block text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>
                  {l}
                </a>
              ))}
              <Link href="/register" className="block">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600">Get started</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-sky-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-violet-500/8 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroBg }} className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Next-Generation EdTech Platform
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95]">
              Where great{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                teaching
              </span>
              <br />
              meets{" "}
              <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                technology
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl text-white/50 leading-relaxed font-light">
              Live interactive classes, expert teachers, cloud recordings, and a seamless
              learning experience — built for the future of education in the UAE and beyond.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/courses">
                <Button size="lg" className="h-14 px-8 text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 gap-2 rounded-2xl">
                  <BookOpen className="h-5 w-5" /> Start learning free
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-2xl gap-2 backdrop-blur-sm">
                  <Play className="h-4 w-4 fill-current" /> Watch demo
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> UAE & IB aligned</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Cancel anytime</span>
            </div>
          </motion.div>

          {/* Hero visual - Fake browser */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#0d1525]/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0a101e]">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/70" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-md bg-white/5 flex items-center px-3 text-xs text-white/30">
                  edutania.com/live/calculus-lecture
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#080e1b]">
                <div className="col-span-2 aspect-video rounded-xl bg-gradient-to-br from-emerald-900/40 to-[#060b14] relative overflow-hidden flex items-center justify-center border border-white/5">
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1 text-xs text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-2xl font-bold text-emerald-400 mb-2">
                      S
                    </div>
                    <p className="text-sm text-white/50">Dr. Sarah Mitchell</p>
                    <p className="text-xs text-white/30">Advanced Calculus</p>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    {["Mic", "Cam", "Share"].map((b) => (
                      <div key={b} className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                        <Zap className="h-3 w-3 text-white/50" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {["A", "B", "C", "D"].map((letter) => (
                    <div key={letter} className="flex-1 rounded-xl bg-[#0d1525] border border-white/5 flex items-center justify-center text-sm font-semibold text-white/30">
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-emerald-500/20 blur-3xl" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs"
        >
          <span>Scroll to explore</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative py-20 border-y border-white/5 bg-[#080e1a]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-emerald-500/40 transition-colors">
                  <s.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-4xl font-black tracking-tight text-white">
                  {s.value.includes("%") ? (
                    <AnimatedCounter target={s.value} suffix="%" />
                  ) : (
                    <AnimatedCounter target={s.value} />
                  )}
                </div>
                <div className="mt-1 text-sm text-white/40">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.05),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 mb-4">
              <Zap className="h-3 w-3 text-emerald-400" /> Platform Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Built for modern learning</h2>
            <p className="mt-4 text-white/40 max-w-xl mx-auto">Everything you need to learn, teach, and grow — all in one powerful platform.</p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 hover:border-white/15 hover:bg-white/5 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08] border border-white/10 mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className={`h-6 w-6 ${f.accent}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section id="courses" className="py-28 bg-[#080e1a]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 mb-4">
                <BookOpen className="h-3 w-3 text-emerald-400" /> Popular Courses
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Start learning today</h2>
            </div>
            <Link href="/courses" className="hidden sm:block">
              <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 gap-2">
                Browse all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COURSES.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href="/courses" className="group block rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all duration-300 bg-[#0d1525] hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1">
                  <div className="relative aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs bg-white/15 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-full">{c.subject}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-white/40 mb-1 block">{c.grade}</span>
                    <h3 className="font-semibold leading-tight group-hover:text-emerald-400 transition-colors">{c.title}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-400">{c.price}</span>
                      <span className="text-xs text-white/40 flex items-center gap-1"><Users className="h-3 w-3" />{c.students}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="teachers" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.06),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 mb-4">
            <Star className="h-3 w-3 text-emerald-400" /> Student Stories
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-12">Loved by thousands</h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-12"
            >
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-light italic">
                &ldquo;{TESTIMONIALS[activeTestimonial].text}&rdquo;
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                  {TESTIMONIALS[activeTestimonial].avatar}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{TESTIMONIALS[activeTestimonial].name}</p>
                  <p className="text-sm text-white/40">{TESTIMONIALS[activeTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all ${i === activeTestimonial ? "w-8 h-2 bg-emerald-500" : "w-2 h-2 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 bg-[#080e1a]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 mb-4">
            <Zap className="h-3 w-3 text-emerald-400" /> Simple Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Pay only for what you learn</h2>
          <p className="text-white/40 max-w-xl mx-auto mb-12">No subscriptions. Buy individual courses and keep lifetime access including all future updates and recordings.</p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-left">
              <h3 className="text-xl font-bold mb-2">Student</h3>
              <p className="text-white/40 text-sm mb-6">Purchase courses individually and learn at your own pace</p>
              <ul className="space-y-3 text-sm">
                {["Access to all published courses", "Live session participation", "Cloud recording access", "Progress tracking", "Certificate of completion"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-white/70">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/courses" className="block mt-8">
                <Button className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/15">Browse Courses</Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-8 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
              <h3 className="text-xl font-bold mb-2">Teacher</h3>
              <p className="text-white/40 text-sm mb-6">Share your knowledge and earn 85% of every enrollment</p>
              <ul className="space-y-3 text-sm">
                {["Create unlimited courses", "Schedule live sessions", "Automated payouts", "Student analytics", "Cloud recording storage", "85% revenue share"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-white/70">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=teacher" className="block mt-8">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">Start Teaching</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-6">
              Ready to transform<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                how you learn?
              </span>
            </h2>
            <p className="text-white/40 text-lg mb-10">Join 12,000+ students already learning on Edutania</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/courses">
                <Button size="lg" className="h-14 px-10 text-base bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 rounded-2xl gap-2">
                  <BookOpen className="h-5 w-5" /> Get started free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-2xl">
                  Sign in
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-10 bg-[#060b14]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <MonitorPlay className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Edutania</span>
          </div>
          <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} Edutania. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
