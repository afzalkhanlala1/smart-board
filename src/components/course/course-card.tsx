import Link from "next/link";
import Image from "next/image";
import { Users, GraduationCap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getStorageUrl } from "@/lib/utils";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    subject: string;
    gradeLevel: string;
    price: number;
    enrollmentCount: number;
    teacher: {
      name: string;
    };
  };
}

const SUBJECT_COLORS: Record<string, { gradient: string; badge: string }> = {
  Mathematics:      { gradient: "from-emerald-500 to-green-700",   badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  Science:          { gradient: "from-teal-500 to-emerald-600",    badge: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  English:          { gradient: "from-purple-500 to-violet-600",   badge: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  History:          { gradient: "from-amber-500 to-orange-600",    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  Geography:        { gradient: "from-cyan-500 to-teal-600",       badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  Physics:          { gradient: "from-sky-500 to-cyan-600",        badge: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  Chemistry:        { gradient: "from-rose-500 to-pink-600",       badge: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  Biology:          { gradient: "from-lime-500 to-green-600",      badge: "bg-lime-500/15 text-lime-400 border-lime-500/20" },
  "Computer Science": { gradient: "from-slate-500 to-gray-700",   badge: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
  Art:              { gradient: "from-fuchsia-500 to-purple-600",  badge: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20" },
  Music:            { gradient: "from-red-500 to-rose-600",        badge: "bg-red-500/15 text-red-400 border-red-500/20" },
  "Physical Education": { gradient: "from-orange-500 to-amber-600", badge: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  Economics:        { gradient: "from-green-500 to-emerald-600",   badge: "bg-green-500/15 text-green-400 border-green-500/20" },
  "Business Studies": { gradient: "from-teal-600 to-emerald-700", badge: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  Literature:       { gradient: "from-violet-500 to-purple-600",   badge: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
};

export function CourseCard({ course }: CourseCardProps) {
  const theme = SUBJECT_COLORS[course.subject] ?? {
    gradient: "from-slate-600 to-slate-800",
    badge: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  };

  return (
    <Link href={`/courses/${course.id}`} className="group block h-full">
      <div className="h-full overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {course.thumbnail ? (
            <Image
              src={getStorageUrl(course.thumbnail)}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}
            >
              <GraduationCap className="h-10 w-10 text-white/60" />
            </div>
          )}
          {/* Badge overlay */}
          <div className="absolute bottom-2 left-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${theme.badge}`}
            >
              {course.subject}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {course.title}
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {course.teacher.name}
          </p>

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {course.gradeLevel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.enrollmentCount.toLocaleString()} enrolled
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-base font-bold text-primary">
              {course.price === 0 ? "Free" : formatPrice(course.price)}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
              View course
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
