import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarEventItem {
  id: string | number;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle?: string;
  status?: string;
}

interface FullscreenCalendarProps {
  events?: CalendarEventItem[];
  onSelectEvent?: (event: CalendarEventItem) => void;
  title?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function FullscreenCalendar({
  events = [],
  onSelectEvent,
  title = "Appointment Scheduler",
}: FullscreenCalendarProps) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of events) {
      const key = ev.date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{ day: number | null; iso: string | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      list.push({ day: null, iso: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      list.push({ day: d, iso: `${year}-${mm}-${dd}` });
    }
    return list;
  }, [year, month]);

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-slate-700 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-slate-900 tabular-nums">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-slate-700 hover:bg-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 border-b border-slate-200 pb-2 text-center text-xs font-semibold text-slate-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.iso) {
            return <div key={`empty-${idx}`} className="min-h-[84px] rounded bg-slate-50/60" />;
          }
          const dayEvents = eventsByDate.get(cell.iso) ?? [];
          const isToday = cell.iso === todayIso;
          return (
            <div
              key={cell.iso}
              className={`min-h-[84px] rounded border p-1.5 ${
                isToday
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-1 text-xs font-semibold text-slate-700 tabular-nums">
                {cell.day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onSelectEvent?.(ev)}
                    className="block w-full truncate rounded bg-slate-100 px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-800 hover:bg-slate-200"
                    title={ev.subtitle ? `${ev.title} — ${ev.subtitle}` : ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] font-medium text-slate-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
