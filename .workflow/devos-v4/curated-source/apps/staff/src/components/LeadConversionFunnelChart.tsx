import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Lead, StaffUser } from "../../../../packages/staff-contracts/types";
import { summarizeLeadConversionFunnel } from "../../../../packages/staff-contracts/workflow.mjs";

export interface FunnelAgentRow {
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

export interface LeadConversionFunnelSummary {
  agents: FunnelAgentRow[];
  totals: {
    active: number;
    closed: number;
    lost: number;
    pipelineTotal: number;
    activePct: number;
    closedPct: number;
    lostPct: number;
    teamConversionRate: number;
  };
  filteredLeadCount: number;
}

export interface LeadConversionFunnelChartProps {
  leads: Lead[];
  assignees: StaffUser[];
  leaderId?: number | null;
  serverTime?: string;
  language?: "en" | "fa";
}

const FUNNEL_COLORS = {
  closed: "#14A850",
  active: "#0072BC",
  lost: "#B91C1C",
} as const;

interface TooltipPayloadEntry {
  payload?: FunnelAgentRow;
}

interface FunnelTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  isFa: boolean;
}

function FunnelTooltip({ active, payload, isFa }: FunnelTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div
      className="funnel-tooltip"
      dir={isFa ? "rtl" : "ltr"}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        color: "#1E293B",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div className="funnel-tooltip-title">{row.agentName}</div>
      <div className="funnel-tooltip-row">
        <span>
          <i
            className="funnel-swatch"
            style={{ background: FUNNEL_COLORS.active }}
          />
          {isFa ? "فعال" : "Active"}
        </span>
        <strong>{row.activeCount}</strong>
      </div>
      <div className="funnel-tooltip-row">
        <span>
          <i
            className="funnel-swatch"
            style={{ background: FUNNEL_COLORS.closed }}
          />
          {isFa ? "بسته‌شده" : "Closed"}
        </span>
        <strong>{row.closedCount}</strong>
      </div>
      <div className="funnel-tooltip-row">
        <span>
          <i
            className="funnel-swatch"
            style={{ background: FUNNEL_COLORS.lost }}
          />
          {isFa ? "از دست‌رفته" : "Lost"}
        </span>
        <strong>{row.lostCount}</strong>
      </div>
      <div className="funnel-tooltip-divider" />
      <div className="funnel-tooltip-row">
        <span>{isFa ? "مجموع ۳۰ روز" : "30-Day Total"}</span>
        <strong>{row.pipelineTotal}</strong>
      </div>
      <div className="funnel-tooltip-row">
        <span>{isFa ? "نرخ تبدیل" : "Conversion"}</span>
        <strong>{row.conversionRate}%</strong>
      </div>
    </div>
  );
}

export function LeadConversionFunnelChart({
  leads,
  assignees,
  leaderId = null,
  serverTime,
  language = "en",
}: LeadConversionFunnelChartProps) {
  const isFa = language === "fa";

  const summary = useMemo<LeadConversionFunnelSummary>(() => {
    return summarizeLeadConversionFunnel({
      leads,
      assignees,
      leaderId,
      now: serverTime || new Date().toISOString(),
    }) as LeadConversionFunnelSummary;
  }, [leads, assignees, leaderId, serverTime]);

  const isEmpty =
    summary.agents.length === 0 || summary.totals.pipelineTotal === 0;

  return (
    <section
      className="panel funnel-card"
      data-testid="lead-conversion-funnel-chart"
      dir={isFa ? "rtl" : "ltr"}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div className="funnel-header">
        <div className="funnel-title-group">
          <div className="funnel-kicker" style={{ color: "#818285" }}>
            <span>{isFa ? "۳۰ روز اخیر" : "Last 30 Days"}</span>
            <span aria-hidden="true">·</span>
            <span>
              {isFa ? "تفکیک وضعیت کارمندان" : "Agent Status Breakdown"}
            </span>
          </div>
          <h2 className="funnel-title" style={{ color: "#1E293B" }}>
            {isFa ? "قیف تبدیل سرنخ‌ها" : "Lead Conversion Funnel"}
          </h2>
          <p className="funnel-subtitle" style={{ color: "#818285" }}>
            {isFa
              ? "مقایسه انباشته سرنخ‌های فعال، معاملات بسته‌شده و از دست‌رفته برای هر کارمند فروش"
              : "Stacked distribution of Active, Closed, and Lost leads per sales agent"}
          </p>
        </div>

        <div className="funnel-kpis">
          <div className="funnel-kpi">
            <span className="funnel-kpi-label" style={{ color: "#818285" }}>
              <i
                className="funnel-swatch"
                style={{ background: FUNNEL_COLORS.active }}
              />
              {isFa ? "فعال" : "Active"}
            </span>
            <strong
              className="funnel-kpi-value"
              data-testid="funnel-total-active"
              style={{ color: "#0072BC", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.active}
            </strong>
            <small
              className="funnel-kpi-meta"
              style={{ color: "#818285", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.activePct}%
            </small>
          </div>
          <div className="funnel-kpi">
            <span className="funnel-kpi-label" style={{ color: "#818285" }}>
              <i
                className="funnel-swatch"
                style={{ background: FUNNEL_COLORS.closed }}
              />
              {isFa ? "بسته‌شده" : "Closed"}
            </span>
            <strong
              className="funnel-kpi-value"
              data-testid="funnel-total-closed"
              style={{ color: "#14A850", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.closed}
            </strong>
            <small
              className="funnel-kpi-meta"
              style={{ color: "#818285", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.closedPct}%
            </small>
          </div>
          <div className="funnel-kpi">
            <span className="funnel-kpi-label" style={{ color: "#818285" }}>
              <i
                className="funnel-swatch"
                style={{ background: FUNNEL_COLORS.lost }}
              />
              {isFa ? "از دست‌رفته" : "Lost"}
            </span>
            <strong
              className="funnel-kpi-value"
              data-testid="funnel-total-lost"
              style={{ color: "#B91C1C", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.lost}
            </strong>
            <small
              className="funnel-kpi-meta"
              style={{ color: "#818285", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.lostPct}%
            </small>
          </div>
          <div className="funnel-kpi">
            <span className="funnel-kpi-label" style={{ color: "#818285" }}>
              {isFa ? "مجموع قیف" : "30-Day Funnel"}
            </span>
            <strong
              className="funnel-kpi-value"
              data-testid="funnel-total-pipeline"
              style={{ color: "#1E293B", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.pipelineTotal}
            </strong>
            <small
              className="funnel-kpi-meta"
              style={{ color: "#818285", fontVariantNumeric: "tabular-nums" }}
            >
              {summary.totals.teamConversionRate}%{" "}
              {isFa ? "تبدیل" : "conv."}
            </small>
          </div>
        </div>
      </div>

      <div className="funnel-legend" aria-label={isFa ? "راهنمای وضعیت" : "Status legend"}>
        <span className="funnel-legend-item">
          <i
            className="funnel-swatch"
            style={{ background: FUNNEL_COLORS.closed }}
          />
          <span>{isFa ? "بسته‌شده (Closed)" : "Closed"}</span>
        </span>
        <span className="funnel-legend-item">
          <i
            className="funnel-swatch"
            style={{ background: FUNNEL_COLORS.active }}
          />
          <span>{isFa ? "فعال (Active)" : "Active"}</span>
        </span>
        <span className="funnel-legend-item">
          <i
            className="funnel-swatch"
            style={{ background: FUNNEL_COLORS.lost }}
          />
          <span>{isFa ? "از دست‌رفته (Lost)" : "Lost"}</span>
        </span>
      </div>

      {isEmpty ? (
        <div className="funnel-empty" data-testid="funnel-empty-state">
          <p>
            {isFa
              ? "در ۳۰ روز گذشته هیچ سرنخ فعال، بسته‌شده یا از دست‌رفته‌ای برای تیم شما ثبت نشده است."
              : "No Active, Closed, or Lost leads were recorded for your sales agents in the last 30 days."}
          </p>
        </div>
      ) : (
        <>
          <div
            className="funnel-chart-wrap"
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
                margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
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
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#818285" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={<FunnelTooltip isFa={isFa} />}
                  cursor={{ fill: "#F1F5F9" }}
                />
                <Bar
                  dataKey="closedCount"
                  stackId="leadFunnel"
                  name={isFa ? "بسته‌شده" : "Closed"}
                  fill={FUNNEL_COLORS.closed}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  maxBarSize={44}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="activeCount"
                  stackId="leadFunnel"
                  name={isFa ? "فعال" : "Active"}
                  fill={FUNNEL_COLORS.active}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  maxBarSize={44}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="lostCount"
                  stackId="leadFunnel"
                  name={isFa ? "از دست‌رفته" : "Lost"}
                  fill={FUNNEL_COLORS.lost}
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  maxBarSize={44}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="funnel-agent-strip"
            aria-label={isFa ? "تفکیک وضعیت هر کارمند" : "Agent status totals"}
          >
            {summary.agents.map((row) => (
              <div
                key={row.agentId}
                className="funnel-agent-row"
                data-testid={`funnel-agent-row-${row.agentId}`}
              >
                <span className="funnel-agent-name">{row.agentName}</span>
                <div className="funnel-agent-metrics">
                  <span style={{ color: FUNNEL_COLORS.active }}>
                    {row.activeCount} {isFa ? "فعال" : "active"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span style={{ color: FUNNEL_COLORS.closed }}>
                    {row.closedCount} {isFa ? "بسته" : "closed"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span style={{ color: FUNNEL_COLORS.lost }}>
                    {row.lostCount} {isFa ? "باخت" : "lost"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
