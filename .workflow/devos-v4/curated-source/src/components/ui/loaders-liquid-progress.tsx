import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface LoaderLiquidProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number; // 0 to 100
  height?: number; // in pixels, default 14
  showValue?: boolean;
  statusText?: string;
  colorScheme?: "emerald" | "amber" | "blue" | "violet";
}

const colorSchemes = {
  emerald: {
    gradient: "from-emerald-600 via-teal-400 to-cyan-300",
    glow: "shadow-[0_0_14px_rgba(20,184,166,0.55)]",
    bubble: "bg-teal-200/40",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/20",
  },
  amber: {
    gradient: "from-amber-600 via-orange-400 to-yellow-300",
    glow: "shadow-[0_0_14px_rgba(245,158,11,0.55)]",
    bubble: "bg-amber-200/40",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  blue: {
    gradient: "from-blue-600 via-indigo-400 to-sky-300",
    glow: "shadow-[0_0_14px_rgba(59,130,246,0.55)]",
    bubble: "bg-sky-200/40",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  violet: {
    gradient: "from-violet-600 via-fuchsia-400 to-pink-300",
    glow: "shadow-[0_0_14px_rgba(168,85,247,0.55)]",
    bubble: "bg-fuchsia-200/40",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
  },
};

export function LoaderLiquidProgress({
  progress = 0,
  height = 14,
  showValue = false,
  statusText,
  colorScheme = "emerald",
  className,
  ...props
}: LoaderLiquidProgressProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const scheme = colorSchemes[colorScheme] || colorSchemes.emerald;

  const springProgress = useSpring(clamped, {
    stiffness: 100,
    damping: 18,
    mass: 0.8,
  });

  useEffect(() => {
    springProgress.set(clamped);
  }, [clamped, springProgress]);

  const width = useTransform(springProgress, (val: number) => `${Math.max(0, Math.min(100, val))}%`);

  return (
    <div className={cn("w-full space-y-2 select-none", className)} {...props}>
      {(statusText || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium tracking-wide text-slate-600 dark:text-slate-300">
          <span>{statusText || "Uploading"}</span>
          {showValue && (
            <span className={cn("font-mono font-semibold", scheme.text)}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full p-[2px] backdrop-blur-sm transition-all",
          "bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800",
          scheme.border
        )}
        style={{ height: `${height + 4}px` }}
      >
        {/* Animated Liquid Bar */}
        <motion.div
          className={cn(
            "relative h-full rounded-full bg-gradient-to-r",
            scheme.gradient,
            scheme.glow
          )}
          style={{ width }}
        >
          {/* Wave & Shimmer Highlights */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              animate={{ x: ["-100%", "400%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Liquid droplet bubble at the leading edge */}
          {clamped > 3 && clamped < 99 && (
            <motion.span
              className={cn(
                "absolute -top-1 right-0 h-4 w-4 rounded-full blur-[2px] opacity-75",
                scheme.bubble
              )}
              animate={{
                scale: [0.9, 1.25, 0.9],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default LoaderLiquidProgress;
