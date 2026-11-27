import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { summarizeLeadConversionFunnel } from "../../../packages/staff-contracts/workflow.mjs";

const NOW = "2026-11-17T12:00:00.000Z";

const SAMPLE_ASSIGNEES = [
  { id: 4, name: "Hamed Leader", role: "sales_leader", active: true },
  { id: 2, name: "Karim Sales", role: "sales", teamLeaderId: 4, active: true },
  { id: 14, name: "Nadia Sales", role: "sales", teamLeaderId: 4, active: true },
  { id: 99, name: "Other Team Agent", role: "sales", teamLeaderId: 8, active: true },
];

const SAMPLE_LEADS = [
  // Karim: within 30d -> 1 active, 2 closed, 1 lost (total 4)
  { id: 1, assigneeId: 2, status: "active", callAt: "2026-11-15T10:00:00Z" },
  { id: 2, assigneeId: 2, status: "closed", callAt: "2026-11-10T10:00:00Z" },
  { id: 3, assigneeId: 2, status: "closed", callAt: "2026-10-25T10:00:00Z" },
  { id: 4, assigneeId: 2, status: "lost", callAt: "2026-11-01T10:00:00Z" },
  // Karim: outside 30d window (excluded)
  { id: 5, assigneeId: 2, status: "closed", callAt: "2026-09-01T10:00:00Z" },
  // Nadia: within 30d -> 3 active, 1 closed, 1 lost (total 5)
  { id: 6, assigneeId: 14, status: "active", callAt: "2026-11-16T09:00:00Z" },
  { id: 7, assigneeId: 14, status: "active", callAt: "2026-11-14T09:00:00Z" },
  { id: 8, assigneeId: 14, status: "active", callAt: "2026-11-05T09:00:00Z" },
  { id: 9, assigneeId: 14, status: "closed", callAt: "2026-11-12T09:00:00Z" },
  { id: 10, assigneeId: 14, status: "lost", callAt: "2026-10-22T09:00:00Z" },
  // Other team excluded
  { id: 11, assigneeId: 99, status: "active", callAt: "2026-11-16T09:00:00Z" },
];

test("summarizeLeadConversionFunnel breaks down 30-day Active, Closed, and Lost counts per team agent sorted by volume", () => {
  const funnel = summarizeLeadConversionFunnel({
    leads: SAMPLE_LEADS,
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    now: NOW,
  });

  assert.equal(funnel.agents.length, 2, "Only sales agents under leaderId=4 are included");
  // Sorted by pipelineTotal descending: Nadia (5) before Karim (4)
  assert.equal(funnel.agents[0].agentId, 14);
  assert.equal(funnel.agents[0].activeCount, 3);
  assert.equal(funnel.agents[0].closedCount, 1);
  assert.equal(funnel.agents[0].lostCount, 1);
  assert.equal(funnel.agents[0].pipelineTotal, 5);

  assert.equal(funnel.agents[1].agentId, 2);
  assert.equal(funnel.agents[1].activeCount, 1);
  assert.equal(funnel.agents[1].closedCount, 2);
  assert.equal(funnel.agents[1].lostCount, 1);
  assert.equal(funnel.agents[1].pipelineTotal, 4);

  assert.equal(funnel.totals.active, 4);
  assert.equal(funnel.totals.closed, 3);
  assert.equal(funnel.totals.lost, 2);
  assert.equal(funnel.totals.pipelineTotal, 9);
  assert.equal(funnel.totals.activePct, 44.4);
  assert.equal(funnel.totals.closedPct, 33.3);
  assert.equal(funnel.totals.lostPct, 22.2);
});

test("summarizeLeadConversionFunnel handles empty 30-day dataset gracefully", () => {
  const funnel = summarizeLeadConversionFunnel({
    leads: [
      { id: 20, assigneeId: 2, status: "closed", callAt: "2026-01-10T10:00:00Z" },
    ],
    assignees: SAMPLE_ASSIGNEES,
    leaderId: 4,
    now: NOW,
  });

  assert.equal(funnel.totals.pipelineTotal, 0);
  assert.equal(funnel.totals.activePct, 0);
  assert.equal(funnel.totals.closedPct, 0);
  assert.equal(funnel.totals.lostPct, 0);
});

test("LeadConversionFunnelChart renders a Recharts stacked BarChart with Active, Closed, Lost series on Sales Leader dashboard", () => {
  const chartPath = path.resolve("apps/staff/src/components/LeadConversionFunnelChart.tsx");
  const mainPath = path.resolve("apps/staff/src/main.tsx");
  const cssPath = path.resolve("apps/staff/src/styles.css");

  assert.ok(fs.existsSync(chartPath), "LeadConversionFunnelChart.tsx must exist");
  const chartCode = fs.readFileSync(chartPath, "utf8");
  assert.ok(chartCode.includes("from \"recharts\"") || chartCode.includes("from 'recharts'"));
  assert.ok(chartCode.includes("<BarChart"));
  assert.ok(chartCode.includes("<ResponsiveContainer"));
  assert.ok(chartCode.includes('stackId="leadFunnel"'), "Bars must share a stackId for stacked chart");
  assert.ok(chartCode.includes('dataKey="activeCount"'), "Must plot Active lead stack");
  assert.ok(chartCode.includes('dataKey="closedCount"'), "Must plot Closed lead stack");
  assert.ok(chartCode.includes('dataKey="lostCount"'), "Must plot Lost lead stack");
  assert.ok(chartCode.includes("Lead Conversion Funnel"));
  assert.ok(chartCode.includes("lead-conversion-funnel-chart"));

  const mainCode = fs.readFileSync(mainPath, "utf8");
  for (const workspace of ["OverviewWorkspace", "CrmRecordsWorkspace"]) {
    assert.ok(mainCode.includes(`<${workspace}`), `main.tsx must render ${workspace}`);
    const workspaceCode = fs.readFileSync(path.resolve(`apps/staff/src/components/${workspace}.tsx`), "utf8");
    assert.ok(workspaceCode.includes("import { LeadConversionFunnelChart }"), `${workspace} must import funnel`);
    assert.ok(workspaceCode.includes("<LeadConversionFunnelChart"), `${workspace} must render funnel`);
    assert.ok(workspaceCode.includes("sales-leader-charts-grid"), `${workspace} must place charts in grid`);
    assert.ok(workspaceCode.includes('activeRole === "sales_leader"'), `${workspace} must guard charts for sales_leader`);
    assert.ok(workspaceCode.includes("leaderId={userId}"), `${workspace} must scope funnel to active leader`);
  }

  const cssCode = fs.readFileSync(cssPath, "utf8");
  assert.ok(cssCode.includes(".funnel-card"), "styles.css must style .funnel-card");
  assert.ok(cssCode.includes(".sales-leader-charts-grid"), "styles.css must style .sales-leader-charts-grid");
});
