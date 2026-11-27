import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface DateRangeValue {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [internal, setInternal] = React.useState<DateRangeValue>({
    from: value?.from ?? "",
    to: value?.to ?? "",
  });

  const current = value ?? internal;
  const update = (next: DateRangeValue) => {
    if (!value) setInternal(next);
    onChange?.(next);
  };

  const hasRange = Boolean(current.from || current.to);

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900",
        className
      )}
    >
      <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0" />
      <input
        type="date"
        aria-label="From date"
        value={current.from}
        onChange={(e) => update({ ...current, from: e.target.value })}
        className="bg-transparent text-xs text-slate-800 outline-none tabular-nums"
      />
      <span className="text-slate-400 text-xs">–</span>
      <input
        type="date"
        aria-label="To date"
        value={current.to}
        onChange={(e) => update({ ...current, to: e.target.value })}
        className="bg-transparent text-xs text-slate-800 outline-none tabular-nums"
      />
      {hasRange && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Clear date range"
          onClick={() => update({ from: "", to: "" })}
          className="h-6 px-1.5 text-slate-500 hover:text-slate-900"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
