import React, { useMemo } from 'react';
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
import type { InventoryApartment, InventoryProject } from '../../../../packages/staff-contracts/types';

export interface ProjectOccupancyChartProps {
  projects: InventoryProject[];
  language?: 'en' | 'fa';
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: {
    label?: string;
    count?: number;
    pct?: number;
    sold?: number;
    available?: number;
    reserved?: number;
    total?: number;
    soldPct?: number;
    availablePct?: number;
    reservedPct?: number;
    fullName?: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  language: 'en' | 'fa';
}

const COLORS = {
  sold: '#0072BC',
  available: '#14A850',
  reserved: '#818285',
};

const isApartmentUnit = (u: InventoryApartment): boolean => !u.kind || u.kind === 'apartment';

const isSoldStatus = (status: InventoryApartment['status']): boolean =>
  status === 'sold' || status === 'deal_closed';

function OccupancyTooltip({ active, payload, language }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const first = payload[0]?.payload;
  const isFa = language === 'fa';

  // Pie segment tooltip
  if (first && typeof first.pct === 'number' && typeof first.count === 'number' && first.label) {
    return (
      <div className="occupancy-tooltip" dir={isFa ? 'rtl' : 'ltr'}>
        <div className="occupancy-tooltip-title">{first.label}</div>
        <div className="occupancy-tooltip-row">
          <span>{first.pct}%</span>
          <span>
            {first.count} {isFa ? 'واحد' : 'apartments'}
          </span>
        </div>
      </div>
    );
  }

  // Bar stack tooltip
  if (first && typeof first.total === 'number') {
    return (
      <div className="occupancy-tooltip" dir={isFa ? 'rtl' : 'ltr'}>
        <div className="occupancy-tooltip-title">{first.fullName}</div>
        <div className="occupancy-tooltip-row">
          <span>
            <i className="occupancy-dot" style={{ background: COLORS.sold }} />
            {isFa ? 'فروخته‌شده' : 'Sold'}
          </span>
          <strong>
            {first.soldPct}% ({first.sold})
          </strong>
        </div>
        <div className="occupancy-tooltip-row">
          <span>
            <i className="occupancy-dot" style={{ background: COLORS.available }} />
            {isFa ? 'موجود' : 'Available'}
          </span>
          <strong>
            {first.availablePct}% ({first.available})
          </strong>
        </div>
        {(first.reserved ?? 0) > 0 && (
          <div className="occupancy-tooltip-row">
            <span>
              <i className="occupancy-dot" style={{ background: COLORS.reserved }} />
              {isFa ? 'رزرو' : 'Reserved'}
            </span>
            <strong>
              {first.reservedPct}% ({first.reserved})
            </strong>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function ProjectOccupancyChart({ projects, language = 'en' }: ProjectOccupancyChartProps) {
  const isFa = language === 'fa';

  const summary = useMemo(() => {
    let total = 0;
    let sold = 0;
    let available = 0;
    let reserved = 0;

    const projectRows = projects
      .map((project) => {
        const apts = project.apartments.filter(isApartmentUnit);
        const unitSet = apts.length > 0 ? apts : project.apartments;
        const pTotal = unitSet.length;
        const pSold = unitSet.filter((u) => isSoldStatus(u.status)).length;
        const pAvailable = unitSet.filter((u) => u.status === 'available').length;
        const pReserved = unitSet.filter((u) => u.status === 'reserved').length;

        total += pTotal;
        sold += pSold;
        available += pAvailable;
        reserved += pReserved;

        const soldPct = pTotal > 0 ? Math.round((pSold / pTotal) * 100) : 0;
        const availablePct = pTotal > 0 ? Math.round((pAvailable / pTotal) * 100) : 0;
        const reservedPct = pTotal > 0 ? Math.max(0, 100 - soldPct - availablePct) : 0;

        return {
          name: project.code || project.name.slice(0, 12),
          fullName: `${project.code ? `${project.code} — ` : ''}${project.name}`,
          total: pTotal,
          sold: pSold,
          available: pAvailable,
          reserved: pReserved,
          soldPct,
          availablePct,
          reservedPct,
        };
      })
      .filter((row) => row.total > 0);

    const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;
    const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;
    const reservedPct = total > 0 ? Math.max(0, 100 - soldPct - availablePct) : 0;

    const pieData = [
      {
        key: 'sold',
        label: isFa ? 'فروخته‌شده' : 'Sold',
        count: sold,
        pct: soldPct,
        color: COLORS.sold,
      },
      {
        key: 'available',
        label: isFa ? 'موجود' : 'Available',
        count: available,
        pct: availablePct,
        color: COLORS.available,
      },
      ...(reserved > 0
        ? [
            {
              key: 'reserved',
              label: isFa ? 'رزرو' : 'Reserved',
              count: reserved,
              pct: reservedPct,
              color: COLORS.reserved,
            },
          ]
        : []),
    ].filter((slice) => slice.count > 0);

    return {
      total,
      sold,
      available,
      reserved,
      soldPct,
      availablePct,
      reservedPct,
      pieData,
      projectRows,
    };
  }, [projects, isFa]);

  const barChartHeight = Math.max(170, summary.projectRows.length * 46 + 44);

  return (
    <div
      className="occupancy-card"
      data-testid="project-occupancy-chart"
      dir={isFa ? 'rtl' : 'ltr'}
    >
      <div className="occupancy-header">
        <div>
          <h3 className="occupancy-title">
            {isFa ? 'وضعیت اشغال و فروش آپارتمان‌ها' : 'Apartment Occupancy Status'}
          </h3>
          <p className="occupancy-subtitle">
            {isFa
              ? 'نسبت درصدی آپارتمان‌های فروخته‌شده در برابر واحدهای موجود در تمام پروژه‌ها'
              : 'Percentage of sold vs. available apartments across project inventory'}
          </p>
        </div>

        <div className="occupancy-kpis">
          <div className="occupancy-kpi">
            <span className="occupancy-kpi-label">
              <i className="occupancy-dot" style={{ background: COLORS.sold }} />
              {isFa ? 'فروخته‌شده' : 'Sold'}
            </span>
            <strong className="occupancy-kpi-value" data-testid="occupancy-sold-pct">
              {summary.soldPct}%
            </strong>
            <small className="occupancy-kpi-meta">
              {summary.sold} / {summary.total}
            </small>
          </div>

          <div className="occupancy-kpi">
            <span className="occupancy-kpi-label">
              <i className="occupancy-dot" style={{ background: COLORS.available }} />
              {isFa ? 'موجود' : 'Available'}
            </span>
            <strong className="occupancy-kpi-value" data-testid="occupancy-available-pct">
              {summary.availablePct}%
            </strong>
            <small className="occupancy-kpi-meta">
              {summary.available} / {summary.total}
            </small>
          </div>

          {summary.reserved > 0 && (
            <div className="occupancy-kpi">
              <span className="occupancy-kpi-label">
                <i className="occupancy-dot" style={{ background: COLORS.reserved }} />
                {isFa ? 'رزرو' : 'Reserved'}
              </span>
              <strong className="occupancy-kpi-value">{summary.reservedPct}%</strong>
              <small className="occupancy-kpi-meta">
                {summary.reserved} / {summary.total}
              </small>
            </div>
          )}
        </div>
      </div>

      {summary.total === 0 ? (
        <div className="occupancy-empty" data-testid="occupancy-empty-state">
          {isFa
            ? 'هنوز واحدی در پروژه‌ها ثبت نشده است. با افزودن آپارتمان‌ها، نمودار وضعیت فروش و موجودی نمایش داده می‌شود.'
            : 'No project apartments added yet. Add project units to visualize sold vs. available occupancy percentages.'}
        </div>
      ) : (
        <div className="occupancy-grid">
          <div className="occupancy-panel">
            <div className="occupancy-panel-label">
              {isFa ? 'نمای کلی کل پروژه‌ها' : 'Overall Share (%)'}
            </div>
            <div className="occupancy-pie-wrap" style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer
                width="100%"
                height={210}
                minWidth={0}
                initialDimension={{ width: 280, height: 210 }}
              >
                <PieChart>
                  <Pie
                    data={summary.pieData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={80}
                    paddingAngle={summary.pieData.length > 1 ? 3 : 0}
                    isAnimationActive={false}
                  >
                    {summary.pieData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<OccupancyTooltip language={language} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="occupancy-pie-center" aria-hidden="true">
                <strong>{summary.availablePct}%</strong>
                <span>{isFa ? 'موجود' : 'Available'}</span>
              </div>
            </div>
            <div className="occupancy-legend">
              {summary.pieData.map((slice) => (
                <span key={slice.key} className="occupancy-legend-item">
                  <i className="occupancy-dot" style={{ background: slice.color }} />
                  {slice.label}: <strong>{slice.pct}%</strong> ({slice.count})
                </span>
              ))}
            </div>
          </div>

          <div className="occupancy-panel">
            <div className="occupancy-panel-label">
              {isFa ? 'مقایسه پروژه‌ها (%)' : 'By Project (%)'}
            </div>
            <div className="occupancy-bar-wrap" style={{ width: '100%', height: barChartHeight }}>
              <ResponsiveContainer
                width="100%"
                height={barChartHeight}
                minWidth={0}
                initialDimension={{ width: 420, height: barChartHeight }}
              >
                <BarChart
                  data={summary.projectRows}
                  layout="vertical"
                  margin={{ top: 6, right: 16, left: 8, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: '#818285' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fontSize: 12, fill: '#1E293B', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<OccupancyTooltip language={language} />} />
                  <Bar
                    dataKey="soldPct"
                    name={isFa ? 'فروخته‌شده' : 'Sold'}
                    stackId="occupancy"
                    fill={COLORS.sold}
                    barSize={20}
                    radius={[4, 0, 0, 4]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="availablePct"
                    name={isFa ? 'موجود' : 'Available'}
                    stackId="occupancy"
                    fill={COLORS.available}
                    barSize={20}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                  {summary.reserved > 0 && (
                    <Bar
                      dataKey="reservedPct"
                      name={isFa ? 'رزرو' : 'Reserved'}
                      stackId="occupancy"
                      fill={COLORS.reserved}
                      barSize={20}
                      isAnimationActive={false}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
