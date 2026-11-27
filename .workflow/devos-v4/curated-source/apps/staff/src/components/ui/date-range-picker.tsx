import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

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
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const from = new Date();
      from.setDate(from.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    },
  },
  {
    label: "Last 30 Days",
    getValue: () => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const to = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return { from, to };
    },
  },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(d1: Date | null, d2: Date | null) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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
  align = "right",
}: DateRangePickerProps) {
  const [internalRange, setInternalRange] = useState<DateRange>(
    value || { from: null, to: null }
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const base = value?.from || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const activeRange = value !== undefined ? value : internalRange;
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelectDay = (day: Date) => {
    let next: DateRange;
    if (!activeRange.from || (activeRange.from && activeRange.to)) {
      next = { from: startOfDay(day), to: null };
    } else {
      if (day < activeRange.from) {
        next = { from: startOfDay(day), to: endOfDay(activeRange.from) };
      } else {
        next = { from: startOfDay(activeRange.from), to: endOfDay(day) };
      }
    }
    setInternalRange(next);
    onChange?.(next);
  };

  const handleApplyPreset = (preset: DateRangePreset) => {
    const next = preset.getValue();
    setInternalRange(next);
    onChange?.(next);
    if (next.from) {
      setCurrentMonth(new Date(next.from.getFullYear(), next.from.getMonth(), 1));
    }
  };

  const clearSelection = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const empty = { from: null, to: null };
    setInternalRange(empty);
    onChange?.(empty);
  };

  const nextMonthDate = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }, [currentMonth]);

  const isPresetActive = (preset: DateRangePreset) => {
    if (!activeRange.from || !activeRange.to) return false;
    const target = preset.getValue();
    return (
      isSameDay(activeRange.from, target.from) &&
      isSameDay(activeRange.to, target.to)
    );
  };

  const renderMonthDays = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div
          key={`empty-${year}-${month}-${i}`}
          style={{ width: 32, height: 32 }}
          aria-hidden="true"
        />
      );
    }

    const fromDay = activeRange.from ? startOfDay(activeRange.from) : null;
    const toDay = activeRange.to ? startOfDay(activeRange.to) : null;
    const hoverDay = hoverDate ? startOfDay(hoverDate) : null;

    for (let d = 1; d <= totalDays; d++) {
      const day = new Date(year, month, d);
      const dayKey = `${year}-${month}-${d}`;
      const isStart = isSameDay(day, fromDay);
      const isEnd = isSameDay(day, toDay);
      const isToday = isSameDay(day, today);

      const isHoveredInRange = Boolean(
        fromDay &&
          !toDay &&
          hoverDay &&
          ((day > fromDay && day <= hoverDay) ||
            (day < fromDay && day >= hoverDay))
      );

      const inRange = Boolean(
        fromDay && toDay && day >= fromDay && day <= toDay
      );

      const isDisabled = Boolean(
        (minDate && day < startOfDay(minDate)) ||
          (maxDate && day > startOfDay(maxDate))
      );

      const isSelectedEdge = isStart || isEnd;
      const isRangeHighlight = (inRange || isHoveredInRange) && !isSelectedEdge;
      const isCellHovered = hoveredDayKey === dayKey && !isDisabled;

      let bg = "transparent";
      let fg = "#1E293B";
      let radius: string | number = 6;
      let weight = 500;
      let boxShadow = "none";

      if (isDisabled) {
        fg = "#CBD5E1";
      } else if (isSelectedEdge) {
        bg = "#0072BC";
        fg = "#FFFFFF";
        weight = 700;
        if (isStart && isEnd) {
          radius = 6;
        } else if (isStart && (toDay || (hoverDay && hoverDay > day))) {
          radius = "6px 0 0 6px";
        } else if (isEnd && fromDay && fromDay < day) {
          radius = "0 6px 6px 0";
        } else {
          radius = 6;
        }
      } else if (isRangeHighlight) {
        bg = "#E6F2FA";
        fg = "#0072BC";
        weight = 600;
        radius = 0;
      } else if (isCellHovered) {
        bg = "#F1F5F9";
        fg = "#0072BC";
      }

      if (isToday && !isSelectedEdge) {
        boxShadow = "inset 0 0 0 1.5px #14A850";
        if (!isRangeHighlight) {
          fg = "#14A850";
          weight = 700;
        }
      }

      days.push(
        <button
          key={dayKey}
          type="button"
          className="drp-day-btn"
          disabled={isDisabled}
          onClick={() => handleSelectDay(day)}
          onMouseEnter={() => {
            setHoverDate(day);
            setHoveredDayKey(dayKey);
          }}
          onMouseLeave={() => {
            setHoverDate(null);
            setHoveredDayKey(null);
          }}
          aria-label={day.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          aria-pressed={isSelectedEdge}
          style={{
            position: "relative",
            width: 32,
            height: 32,
            minHeight: 32,
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: weight,
            fontVariantNumeric: "tabular-nums",
            border: "none",
            borderRadius: radius,
            background: bg,
            color: fg,
            boxShadow,
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "background 0.12s ease, color 0.12s ease",
          }}
        >
          {d}
          {isToday && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 3,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: isSelectedEdge ? "#FFFFFF" : "#14A850",
              }}
            />
          )}
        </button>
      );
    }

    return (
      <div style={{ minWidth: 224 }}>
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: 13,
            color: "#1E293B",
            marginBottom: 10,
            letterSpacing: "-0.1px",
          }}
        >
          {monthDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 32px)",
            textAlign: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#818285",
            marginBottom: 6,
            justifyContent: "center",
          }}
        >
          {WEEKDAYS.map((dayName) => (
            <span
              key={dayName}
              style={{
                width: 32,
                height: 22,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {dayName}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 32px)",
            rowGap: 4,
            justifyContent: "center",
          }}
        >
          {days}
        </div>
      </div>
    );
  };

  const hasSelection = Boolean(activeRange.from || activeRange.to);

  const displayText =
    activeRange.from && activeRange.to
      ? `${formatDate(activeRange.from)} – ${formatDate(activeRange.to)}`
      : activeRange.from
      ? `${formatDate(activeRange.from)} – …`
      : placeholder;

  const popoverPlacementStyle: React.CSSProperties =
    align === "right"
      ? { right: 0 }
      : align === "center"
      ? { left: "50%", transform: "translateX(-50%)" }
      : { left: 0 };

  return (
    <div
      ref={containerRef}
      className={["drp-root", className].filter(Boolean).join(" ")}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="drp-trigger-btn"
        data-testid="date-range-picker-trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          height: 36,
          minHeight: 36,
          padding: "0 12px",
          borderRadius: 8,
          border:
            isOpen || hasSelection
              ? "1px solid #0072BC"
              : "1px solid #E2E8F0",
          background: hasSelection ? "#E6F2FA" : "#FFFFFF",
          color: hasSelection ? "#0072BC" : "#1E293B",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: isOpen ? "0 0 0 3px rgba(0, 114, 188, 0.14)" : "none",
          transition:
            "border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <CalendarIcon
          size={15}
          style={{
            color: isOpen || hasSelection ? "#0072BC" : "#818285",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: hasSelection
              ? "#0072BC"
              : isOpen
              ? "#1E293B"
              : "#475569",
          }}
        >
          {displayText}
        </span>
        {hasSelection && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date range"
            onClick={clearSelection}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                clearSelection();
              }
            }}
            style={{
              marginInlineStart: 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 114, 188, 0.12)",
              color: "#0072BC",
              cursor: "pointer",
            }}
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Select date range"
            className="drp-popover"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              ...popoverPlacementStyle,
              zIndex: 100,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
              padding: 16,
              minWidth: 560,
              maxWidth: "calc(100vw - 28px)",
              color: "#1E293B",
            }}
          >
            {/* Presets Top Pill Row */}
            {presets.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 6,
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.7px",
                    textTransform: "uppercase",
                    color: "#818285",
                    marginInlineEnd: 4,
                  }}
                >
                  Quick Range
                </span>
                {presets.map((p) => {
                  const active = isPresetActive(p);
                  const hovered = hoveredPreset === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      className="drp-preset-btn"
                      onClick={() => handleApplyPreset(p)}
                      onMouseEnter={() => setHoveredPreset(p.label)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      style={{
                        height: 28,
                        minHeight: 28,
                        padding: "0 10px",
                        borderRadius: 6,
                        border: active
                          ? "1px solid #0072BC"
                          : "1px solid #E2E8F0",
                        background: active
                          ? "#E6F2FA"
                          : hovered
                          ? "#F8FAFC"
                          : "#FFFFFF",
                        color: active
                          ? "#0072BC"
                          : hovered
                          ? "#0072BC"
                          : "#475569",
                        fontSize: 11,
                        fontWeight: active ? 700 : 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.12s ease",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Month Navigation Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                className="drp-nav-btn"
                aria-label="Previous month"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                style={{
                  width: 30,
                  height: 30,
                  minHeight: 30,
                  padding: 0,
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  color: "#475569",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={15} />
              </button>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#818285",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Select start & end date
              </span>

              <button
                type="button"
                className="drp-nav-btn"
                aria-label="Next month"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                style={{
                  width: 30,
                  height: 30,
                  minHeight: 30,
                  padding: 0,
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  color: "#475569",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Two-Month Side-by-Side Calendar Grid */}
            <div
              className="drp-calendars-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 20,
                alignItems: "start",
              }}
            >
              {renderMonthDays(currentMonth)}
              {renderMonthDays(nextMonthDate)}
            </div>

            {/* Footer Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                paddingTop: 12,
                marginTop: 12,
                borderTop: "1px solid #E2E8F0",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: hasSelection ? "#1E293B" : "#818285",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {activeRange.from && activeRange.to
                  ? `${formatDate(activeRange.from)} – ${formatDate(
                      activeRange.to
                    )}`
                  : activeRange.from
                  ? `${formatDate(activeRange.from)} – Select end date`
                  : "No date filter applied"}
              </span>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {hasSelection && (
                  <button
                    type="button"
                    className="drp-clear-btn"
                    onClick={() => clearSelection()}
                    style={{
                      height: 32,
                      minHeight: 32,
                      padding: "0 12px",
                      borderRadius: 7,
                      border: "1px solid #E2E8F0",
                      background: "#FFFFFF",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="drp-apply-btn"
                  onClick={() => setIsOpen(false)}
                  style={{
                    height: 32,
                    minHeight: 32,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: "1px solid #0072BC",
                    background: "#0072BC",
                    color: "#FFFFFF",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Check size={14} />
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DateRangePicker;
