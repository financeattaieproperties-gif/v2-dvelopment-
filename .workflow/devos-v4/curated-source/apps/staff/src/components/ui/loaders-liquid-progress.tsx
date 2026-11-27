import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

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
    barBg: "linear-gradient(90deg, #14A850 0%, #0072BC 100%)",
    glow: "0 0 10px rgba(20, 168, 80, 0.35)",
    bubble: "rgba(232, 247, 238, 0.7)",
    text: "#14A850",
    border: "#BBF7D0",
  },
  amber: {
    barBg: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
    glow: "0 0 10px rgba(245, 158, 11, 0.35)",
    bubble: "rgba(254, 243, 199, 0.7)",
    text: "#D97706",
    border: "#FDE68A",
  },
  blue: {
    barBg: "linear-gradient(90deg, #0072BC 0%, #005E9B 100%)",
    glow: "0 0 10px rgba(0, 114, 188, 0.35)",
    bubble: "rgba(230, 242, 250, 0.7)",
    text: "#0072BC",
    border: "#BAE6FD",
  },
  violet: {
    barBg: "linear-gradient(90deg, #0072BC 0%, #14A850 100%)",
    glow: "0 0 10px rgba(0, 114, 188, 0.35)",
    bubble: "rgba(230, 242, 250, 0.7)",
    text: "#0072BC",
    border: "#E2E8F0",
  },
};

export function LoaderLiquidProgress({
  progress = 0,
  height = 14,
  showValue = false,
  statusText,
  colorScheme = "emerald",
  className,
  style,
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

  const width = useTransform(
    springProgress,
    (val) => `${Math.max(0, Math.min(100, val))}%`
  );

  return (
    <div
      className={className}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        userSelect: "none",
        ...style,
      }}
      {...props}
    >
      {(statusText || showValue) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 600,
            color: "#475569",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>{statusText || "Uploading"}</span>
          {showValue && (
            <span
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontWeight: 700,
                color: scheme.text,
              }}
            >
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: height + 4,
          overflow: "hidden",
          borderRadius: 999,
          padding: 2,
          background: "#F1F5F9",
          border: `1px solid ${scheme.border}`,
        }}
      >
        {/* Animated Liquid Bar */}
        <motion.div
          style={{
            position: "relative",
            height: "100%",
            width,
            borderRadius: 999,
            background: scheme.barBg,
            boxShadow: scheme.glow,
          }}
        >
          {/* Wave & Shimmer Highlights */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              borderRadius: 999,
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 96,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)",
              }}
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
              style={{
                position: "absolute",
                top: -2,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: scheme.bubble,
                filter: "blur(1.5px)",
              }}
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
