import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { observedFollowupCompliance, observedLeadDistribution } from '../../../packages/staff-contracts/observed-metrics.mjs';

test('overview never manufactures history from snapshot positions or KPI values', () => {
  const analytics = fs.readFileSync('apps/staff/src/components/OverviewAnalyticsStrip.tsx','utf8');
  const overview = fs.readFileSync('apps/staff/src/components/OverviewWorkspace.tsx','utf8');
  assert.doesNotMatch(analytics, /idx % 6|\[2, 3, 2, 4, 3, 5\]/);
  assert.doesNotMatch(overview, /value - 2|value \+ 1/);
});

test('empty and pending followups do not imply compliance', () => {
  assert.equal(observedFollowupCompliance([]).percent, null);
  const result = observedFollowupCompliance([{scheduledAt:'2026-11-26T00:00:00Z',completedAt:null}], '2026-11-26T12:00:00Z');
  assert.equal(result.pending, 1);
  assert.equal(result.percent, null);
});
test('completed late remains late and exact 24-hour completion is on time', () => {
  const result = observedFollowupCompliance([
    {scheduledAt:'2026-11-24T00:00:00Z',completedAt:'2026-11-25T00:00:00Z'},
    {scheduledAt:'2026-11-24T00:00:00Z',completedAt:'2026-11-25T00:00:01Z'},
    {scheduledAt:'invalid',completedAt:null},
  ]);
  assert.equal(result.onTime, 1); assert.equal(result.late, 1);
  assert.equal(result.invalid, 1); assert.equal(result.percent, 50);
});
test('pipeline states are mutually exclusive and do not infer inventory', () => {
  const data = [{status:'active',assigneeId:1},{status:'closed'},{status:'draft'},{status:'lost'}];
  assert.deepEqual(observedLeadDistribution(data).map(item=>item.count),[1,1,1,1]);
});
