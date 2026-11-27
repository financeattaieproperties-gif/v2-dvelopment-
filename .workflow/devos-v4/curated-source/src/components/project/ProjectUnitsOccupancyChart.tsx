import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProjectUnit } from '@/lib/dbService';

interface ProjectUnitsOccupancyChartProps {
  units: ProjectUnit[];
  projectName: string;
}

interface TooltipItem {
  payload?: {
    label?: string;
    count?: number;
    pct?: number;
    soldPct?: number;
    availablePct?: number;
    reservedPct?: number;
    sold?: number;
    available?: number;
    reserved?: number;
  };
}

const COLORS = {
  sold: '#020E3A',
  available: '#10B981',
  reserved: '#F59E0B',
};

function UnitsChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  if (item.label && typeof item.pct === 'number' && typeof item.count === 'number') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs text-brand-navy tabular-nums">
        <div className="font-bold">{item.label}</div>
        <div className="text-gray-600 mt-0.5">
          <strong className="text-brand-navy">{item.pct}%</strong> ({item.count} units)
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs text-brand-navy tabular-nums space-y-1">
      <div className="flex items-center justify-between gap-4">
        <span>Sold</span>
        <strong>
          {item.soldPct}% ({item.sold})
        </strong>
      </div>
      <div className="flex items-center justify-between gap-4 text-emerald-700">
        <span>Available</span>
        <strong>
          {item.availablePct}% ({item.available})
        </strong>
      </div>
      {(item.reserved ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-4 text-amber-700">
          <span>Reserved</span>
          <strong>
            {item.reservedPct}% ({item.reserved})
          </strong>
        </div>
      )}
    </div>
  );
}

export function ProjectUnitsOccupancyChart({
  units,
  projectName,
}: ProjectUnitsOccupancyChartProps) {
  const stats = useMemo(() => {
    const total = units.length;
    const sold = units.filter((u) => u.status === 'sold' || u.status === 'rented').length;
    const available = units.filter((u) => u.status === 'available').length;
    const reserved = units.filter((u) => u.status === 'reserved').length;

    const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;
    const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;
    const reservedPct = total > 0 ? Math.max(0, 100 - soldPct - availablePct) : 0;

    const pieData = [
      { key: 'sold', label: 'Sold', count: sold, pct: soldPct, color: COLORS.sold },
      {
        key: 'available',
        label: 'Available',
        count: available,
        pct: availablePct,
        color: COLORS.available,
      },
      ...(reserved > 0
        ? [
            {
              key: 'reserved',
              label: 'Reserved',
              count: reserved,
              pct: reservedPct,
              color: COLORS.reserved,
            },
          ]
        : []),
    ].filter((slice) => slice.count > 0);

    const barRow = [
      {
        name: 'Occupancy',
        sold,
        available,
        reserved,
        soldPct,
        availablePct,
        reservedPct,
      },
    ];

    return {
      total,
      sold,
      available,
      reserved,
      soldPct,
      availablePct,
      reservedPct,
      pieData,
      barRow,
    };
  }, [units]);

  if (stats.total === 0) return null;

  return (
    <div
      data-testid="public-project-occupancy-chart"
      className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-xs"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-gold mb-1">
            Live Inventory Occupancy
          </p>
          <h3 className="text-base font-bold text-brand-navy">
            {projectName} — Sold vs. Available Apartments
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Breakdown of {stats.total} total apartments across current availability status
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 tabular-nums">
            <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                <span className="w-2 h-2 rounded-full bg-brand-navy inline-block" />
                Sold / Occupied
              </div>
              <div className="text-xl font-extrabold text-brand-navy mt-0.5">{stats.soldPct}%</div>
              <div className="text-[11px] text-gray-500">{stats.sold} apartments</div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Available
              </div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {stats.availablePct}%
              </div>
              <div className="text-[11px] text-emerald-700/80">{stats.available} apartments</div>
            </div>

            {stats.reserved > 0 && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Reserved
                </div>
                <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                  {stats.reservedPct}%
                </div>
                <div className="text-[11px] text-amber-700/80">{stats.reserved} apartments</div>
              </div>
            )}
          </div>

          <div className="mt-4 w-full min-w-0" style={{ height: 54 }}>
            <ResponsiveContainer
              width="100%"
              height={54}
              minWidth={0}
              initialDimension={{ width: 320, height: 54 }}
            >
              <BarChart data={stats.barRow} layout="vertical" margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<UnitsChartTooltip />} />
                <Bar
                  dataKey="soldPct"
                  name="Sold"
                  stackId="unitStatus"
                  fill={COLORS.sold}
                  barSize={18}
                  radius={[6, 0, 0, 6]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="availablePct"
                  name="Available"
                  stackId="unitStatus"
                  fill={COLORS.available}
                  barSize={18}
                  radius={stats.reserved > 0 ? [0, 0, 0, 0] : [0, 6, 6, 0]}
                  isAnimationActive={false}
                />
                {stats.reserved > 0 && (
                  <Bar
                    dataKey="reservedPct"
                    name="Reserved"
                    stackId="unitStatus"
                    fill={COLORS.reserved}
                    barSize={18}
                    radius={[0, 6, 6, 0]}
                    isAnimationActive={false}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-full lg:w-52 shrink-0 flex flex-col items-center justify-center min-w-0">
          <div className="relative w-full" style={{ height: 165 }}>
            <ResponsiveContainer
              width="100%"
              height={165}
              minWidth={0}
              initialDimension={{ width: 200, height: 165 }}
            >
              <PieChart>
                <Pie
                  data={stats.pieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={66}
                  paddingAngle={stats.pieData.length > 1 ? 3 : 0}
                  isAnimationActive={false}
                >
                  {stats.pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<UnitsChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none tabular-nums">
              <span className="text-lg font-extrabold text-brand-navy leading-none">
                {stats.availablePct}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1">
                Available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
