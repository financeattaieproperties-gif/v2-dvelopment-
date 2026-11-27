import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { summarizeAgentConversionRates } from "../../../packages/staff-contracts/workflow.mjs";

const NOW = "2026-11-17T12:00:00.000Z";

const SAMPLE_ASSIGNEES = [
  { id: 4, name: "Hamed Leader", role: "sales_leader", active: true },
  { id: 2, name: "Karim Sales", role: "sales", teamLeaderId: 4, active: true },
  { id: 14, name: "Nadia Sales", role: "sales", teamLeaderId: 4, active: true },
  { id: 99, name: "Other Team Agent", role: "sales", teamLeaderId: 8, active: true },
];

const SAMPLE_LEADS = [
  // Karim: 2 closed + 2 active = 50% (within 7d)
  { id: 1, assigneeId: 2, status: "closed", callAt: "2026-11-16T09:00:00Z", deal: { amount: "120000", closedAt: "2026-11-16T15:00:00Z" } },
  { id: 2, assigneeId: 2, status: "closed", callAt: "2026-11-15T10:00:00Z" },
  { id: 3, assigneeId: 2, status: "active", callAt: "2026-11-14T10:00:00Z" },
  { id: 4, assigneeId: 2, status: "active", callAt: "2026-11-12T10:00:00Z" },
  // Nadia: 1 closed + 3 active (1 in 7d, 1 in 20d, 1 in 60d) + 1 lost
  { id: 5, assigneeId: 14, status: "closed", callAt: "2026-11-13T08:00:00Z" },
  { id: 6, assigneeId: 14, status: "active", callAt: "2026-11-11T08:00:00Z" },
  { id: 7, assigneeId: 14, status: "active", callAt: "2026-10-25T08:00:00Z" },
  { id: 8, assigneeId: 14, status: "active", callAt: "2026-09-10T08:00:00Z" },
  { id: 9, assigneeId: 14, status: "lost", callAt: "2026-11-15T08:00:00Z" },
  // Other team agent should be excluded when leaderId=4 has explicit team members
  { id: 10, assigneeId: 99, status: "closed", callAt: "2026-11-16T08:00:00Z" },
];

test("summarizeAgentConversionRates scopes to Sales Leader's team and computes 7d conversion rates accurately", () => {
  const res = summarizeAgentConversionRates({
    leads: SAMPLE_LEADS,
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    dateRange: "7d",
    now: NOW,
  });

  assert.equal(res.agents.length, 2, "Only team agents belonging to leaderId=4 are returned");
  const karim = res.agents.find((a) => a.agentId === 2);
  const nadia = res.agents.find((a) => a.agentId === 14);

  assert.ok(karim, "Karim must be present");
  assert.equal(karim.closedCount, 2);
  assert.equal(karim.activeCount, 2);
  assert.equal(karim.conversionRate, 50);

  assert.ok(nadia, "Nadia must be present");
  assert.equal(nadia.closedCount, 1);
  assert.equal(nadia.activeCount, 1);
  assert.equal(nadia.lostCount, 1);
  // Conversion rate = closed / (active + closed) = 1 / 2 = 50%
  assert.equal(nadia.conversionRate, 50);
  assert.equal(res.totals.teamConversionRate, 50);
});

test("summarizeAgentConversionRates filters properly across 30d, 90d, all, and custom date windows", () => {
  const res30d = summarizeAgentConversionRates({
    leads: SAMPLE_LEADS,
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    dateRange: "30d",
    now: NOW,
  });
  const nadia30 = res30d.agents.find((a) => a.agentId === 14);
  assert.equal(nadia30?.activeCount, 2);
  assert.equal(nadia30?.closedCount, 1);
  assert.equal(nadia30?.conversionRate, 33.3);

  const res90d = summarizeAgentConversionRates({
    leads: SAMPLE_LEADS,
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    dateRange: "90d",
    now: NOW,
  });
  const nadia90 = res90d.agents.find((a) => a.agentId === 14);
  assert.equal(nadia90?.activeCount, 3);
  assert.equal(nadia90?.closedCount, 1);
  assert.equal(nadia90?.conversionRate, 25);

  const resCustom = summarizeAgentConversionRates({
    leads: SAMPLE_LEADS,
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    dateRange: "custom",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    now: NOW,
  });
  assert.equal(resCustom.filteredLeadCount, 1);
  const nadiaOct = resCustom.agents.find((a) => a.agentId === 14);
  assert.equal(nadiaOct?.activeCount, 1);
  assert.equal(nadiaOct?.closedCount, 0);
  assert.equal(nadiaOct?.conversionRate, 0);

  const resAll = summarizeAgentConversionRates({
    leads: [],
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    dateRange: "all",
    now: NOW,
  });
  assert.equal(resAll.totals.teamConversionRate, 0);
  assert.equal(resAll.filteredLeadCount, 0);
});

test("AgentConversionChart uses Recharts BarChart and is wired into Sales Leader overview and leads views", () => {
  const chartPath = path.resolve("apps/staff/src/components/AgentConversionChart.tsx");
  const mainPath = path.resolve("apps/staff/src/main.tsx");
  const cssPath = path.resolve("apps/staff/src/styles.css");

  assert.ok(fs.existsSync(chartPath), "AgentConversionChart.tsx must exist");
  const chartCode = fs.readFileSync(chartPath, "utf8");
  assert.ok(chartCode.includes("from \"recharts\"") || chartCode.includes("from 'recharts'"));
  assert.ok(chartCode.includes("<BarChart"));
  assert.ok(chartCode.includes("<ResponsiveContainer"));
  assert.ok(chartCode.includes("sales-leader-conversion-chart"));
  assert.ok(chartCode.includes("conversion-date-start"));
  assert.ok(chartCode.includes("conversion-date-end"));

  const mainCode = fs.readFileSync(mainPath, "utf8");
  for (const workspace of ["OverviewWorkspace", "CrmRecordsWorkspace"]) {
    assert.ok(mainCode.includes(`<${workspace}`), `main.tsx must render ${workspace}`);
    const workspaceCode = fs.readFileSync(path.resolve(`apps/staff/src/components/${workspace}.tsx`), "utf8");
    assert.ok(workspaceCode.includes("import { AgentConversionChart }"), `${workspace} must import chart`);
    assert.ok(workspaceCode.includes("<AgentConversionChart"), `${workspace} must render chart`);
    assert.ok(workspaceCode.includes('activeRole === "sales_leader"'), `${workspace} must guard chart for sales_leader`);
    assert.ok(workspaceCode.includes("leaderId={userId}"), `${workspace} must scope chart to active leader`);
  }

  const cssCode = fs.readFileSync(cssPath, "utf8");
  assert.ok(cssCode.includes(".conversion-card"), "styles.css must style .conversion-card");
});
