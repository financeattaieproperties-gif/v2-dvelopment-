import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DateRangePreset {
  label: string;
  getValue: () => DateRange;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  presets?: DateRangePreset[];
  placeholder?: string;
  className?: string;
  align?: "left" | "right" | "center";
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Today",
    getValue: () => {
      const now = new Date();
      return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date(now.setHours(23, 59, 59, 999)) };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { from: new Date(d.setHours(0, 0, 0, 0)), to: new Date(d.setHours(23, 59, 59, 999)) };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from: new Date(from.setHours(0, 0, 0, 0)), to: new Date(to.setHours(23, 59, 59, 999)) };
    },
  },
  {
    label: "Last 30 Days",
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from: new Date(from.setHours(0, 0, 0, 0)), to: new Date(to.setHours(23, 59, 59, 999)) };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    },
  },
];

function isSameDay(d1: Date | null, d2: Date | null) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DateRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
  presets = DEFAULT_PRESETS,
  placeholder = "Select date range",
  className,
  align = "left",
}: DateRangePickerProps) {
  const [internalRange, setInternalRange] = useState<DateRange>(
    value || { from: null, to: null }
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value?.from || new Date()
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const activeRange = value !== undefined ? value : internalRange;

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

  const handleSelectDay = (day: Date) => {
    let next: DateRange;
    if (!activeRange.from || (activeRange.from && activeRange.to)) {
      next = { from: day, to: null };
    } else {
      if (day < activeRange.from) {
        next = { from: day, to: activeRange.from };
      } else {
        next = { from: activeRange.from, to: day };
      }
    }
    setInternalRange(next);
    onChange?.(next);
  };

  const handleApplyPreset = (preset: DateRangePreset) => {
    const next = preset.getValue();
    setInternalRange(next);
    onChange?.(next);
    if (next.from) setCurrentMonth(next.from);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const empty = { from: null, to: null };
    setInternalRange(empty);
    onChange?.(empty);
  };

  const nextMonthDate = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }, [currentMonth]);

  const renderMonthDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8" aria-hidden="true" />
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const day = new Date(year, month, d);
      const isStart = isSameDay(day, activeRange.from);
      const isEnd = isSameDay(day, activeRange.to);
      const isHovered =
        activeRange.from &&
        !activeRange.to &&
        hoverDate &&
        day > activeRange.from &&
        day <= hoverDate;

      const inRange =
        activeRange.from &&
        activeRange.to &&
        day >= activeRange.from &&
        day <= activeRange.to;

      const isDisabled =
        (minDate && day < minDate) || (maxDate && day > maxDate);

      days.push(
        <button
          key={`day-${d}`}
          type="button"
          disabled={Boolean(isDisabled)}
          onClick={() => handleSelectDay(day)}
          onMouseEnter={() => setHoverDate(day)}
          onMouseLeave={() => setHoverDate(null)}
          className={cn(
            "relative h-8 w-8 text-xs font-medium transition-all duration-150 flex items-center justify-center",
            isDisabled
              ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
            (inRange || isHovered) &&
              !isStart &&
              !isEnd &&
              "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 rounded-none",
            isStart &&
              "bg-teal-600 text-white font-semibold rounded-l-md shadow-sm z-10",
            isEnd &&
              "bg-teal-600 text-white font-semibold rounded-r-md shadow-sm z-10",
            isStart && isEnd && "rounded-md"
          )}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-center font-semibold text-xs tracking-wider uppercase text-slate-800 dark:text-slate-200">
          {monthDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1">{days}</div>
      </div>
    );
  };

  const displayText =
    activeRange.from && activeRange.to
      ? `${formatDate(activeRange.from)} – ${formatDate(activeRange.to)}`
      : activeRange.from
      ? `${formatDate(activeRange.from)} – …`
      : placeholder;

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-lg border shadow-sm transition-all duration-150",
          "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700",
          isOpen && "ring-2 ring-teal-500/20 border-teal-500 dark:border-teal-400"
        )}
      >
        <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className={cn(!activeRange.from && "text-slate-400 dark:text-slate-500")}>
          {displayText}
        </span>
        {activeRange.from && (
          <span
            role="button"
            tabIndex={0}
            onClick={clearSelection}
            className="ml-1 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 mt-2 p-4 rounded-xl border shadow-xl backdrop-blur-md",
              "bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100",
              align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
            )}
            style={{ minWidth: "320px" }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Presets Column */}
              {presets.length > 0 && (
                <div className="flex md:flex-col gap-1.5 pb-2 md:pb-0 md:pr-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 px-2 hidden md:block">
                    Presets
                  </span>
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1.5 text-xs text-left rounded-md font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Calendars */}
              <div className="space-y-3">
                {/* Month navigation */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {renderMonthDays(currentMonth)}
                  <div className="hidden sm:block">
                    {renderMonthDays(nextMonthDate)}
                  </div>
                </div>

                {/* Footer status & Done */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {activeRange.from && !activeRange.to
                      ? "Select end date"
                      : activeRange.from && activeRange.to
                      ? "Range selected"
                      : "Click to select range"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md text-xs shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DateRangePicker;
