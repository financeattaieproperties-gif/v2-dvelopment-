import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Project } from '../api';

interface ProjectOccupancyCardProps {
  projects: Project[];
}

interface TooltipPayloadItem {
  payload?: {
    label?: string;
    count?: number;
    pct?: number;
    fullName?: string;
    sold?: number;
    available?: number;
    total?: number;
    soldPct?: number;
    availablePct?: number;
  };
}

const COLORS = {
  sold: '#0072BC',
  available: '#14A850',
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  if (item.label && typeof item.pct === 'number' && typeof item.count === 'number') {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '0.5rem 0.7rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          fontSize: '0.78rem',
          color: '#1E293B',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>{item.label}</div>
        <div style={{ color: '#818285' }}>
          <strong style={{ color: '#1E293B' }}>{item.pct}%</strong> ({item.count} units)
        </div>
      </div>
    );
  }

  if (typeof item.total === 'number') {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '0.55rem 0.75rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          fontSize: '0.78rem',
          color: '#1E293B',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{item.fullName}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#0072BC' }}>
          <span>Sold</span>
          <strong>
            {item.soldPct}% ({item.sold})
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#14A850' }}>
          <span>Available</span>
          <strong>
            {item.availablePct}% ({item.available})
          </strong>
        </div>
      </div>
    );
  }

  return null;
}

export function ProjectOccupancyCard({ projects }: ProjectOccupancyCardProps) {
  const stats = useMemo(() => {
    let totalUnits = 0;
    let availableUnits = 0;
    let soldUnits = 0;

    const projectRows = projects
      .map((project) => {
        const total = Math.max(0, Number(project.total_units || 0));
        const available = Math.min(total, Math.max(0, Number(project.available_units || 0)));
        const sold = Math.max(0, total - available);

        totalUnits += total;
        availableUnits += available;
        soldUnits += sold;

        const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;
        const availablePct = total > 0 ? Math.max(0, 100 - soldPct) : 0;

        return {
          name: project.name.length > 16 ? `${project.name.slice(0, 15)}…` : project.name,
          fullName: project.name,
          total,
          sold,
          available,
          soldPct,
          availablePct,
        };
      })
      .filter((row) => row.total > 0);

    const soldPct = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
    const availablePct = totalUnits > 0 ? Math.max(0, 100 - soldPct) : 0;

    const pieData = [
      { key: 'sold', label: 'Sold', count: soldUnits, pct: soldPct, color: COLORS.sold },
      {
        key: 'available',
        label: 'Available',
        count: availableUnits,
        pct: availablePct,
        color: COLORS.available,
      },
    ].filter((slice) => slice.count > 0);

    return {
      totalUnits,
      availableUnits,
      soldUnits,
      soldPct,
      availablePct,
      pieData,
      projectRows,
    };
  }, [projects]);

  const barHeight = Math.max(165, stats.projectRows.length * 42 + 40);

  return (
    <section
      data-testid="admin-projects-occupancy-chart"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '1.15rem 1.25rem',
        marginBottom: '1.15rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.85rem',
          marginBottom: stats.totalUnits > 0 ? '1rem' : '0.75rem',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '0.98rem',
              fontWeight: 700,
              color: '#1E293B',
            }}
          >
            Project Unit Occupancy Status
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#818285' }}>
            Percentage of sold vs. available apartments across project inventory
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '0.45rem 0.75rem',
              minWidth: 108,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748B',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '999px',
                  background: COLORS.sold,
                  display: 'inline-block',
                }}
              />
              Sold
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>
              {stats.soldPct}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#818285' }}>
              {stats.soldUnits} / {stats.totalUnits} units
            </div>
          </div>

          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '0.45rem 0.75rem',
              minWidth: 108,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#818285',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '999px',
                  background: COLORS.available,
                  display: 'inline-block',
                }}
              />
              Available
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14A850' }}>
              {stats.availablePct}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#818285' }}>
              {stats.availableUnits} / {stats.totalUnits} units
            </div>
          </div>
        </div>
      </div>

      {stats.totalUnits === 0 ? (
        <div
          style={{
            border: '1px dashed #CBD5E1',
            borderRadius: 8,
            padding: '1rem',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '0.82rem',
            background: '#F8FAFC',
          }}
        >
          No project units recorded yet. Add projects with unit counts to display occupancy charts.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              border: '1px solid #F1F5F9',
              background: '#F8FAFC',
              borderRadius: 8,
              padding: '0.85rem',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.25rem',
              }}
            >
              Portfolio Split (%)
            </div>
            <div style={{ position: 'relative', width: '100%', height: 190 }}>
              <ResponsiveContainer
                width="100%"
                height={190}
                minWidth={0}
                initialDimension={{ width: 260, height: 190 }}
              >
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={stats.pieData.length > 1 ? 3 : 0}
                    isAnimationActive={false}
                  >
                    {stats.pieData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <strong style={{ fontSize: '1.1rem', color: '#1E293B', lineHeight: 1.1 }}>
                  {stats.availablePct}%
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#818285', fontWeight: 600 }}>
                  Available
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              border: '1px solid #F1F5F9',
              background: '#F8FAFC',
              borderRadius: 8,
              padding: '0.85rem',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.25rem',
              }}
            >
              Sold vs. Available by Project (%)
            </div>
            <div style={{ width: '100%', height: barHeight }}>
              <ResponsiveContainer
                width="100%"
                height={barHeight}
                minWidth={0}
                initialDimension={{ width: 380, height: barHeight }}
              >
                <BarChart
                  data={stats.projectRows}
                  layout="vertical"
                  margin={{ top: 6, right: 14, left: 6, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={105}
                    tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="soldPct"
                    name="Sold"
                    stackId="a"
                    fill={COLORS.sold}
                    barSize={18}
                    radius={[4, 0, 0, 4]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="availablePct"
                    name="Available"
                    stackId="a"
                    fill={COLORS.available}
                    barSize={18}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
