import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; isPositive: boolean };
}

const iconColors: Record<string, { gradient: string; accent: string }> = {};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-5 overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </div>
    </div>
  );
}
