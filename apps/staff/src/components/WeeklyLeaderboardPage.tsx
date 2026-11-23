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
import {
  Award,
  Calendar,
  CheckCheck,
  PhoneIncoming,
  Search,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type {
  Branch,
  Followup,
  Lead,
  LeaderboardAgentEntry,
  StaffUser,
} from "../../../../packages/staff-contracts/types";
import {
  LEADERBOARD_POINTS,
  computeWeeklyLeaderboard,
} from "../../../../packages/staff-contracts/workflow.mjs";
import { KpiSparkline } from "./OverviewAnalyticsStrip";

export type LeaderboardPeriod = "week" | "prev_week" | "30d" | "all";
export type LeaderboardRoleFilter = "all" | "sales" | "callcenter";

export interface WeeklyLeaderboardPageProps {
  leads: Lead[];
  followups: Followup[];
  assignees: StaffUser[];
  branches?: Branch[];
  leaderboardEntries?: LeaderboardAgentEntry[];
  serverTime?: string;
  language?: "en" | "fa";
  t: (key: string) => string;
}

const ROLE_DISPLAY: Record<string, { en: string; fa: string }> = {
  sales: { en: "Sales Agent", fa: "کارمند فروش" },
  sales_leader: { en: "Sales Team Leader", fa: "سرپرست تیم فروش" },
  callcenter: { en: "Call Center Agent", fa: "کارمند مرکز تماس" },
};

function getInitials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function WeeklyLeaderboardPage({
  leads,
  followups,
  assignees,
  branches = [],
  leaderboardEntries = [],
  serverTime,
  language = "en",
  t,
}: WeeklyLeaderboardPageProps) {
  const isFa = language === "fa";
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const [roleFilter, setRoleFilter] = useState<LeaderboardRoleFilter>("all");
  const [search, setSearch] = useState<string>("");

  const leaderboard = useMemo(() => {
    return computeWeeklyLeaderboard({
      leads,
      followups,
      assignees,
      leaderboardEntries,
      period,
      now: serverTime || new Date().toISOString(),
    });
  }, [leads, followups, assignees, leaderboardEntries, period, serverTime]);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of branches) {
      if (b && typeof b.id === "number") {
        map.set(b.id, b.name);
      }
    }
    return map;
  }, [branches]);

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaderboard.agents.filter((agent) => {
      if (roleFilter === "sales" && !["sales", "sales_leader"].includes(agent.role)) {
        return false;
      }
      if (roleFilter === "callcenter" && agent.role !== "callcenter") {
        return false;
      }
      if (q && !agent.agentName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [leaderboard.agents, roleFilter, search]);

  const topThree = useMemo(() => filteredAgents.slice(0, 3), [filteredAgents]);
  const chartData = useMemo(() => filteredAgents.slice(0, 10), [filteredAgents]);

  const periodOptions: Array<{ id: LeaderboardPeriod; en: string; fa: string }> = [
    { id: "week", en: "This Week (7 Days)", fa: "این هفته (۷ روز)" },
    { id: "prev_week", en: "Previous Week", fa: "هفته گذشته" },
    { id: "30d", en: "Last 30 Days", fa: "۳۰ روز گذشته" },
    { id: "all", en: "All Time", fa: "همه زمان‌ها" },
  ];

  const roleFilterOptions: Array<{ id: LeaderboardRoleFilter; en: string; fa: string }> = [
    { id: "all", en: "All Agents", fa: "همه کارمندان" },
    { id: "sales", en: "Sales Team", fa: "تیم فروش" },
    { id: "callcenter", en: "Call Center", fa: "مرکز تماس" },
  ];

  const formatDateRangeLabel = () => {
    if (!leaderboard.rangeStartIso || !leaderboard.rangeEndIso) {
      return isFa ? "تمام سوابق ثبت‌شده" : "All recorded CRM performance";
    }
    try {
      const fmt = new Intl.DateTimeFormat(isFa ? "fa-AF" : "en-GB", {
        timeZone: "Asia/Kabul",
        month: "short",
        day: "numeric",
      });
      return `${fmt.format(new Date(leaderboard.rangeStartIso))} – ${fmt.format(
        new Date(leaderboard.rangeEndIso),
      )}`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className="weekly-leaderboard-page"
      data-testid="weekly-leaderboard-page"
      dir={isFa ? "rtl" : "ltr"}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* Scoring Rules Formula Banner */}
      <section
        className="panel"
        data-testid="leaderboard-scoring-rules-banner"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#E6F2FA",
              color: "#0072BC",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trophy size={20} />
          </span>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#818285",
              }}
            >
              {isFa
                ? "امتیازدهی هفتگی عملکرد کارمندان"
                : "WEEKLY AGENT PERFORMANCE SCORING FORMULA"}
            </div>
            <strong style={{ fontSize: 15, color: "#1E293B" }}>
              {isFa
                ? "رتبه‌بندی شفاف بر اساس سرنخ‌ها، بازدیدهای مشتریان و معاملات بسته‌شده"
                : "Transparent CRM-wide ranking based on leads, customer visits, and closed deals"}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            data-testid="rule-pill-lead"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#F1F5F9",
              border: "1px solid #E2E8F0",
              color: "#1E293B",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <PhoneIncoming size={14} color="#0072BC" />
            <span>{isFa ? "۱ سرنخ" : "1 Lead"} =</span>
            <strong style={{ color: "#0072BC" }}>
              {LEADERBOARD_POINTS.lead} {isFa ? "امتیاز" : "Point"}
            </strong>
          </span>

          <span
            data-testid="rule-pill-visit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#E6F2FA",
              border: "1px solid #BAE6FD",
              color: "#1E293B",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Calendar size={14} color="#0072BC" />
            <span>{isFa ? "۱ بازدید مشتری" : "1 Customer Visit"} =</span>
            <strong style={{ color: "#0072BC" }}>
              {LEADERBOARD_POINTS.visit} {isFa ? "امتیاز" : "Points"}
            </strong>
          </span>

          <span
            data-testid="rule-pill-deal"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#E8F7EE",
              border: "1px solid #BBF7D0",
              color: "#1E293B",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <CheckCheck size={14} color="#14A850" />
            <span>{isFa ? "۱ معامله موفق" : "1 Closed Deal"} =</span>
            <strong style={{ color: "#14A850" }}>
              {LEADERBOARD_POINTS.deal} {isFa ? "امتیاز" : "Points"}
            </strong>
          </span>
        </div>
      </section>

      {/* 4 UI Variant 1 KPI Cards */}
      <div className="stats-grid" data-testid="leaderboard-kpi-grid">
        {[
          {
            id: "total-score",
            label: isFa ? "مجموع امتیازات هفتگی" : "Total Weekly Score",
            value: leaderboard.totals.totalScore,
            note: leaderboard.totals.topAgent
              ? `${isFa ? "پیشتاز" : "Top"}: ${leaderboard.totals.topAgent.agentName} (${leaderboard.totals.topAgent.totalScore} ${isFa ? "امتیاز" : "pts"})`
              : t("All active agents"),
            icon: Trophy,
            color: "#0072BC",
            badgeBg: "#E6F2FA",
            badgeColor: "#0072BC",
          },
          {
            id: "total-leads",
            label: isFa ? "سرنخ‌های ثبت‌شده (×۱ امتیاز)" : "Leads Captured (×1 pt)",
            value: leaderboard.totals.totalLeads,
            note: `+${leaderboard.totals.totalLeadPoints} ${isFa ? "امتیاز از سرنخ‌ها" : "points from leads"}`,
            icon: PhoneIncoming,
            color: "#0072BC",
            badgeBg: "#F1F5F9",
            badgeColor: "#475569",
          },
          {
            id: "total-visits",
            label: isFa ? "بازدید مشتریان (×۳ امتیاز)" : "Customer Visits (×3 pts)",
            value: leaderboard.totals.totalVisits,
            note: `+${leaderboard.totals.totalVisitPoints} ${isFa ? "امتیاز از بازدیدها" : "points from visits"}`,
            icon: Calendar,
            color: "#0072BC",
            badgeBg: "#E6F2FA",
            badgeColor: "#0072BC",
          },
          {
            id: "total-deals",
            label: isFa ? "معاملات بسته‌شده (×۱۰ امتیاز)" : "Closed Deals (×10 pts)",
            value: leaderboard.totals.totalDeals,
            note: `+${leaderboard.totals.totalDealPoints} ${isFa ? "امتیاز از معاملات" : "points from deals"}`,
            icon: CheckCheck,
            color: "#14A850",
            badgeBg: "#E8F7EE",
            badgeColor: "#14A850",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          const pts = [
            Math.max(1, kpi.value - 3),
            Math.max(1, kpi.value - 1),
            Math.max(1, kpi.value),
            Math.max(1, kpi.value + 1),
            Math.max(1, kpi.value),
          ];
          return (
            <div
              key={kpi.id}
              className="stat-card"
              data-testid={`leaderboard-kpi-${kpi.id}`}
              style={{ cursor: "default" }}
            >
              <div className="stat-top">
                <span>{kpi.label}</span>
                <span className="stat-icon blue">
                  <Icon size={18} />
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <strong
                  className="stat-number"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {kpi.value}
                </strong>
                <KpiSparkline points={pts} color={kpi.color} />
              </div>
              <span className="stat-note">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: kpi.badgeBg,
                    color: kpi.badgeColor,
                  }}
                >
                  {kpi.note}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Top 3 Podium Strip + Score Comparison Chart */}
      {topThree.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
          data-testid="leaderboard-podium-grid"
        >
          {topThree.map((agent, idx) => {
            const rank = idx + 1;
            const isFirst = rank === 1;
            const badgeBg = isFirst
              ? "#0072BC"
              : rank === 2
                ? "#14A850"
                : "#818285";
            const roleLabel =
              ROLE_DISPLAY[agent.role]?.[isFa ? "fa" : "en"] || agent.role;
            return (
              <section
                key={agent.agentId}
                className="panel"
                data-testid={`leaderboard-podium-rank-${rank}`}
                style={{
                  background: "#FFFFFF",
                  border: isFirst ? "1.5px solid #0072BC" : "1px solid #E2E8F0",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: isFirst ? "#E6F2FA" : "#F1F5F9",
                        color: isFirst ? "#0072BC" : "#1E293B",
                        fontWeight: 700,
                        fontSize: 13,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {getInitials(agent.agentName)}
                    </span>
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 14.5,
                          color: "#1E293B",
                        }}
                      >
                        {agent.agentName}
                      </strong>
                      <small style={{ color: "#818285", fontSize: 12 }}>
                        {roleLabel}
                      </small>
                    </div>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: badgeBg,
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Award size={13} />#{rank}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    paddingTop: 6,
                    borderTop: "1px solid #F1F5F9",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#818285", fontWeight: 600 }}>
                    {isFa ? "امتیاز کل هفتگی" : "Weekly Score"}
                  </span>
                  <strong
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: isFirst ? "#0072BC" : "#14A850",
                    }}
                  >
                    {agent.totalScore}{" "}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#818285" }}>
                      {isFa ? "امتیاز" : "pts"}
                    </span>
                  </strong>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 6,
                    fontSize: 11.5,
                  }}
                >
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      padding: "6px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: "#818285" }}>
                      {isFa ? "سرنخ" : "Leads"}
                    </div>
                    <strong style={{ color: "#1E293B", fontSize: 13 }}>
                      {agent.leadsCount}
                    </strong>
                    <div style={{ color: "#0072BC", fontSize: 10.5, fontWeight: 600 }}>
                      +{agent.leadPoints}p
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      padding: "6px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: "#818285" }}>
                      {isFa ? "بازدید" : "Visits"}
                    </div>
                    <strong style={{ color: "#1E293B", fontSize: 13 }}>
                      {agent.visitsCount}
                    </strong>
                    <div style={{ color: "#0072BC", fontSize: 10.5, fontWeight: 600 }}>
                      +{agent.visitPoints}p
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#E8F7EE",
                      border: "1px solid #BBF7D0",
                      borderRadius: 6,
                      padding: "6px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ color: "#14A850" }}>
                      {isFa ? "معامله" : "Deals"}
                    </div>
                    <strong style={{ color: "#14A850", fontSize: 13 }}>
                      {agent.dealsCount}
                    </strong>
                    <div style={{ color: "#14A850", fontSize: 10.5, fontWeight: 700 }}>
                      +{agent.dealPoints}p
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Dual-Tone Score Bar Chart */}
      {chartData.length > 0 && (
        <section
          className="panel conversion-card"
          data-testid="leaderboard-score-chart"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
          }}
        >
          <div className="conversion-header">
            <div className="conversion-title-group">
              <div className="eyebrow" style={{ color: "#818285" }}>
                <TrendingUp size={12} aria-hidden="true" />
                <span>
                  {isFa ? "نمودار امتیازات هفتگی" : "WEEKLY SCORE BREAKDOWN"}
                </span>
              </div>
              <h2 className="conversion-title" style={{ color: "#1E293B" }}>
                {isFa
                  ? "مقایسه امتیاز کارمندان در این بازه زمانی"
                  : "Agent Weekly Points Comparison"}
              </h2>
              <p className="conversion-subtitle" style={{ color: "#818285" }}>
                {formatDateRangeLabel()}
              </p>
            </div>
          </div>

          <div
            className="conversion-chart-wrap"
            dir="ltr"
            style={{ width: "100%", height: 240 }}
          >
            <ResponsiveContainer
              width="100%"
              height={240}
              minWidth={0}
              initialDimension={{ width: 520, height: 240 }}
            >
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#818285", fontSize: 11.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: unknown) => [
                    `${Number(value || 0)} ${isFa ? "امتیاز" : "pts"}`,
                    isFa ? "مجموع امتیاز" : "Total Score",
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    color: "#1E293B",
                  }}
                />
                <Bar
                  dataKey="totalScore"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${entry.agentId}`}
                      fill={
                        idx === 0
                          ? "#0072BC"
                          : entry.totalScore > 0
                            ? "#14A850"
                            : "#818285"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Full Leaderboard Table with Filters */}
      <section className="panel" data-testid="leaderboard-table-panel">
        <div className="list-toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isFa ? "جستجوی نام کارمند…" : "Search agent by name…"
              }
              aria-label={isFa ? "جستجوی نام کارمند" : "Search agent by name"}
              data-testid="leaderboard-search-input"
            />
            {search && (
              <button
                type="button"
                className="icon-button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              className="conversion-range-tabs"
              role="group"
              aria-label={isFa ? "فیلتر نقش" : "Role filter"}
            >
              {roleFilterOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`leaderboard-role-${opt.id}`}
                  className={`conversion-range-btn ${
                    roleFilter === opt.id ? "active" : ""
                  }`}
                  onClick={() => setRoleFilter(opt.id)}
                >
                  <span>{isFa ? opt.fa : opt.en}</span>
                </button>
              ))}
            </div>

            <div
              className="conversion-range-tabs"
              role="group"
              aria-label={isFa ? "بازه زمانی" : "Time period"}
            >
              {periodOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`leaderboard-period-${opt.id}`}
                  className={`conversion-range-btn ${
                    period === opt.id ? "active" : ""
                  }`}
                  onClick={() => setPeriod(opt.id)}
                >
                  <span>{isFa ? opt.fa : opt.en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredAgents.length > 0 ? (
          <div className="table-scroll">
            <table data-testid="weekly-leaderboard-table">
              <thead>
                <tr>
                  <th>{isFa ? "رتبه" : "Rank"}</th>
                  <th>{isFa ? "کارمند" : "Agent"}</th>
                  <th>{isFa ? "نقش و شعبه" : "Role & Branch"}</th>
                  <th>
                    {isFa ? "سرنخ‌ها (۱ امتیاز)" : "Leads (1 pt)"}
                  </th>
                  <th>
                    {isFa ? "بازدید مشتری (۳ امتیاز)" : "Customer Visits (3 pts)"}
                  </th>
                  <th>
                    {isFa ? "معاملات (۱۰ امتیاز)" : "Closed Deals (10 pts)"}
                  </th>
                  <th>{isFa ? "جزئیات امتیاز" : "Points Breakdown"}</th>
                  <th>{isFa ? "امتیاز کل" : "Total Score"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent, index) => {
                  const displayRank = agent.rank || index + 1;
                  const roleLabel =
                    ROLE_DISPLAY[agent.role]?.[isFa ? "fa" : "en"] || agent.role;
                  const branchLabel =
                    agent.branchName ||
                    (agent.branchId ? branchNameById.get(agent.branchId) : null) ||
                    (isFa ? "شعبه مرکزی (کابل)" : "Main Branch (Kabul)");

                  return (
                    <tr
                      key={agent.agentId}
                      data-testid={`leaderboard-row-${agent.agentId}`}
                    >
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 28,
                            height: 26,
                            padding: "0 8px",
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 12,
                            background:
                              displayRank === 1
                                ? "#0072BC"
                                : displayRank === 2
                                  ? "#14A850"
                                  : displayRank === 3
                                    ? "#E6F2FA"
                                    : "#F1F5F9",
                            color:
                              displayRank === 1 || displayRank === 2
                                ? "#FFFFFF"
                                : displayRank === 3
                                  ? "#0072BC"
                                  : "#475569",
                          }}
                        >
                          #{displayRank}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span className="avatar">
                            {getInitials(agent.agentName)}
                          </span>
                          <div>
                            <strong>{agent.agentName}</strong>
                            <small className="serial">ID #{agent.agentId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{roleLabel}</strong>
                        <small>{branchLabel}</small>
                      </td>
                      <td>
                        <strong>{agent.leadsCount}</strong>
                        <small style={{ color: "#0072BC", fontWeight: 600 }}>
                          +{agent.leadPoints} {isFa ? "امتیاز" : "pts"}
                        </small>
                      </td>
                      <td>
                        <strong>{agent.visitsCount}</strong>
                        <small style={{ color: "#0072BC", fontWeight: 600 }}>
                          +{agent.visitPoints} {isFa ? "امتیاز" : "pts"}
                        </small>
                      </td>
                      <td>
                        <strong style={{ color: "#14A850" }}>
                          {agent.dealsCount}
                        </strong>
                        <small style={{ color: "#14A850", fontWeight: 700 }}>
                          +{agent.dealPoints} {isFa ? "امتیاز" : "pts"}
                        </small>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#475569",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {agent.leadsCount}×1 + {agent.visitsCount}×3 +{" "}
                          {agent.dealsCount}×10
                        </span>
                      </td>
                      <td>
                        <span
                          data-testid={`leaderboard-score-${agent.agentId}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 11px",
                            borderRadius: 999,
                            background:
                              agent.totalScore > 0 ? "#E8F7EE" : "#F1F5F9",
                            color:
                              agent.totalScore > 0 ? "#14A850" : "#818285",
                            fontWeight: 800,
                            fontSize: 13.5,
                          }}
                        >
                          {agent.totalScore} {isFa ? "امتیاز" : "pts"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <span>
              <Users size={23} />
            </span>
            <h3>{t("No records to show")}</h3>
            <p>
              {isFa
                ? "هیچ کارمندی مطابق فیلتر انتخابی یافت نشد."
                : "No agents match the selected filter."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
