import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import type { Lead, StaffUser } from "../../../../packages/staff-contracts/types";
import { summarizeAgentConversionRates } from "../../../../packages/staff-contracts/workflow.mjs";

export type ConversionDateRange = "7d" | "30d" | "90d" | "all" | "custom";

export interface AgentConversionRow {
  agentId: number;
  agentName: string;
  shortName: string;
  activeCount: number;
  closedCount: number;
  lostCount: number;
  draftCount: number;
  pipelineTotal: number;
  closedAmount: number;
  conversionRate: number;
}

export interface AgentConversionSummary {
  agents: AgentConversionRow[];
  totals: {
    active: number;
    closed: number;
    lost: number;
    total: number;
    teamConversionRate: number;
  };
  filteredLeadCount: number;
}

export interface AgentConversionChartProps {
  leads: Lead[];
  assignees: StaffUser[];
  leaderId?: number | null;
  serverTime?: string;
  language?: "en" | "fa";
}

interface TooltipPayloadEntry {
  payload?: AgentConversionRow;
}

interface ConversionTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  isFa: boolean;
}

function getBarColor(rate: number): string {
  if (rate > 0) return "#14A850";
  return "#818285";
}

function ConversionTooltip({ active, payload, isFa }: ConversionTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div
      className="conversion-tooltip"
      dir={isFa ? "rtl" : "ltr"}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        color: "#1E293B",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div className="conversion-tooltip-title">{row.agentName}</div>
      <div className="conversion-tooltip-row">
        <span>
          <i
            className="conversion-dot"
            style={{ background: getBarColor(row.conversionRate) }}
          />
          {isFa ? "نرخ تبدیل" : "Conversion Rate"}
        </span>
        <strong>{row.conversionRate}%</strong>
      </div>
      <div className="conversion-tooltip-row">
        <span>{isFa ? "معاملات بسته‌شده" : "Closed Deals"}</span>
        <strong>{row.closedCount}</strong>
      </div>
      <div className="conversion-tooltip-row">
        <span>{isFa ? "سرنخ‌های فعال" : "Active Leads"}</span>
        <strong>{row.activeCount}</strong>
      </div>
      {row.lostCount > 0 && (
        <div className="conversion-tooltip-row">
          <span>{isFa ? "از دست‌رفته" : "Lost"}</span>
          <strong>{row.lostCount}</strong>
        </div>
      )}
    </div>
  );
}

const RANGE_OPTIONS: Array<{
  id: ConversionDateRange;
  en: string;
  fa: string;
}> = [
  { id: "7d", en: "7 Days", fa: "۷ روز" },
  { id: "30d", en: "30 Days", fa: "۳۰ روز" },
  { id: "90d", en: "90 Days", fa: "۹۰ روز" },
  { id: "all", en: "All Time", fa: "همه" },
  { id: "custom", en: "Custom", fa: "بازه دلخواه" },
];

export function AgentConversionChart({
  leads,
  assignees,
  leaderId = null,
  serverTime,
  language = "en",
}: AgentConversionChartProps) {
  const isFa = language === "fa";
  const [dateRange, setDateRange] = useState<ConversionDateRange>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const summary = useMemo<AgentConversionSummary>(() => {
    return summarizeAgentConversionRates({
      leads,
      assignees,
      leaderId,
      dateRange,
      startDate,
      endDate,
      now: serverTime || new Date().toISOString(),
    }) as AgentConversionSummary;
  }, [leads, assignees, leaderId, dateRange, startDate, endDate, serverTime]);

  const isEmpty =
    summary.agents.length === 0 || summary.filteredLeadCount === 0;

  return (
    <section
      className="panel conversion-card"
      data-testid="sales-leader-conversion-chart"
      dir={isFa ? "rtl" : "ltr"}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div className="conversion-header">
        <div className="conversion-title-group">
          <div className="eyebrow" style={{ color: "#818285" }}>
            <TrendingUp size={12} aria-hidden="true" />
            <span>
              {isFa ? "عملکرد تیم فروش" : "SALES TEAM PERFORMANCE"}
            </span>
          </div>
          <h2 className="conversion-title" style={{ color: "#1E293B" }}>
            {isFa
              ? "نرخ تبدیل سرنخ به معامله بر اساس کارمند"
              : "Agent Lead-to-Deal Conversion"}
          </h2>
          <p className="conversion-subtitle" style={{ color: "#818285" }}>
            {isFa
              ? "نسبت درصدی تبدیل سرنخ‌های فعال به معاملات بسته‌شده برای هر کارمند فروش"
              : "Conversion rate of active leads into closed deals per sales agent"}
          </p>
        </div>

        <div className="conversion-kpis">
          <div className="conversion-kpi">
            <span className="conversion-kpi-label" style={{ color: "#818285" }}>
              {isFa ? "نرخ تبدیل تیم" : "Team Conversion"}
            </span>
            <strong
              className="conversion-kpi-value"
              data-testid="conversion-team-rate"
              style={{ color: "#14A850", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.teamConversionRate}%
            </strong>
          </div>
          <div className="conversion-kpi">
            <span className="conversion-kpi-label" style={{ color: "#818285" }}>
              {isFa ? "سرنخ‌های فعال" : "Active Leads"}
            </span>
            <strong
              className="conversion-kpi-value"
              data-testid="conversion-total-active"
              style={{ color: "#818285", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.active}
            </strong>
          </div>
          <div className="conversion-kpi">
            <span className="conversion-kpi-label" style={{ color: "#818285" }}>
              {isFa ? "معاملات بسته‌شده" : "Closed Deals"}
            </span>
            <strong
              className="conversion-kpi-value"
              data-testid="conversion-total-closed"
              style={{ color: "#14A850", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.closed}
            </strong>
          </div>
        </div>
      </div>

      <div className="conversion-toolbar">
        <div
          className="conversion-range-tabs"
          role="group"
          aria-label={isFa ? "فیلتر بازه زمانی" : "Date range filter"}
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-testid={`conversion-range-${opt.id}`}
              aria-pressed={dateRange === opt.id}
              className={`conversion-range-btn ${
                dateRange === opt.id ? "active" : ""
              }`}
              onClick={() => setDateRange(opt.id)}
            >
              {opt.id === "custom" && <Calendar size={13} aria-hidden="true" />}
              <span>{isFa ? opt.fa : opt.en}</span>
            </button>
          ))}
        </div>

        {dateRange === "custom" && (
          <div className="conversion-date-inputs">
            <label className="conversion-date-field">
              <span>{isFa ? "از تاریخ" : "From"}</span>
              <input
                type="date"
                data-testid="conversion-date-start"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="conversion-date-field">
              <span>{isFa ? "تا تاریخ" : "To"}</span>
              <input
                type="date"
                data-testid="conversion-date-end"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="conversion-empty" data-testid="conversion-empty-state">
          <p>
            {isFa
              ? "در بازه زمانی انتخاب‌شده هیچ سرنخ یا معامله‌ای برای اعضای تیم ثبت نشده است."
              : "No lead activity found for your sales agents in the selected date range."}
          </p>
          {dateRange !== "all" && (
            <button
              type="button"
              className="button secondary"
              data-testid="conversion-show-all-btn"
              onClick={() => setDateRange("all")}
            >
              {isFa ? "نمایش همه زمان‌ها" : "Show All Time"}
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className="conversion-chart-wrap"
            dir="ltr"
            style={{ width: "100%", height: 270 }}
          >
            <ResponsiveContainer
              width="100%"
              height={270}
              minWidth={0}
              initialDimension={{ width: 520, height: 270 }}
            >
              <BarChart
                data={summary.agents}
                margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 12, fill: "#1E293B", fontWeight: 600 }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#818285" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  content={<ConversionTooltip isFa={isFa} />}
                  cursor={{ fill: "#F1F5F9" }}
                />
                <Bar
                  dataKey="conversionRate"
                  name={isFa ? "نرخ تبدیل" : "Conversion Rate"}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={false}
                >
                  {summary.agents.map((row) => (
                    <Cell
                      key={row.agentId}
                      fill={getBarColor(row.conversionRate)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="conversion-agent-strip"
            aria-label={isFa ? "خلاصه عملکرد هر کارمند" : "Agent breakdown"}
          >
            {summary.agents.map((row) => (
              <div
                key={row.agentId}
                className="conversion-agent-row"
                data-testid={`conversion-agent-row-${row.agentId}`}
              >
                <div className="conversion-agent-name">
                  <i
                    className="conversion-dot"
                    style={{ background: getBarColor(row.conversionRate) }}
                  />
                  <span>{row.agentName}</span>
                </div>
                <div
                  className="conversion-agent-metrics"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <span>
                    <span style={{ color: "#14A850" }}>
                      {row.closedCount} {isFa ? "بسته‌شده" : "closed"}
                    </span>{" "}
                    ·{" "}
                    <span style={{ color: "#818285" }}>
                      {row.activeCount} {isFa ? "فعال" : "active"}
                    </span>
                  </span>
                  <strong style={{ color: "#1E293B" }}>
                    {row.conversionRate}%
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
