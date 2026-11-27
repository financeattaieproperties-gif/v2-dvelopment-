import * as React from "react";
import { cn } from "@/lib/utils";

interface LiquidProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
}

export function LiquidProgressBar({ progress, className }: LiquidProgressBarProps) {
  return (
    <div className={cn("relative w-full h-4 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out flex items-center justify-center overflow-hidden"
        style={{ width: `${progress}%` }}
      >
        {/* Liquid effect simulation */}
        <div className="absolute inset-0 bg-[url('/assets/liquid-wave.svg')] bg-repeat-x opacity-50 animate-wave"></div>
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
