/** Current snapshots cannot establish historic trends or inventory availability. */
export function observedFollowupCompliance(followups, now = new Date().toISOString()) {
  const nowMs = Date.parse(now);
  let onTime = 0, late = 0, pending = 0, invalid = 0;
  for (const item of followups) {
    const scheduled = Date.parse(item.scheduledAt);
    const completed = item.completedAt ? Date.parse(item.completedAt) : null;
    if (!Number.isFinite(scheduled) || (completed !== null && !Number.isFinite(completed))) { invalid++; continue; }
    const deadline = scheduled + 24 * 60 * 60 * 1000;
    if (completed !== null) completed <= deadline ? onTime++ : late++;
    else if (nowMs > deadline) late++;
    else pending++;
  }
  const assessed = onTime + late;
  return { onTime, late, pending, invalid, assessed, percent: assessed ? Math.round(onTime / assessed * 100) : null };
}

export function observedLeadDistribution(leads) {
  return ['draft', 'active', 'closed', 'lost'].map(status => ({ status, count: leads.filter(item => item.status === status).length }));
}
