"use client";

import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface GradientStatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;
  delay?: number;
  children?: ReactNode;
}

export function GradientStatCard({
  label,
  value,
  description,
  icon: Icon,
  gradient,
  accent,
  delay = 0,
  children,
}: GradientStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative rounded-2xl border border-border bg-gradient-to-br ${gradient} p-5 overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      {children}
    </motion.div>
  );
}
