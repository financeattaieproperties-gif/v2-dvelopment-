import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CircleMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  color?: string; // Optional custom color class, e.g. "bg-emerald-600 hover:bg-emerald-700"
}

export interface CircleMenuProps {
  items: CircleMenuItem[];
  radius?: number; // Distance in pixels from center (default 80)
  mode?: "full" | "fan-up" | "fan-left" | "fan-corner"; // Spread angle
  triggerIcon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function CircleMenu({
  items,
  radius = 80,
  mode = "full",
  triggerIcon,
  className,
  buttonClassName,
  ariaLabel = "Quick Action Menu",
}: CircleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  // Calculate angle for each item based on mode
  const getItemCoordinates = (index: number, total: number) => {
    let angle = 0;
    if (mode === "full") {
      // Spread across 360 degrees starting from -90 deg (top)
      const step = (2 * Math.PI) / total;
      angle = -Math.PI / 2 + index * step;
    } else if (mode === "fan-up") {
      // Spread 180 degrees upwards (from left to right)
      const step = total > 1 ? Math.PI / (total - 1) : 0;
      angle = Math.PI + index * step;
    } else if (mode === "fan-left") {
      // Spread upwards and leftwards (quarter circle)
      const step = total > 1 ? (Math.PI / 2) / (total - 1) : 0;
      angle = Math.PI + index * step;
    } else if (mode === "fan-corner") {
      // 90 to 180 degrees (top-left quarter circle)
      const step = total > 1 ? (Math.PI / 2) / (total - 1) : 0;
      angle = -Math.PI + index * step;
    }

    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    return { x, y };
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center select-none", className)}
    >
      {/* Dimmed backdrop when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/25 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Items */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
        <AnimatePresence>
          {isOpen &&
            items.map((item, index) => {
              const { x, y } = getItemCoordinates(index, items.length);

              const content = (
                <div className="relative group">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      item.onClick?.();
                    }}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
                    animate={{
                      opacity: 1,
                      x,
                      y,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 340,
                        damping: 22,
                        delay: index * 0.035,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: 0,
                      y: 0,
                      scale: 0.2,
                      transition: { duration: 0.14 },
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full shadow-lg border text-white transition-shadow",
                      item.color ||
                        "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border-slate-700/60 dark:border-slate-600 shadow-slate-950/30"
                    )}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </motion.button>

                  {/* Tooltip on hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="pointer-events-none absolute left-1/2 -bottom-7 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-2 py-0.5 rounded bg-slate-950 text-[10px] font-semibold text-white tracking-wide shadow-md whitespace-nowrap z-50"
                  >
                    {item.label}
                  </motion.div>
                </div>
              );

              return (
                <div key={item.label} className="absolute">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="pointer-events-auto"
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Main Center Trigger Button */}
      <motion.button
        type="button"
        onClick={toggleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-colors duration-200",
          "bg-teal-600 hover:bg-teal-500 text-white border border-teal-400/30 shadow-teal-900/30",
          buttonClassName
        )}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        {triggerIcon || <Plus className="w-5 h-5 stroke-[2.5]" />}
      </motion.button>
    </div>
  );
}

export default CircleMenu;
