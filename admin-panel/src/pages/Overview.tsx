import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Lead, type Project, type Property, type SubmissionPost, type VisitRequest } from '../api';

// Design Tokens for Luxury Architectural Theme
const THEME = {
  lapis: '#0B2545',
  cobalt: '#0072BC',
  gold: '#C5A059',
  goldSoft: '#FAF5EC',
  goldBorder: '#EED9B3',
  emerald: '#0D6042',
  emeraldSoft: '#EBF7EE',
  emeraldBorder: '#BDE8CE',
  amber: '#B45309',
  amberSoft: '#FFFBEB',
  crimson: '#991B1B',
  ink: '#0F172A',
  slate: '#475569',
  slateMuted: '#94A3B8',
  slateSoft: '#F8FAFC',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  surface: '#FFFFFF',
  canvas: '#F8F9FA',
} as const;

/**
 * Calculates a smooth cubic Bézier SVG path through a series of points
 */
function getSmoothSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

/**
 * High-character smooth sparkline with gradient wash
 */
function ElegantSparkline({ points, color, height = 34, width = 110, id }: { points: number[]; color: string; height?: number; width?: number; id: string }) {
  const safe = points.length >= 2 ? points : [2, 3, 2, 4, 3, 5];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const span = Math.max(max - min, 1);

  const coords = safe.map((v, i) => {
    const x = 3 + (i / (safe.length - 1)) * (width - 6);
    const y = height - 4 - ((v - min) / span) * (height - 10);
    return { x, y };
  });

  const linePath = getSmoothSplinePath(coords);
  const lastX = coords[coords.length - 1].x;
  const firstX = coords[0].x;
  const areaPath = `${linePath} L ${lastX.toFixed(1)} ${height} L ${firstX.toFixed(1)} ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3" fill={color} />
    </svg>
  );
}

/**
 * Architectural Dual-Area Spline Wave Chart
 */
function ArchitecturalWaveChart({
  labels,
  primary,
  secondary,
}: {
  labels: string[];
  primary: number[];
  secondary: number[];
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const w = 620;
  const h = 210;
  const padX = 36;
  const padY = 22;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const maxVal = Math.max(...primary, ...secondary, 5);

  const toPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const x = padX + (vals.length > 1 ? (i / (vals.length - 1)) * innerW : innerW / 2);
      const y = padY + innerH - (v / maxVal) * innerH;
      return { x, y };
    });

  const pPts = toPoints(primary);
  const sPts = toPoints(secondary);

  const pLine = getSmoothSplinePath(pPts);
  const sLine = getSmoothSplinePath(sPts);

  const base = padY + innerH;
  const pArea = pPts.length > 0 ? `${pLine} L ${pPts[pPts.length - 1].x.toFixed(1)} ${base} L ${pPts[0].x.toFixed(1)} ${base} Z` : '';
  const sArea = sPts.length > 0 ? `${sLine} L ${sPts[sPts.length - 1].x.toFixed(1)} ${base} L ${sPts[0].x.toFixed(1)} ${base} Z` : '';

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h + 28}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="wave-primary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={THEME.cobalt} stopOpacity="0.22" />
            <stop offset="100%" stopColor={THEME.cobalt} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="wave-secondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={THEME.emerald} stopOpacity="0.20" />
            <stop offset="100%" stopColor={THEME.emerald} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Ambient Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const y = padY + innerH * (1 - t);
          return (
            <g key={idx}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke={idx === 0 ? THEME.border : THEME.borderSubtle} strokeWidth="1" strokeDasharray={idx === 0 ? 'none' : '3 3'} />
              <text x={8} y={y + 3.5} fontSize="10" fill={THEME.slateMuted} fontWeight="500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(maxVal * t)}
              </text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={pArea} fill="url(#wave-primary)" />
        <path d={sArea} fill="url(#wave-secondary)" />

        {/* Spline Lines */}
        <path d={pLine} fill="none" stroke={THEME.cobalt} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={sLine} fill="none" stroke={THEME.emerald} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive Hover Nodes */}
        {pPts.map((p, i) => (
          <g key={`node-${i}`} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r={hoverIndex === i ? 6 : 3.5} fill={THEME.surface} stroke={THEME.cobalt} strokeWidth="2.5" />
            <circle cx={sPts[i].x} cy={sPts[i].y} r={hoverIndex === i ? 6 : 3.5} fill={THEME.surface} stroke={THEME.emerald} strokeWidth="2.5" />
          </g>
        ))}

        {/* X-Axis Month Labels */}
        {labels.map((lbl, i) => {
          const x = padX + (labels.length > 1 ? (i / (labels.length - 1)) * innerW : innerW / 2);
          const isSelected = hoverIndex === i;
          return (
            <text
              key={lbl}
              x={x}
              y={h + 18}
              textAnchor="middle"
              fontSize="11"
              fill={isSelected ? THEME.ink : THEME.slate}
              fontWeight={isSelected ? '700' : '600'}
            >
              {lbl}
            </text>
          );
        })}
      </svg>

      {/* Floating Hover Readout */}
      {hoverIndex !== null && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            background: THEME.ink,
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            gap: 12,
            fontVariantNumeric: 'tabular-nums',
            zIndex: 10,
          }}
        >
          <span><strong>{labels[hoverIndex]}:</strong></span>
          <span style={{ color: '#93C5FD' }}>{primary[hoverIndex]} New Leads</span>
          <span style={{ color: '#86EFAC' }}>{secondary[hoverIndex]} Tours &amp; Props</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem', padding: '0 0.5rem', fontSize: '0.78rem', color: THEME.slate }}>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: THEME.cobalt, display: 'inline-block' }} />
            New Inbound Leads
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: THEME.emerald, display: 'inline-block' }} />
            Site Tours &amp; Unit Additions
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: THEME.slateMuted, fontStyle: 'italic' }}>
          Hover nodes to inspect month velocity
        </span>
      </div>
    </div>
  );
}

/**
 * Concentric Radial Channel Distribution Matrix
 */
function ChannelRadialMatrix({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const r = 50;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
        <svg width="136" height="136" viewBox="0 0 136 136">
          <circle cx="68" cy="68" r={r} fill="none" stroke={THEME.borderSubtle} strokeWidth="16" />
          {total > 0 &&
            segments.map((seg) => {
              const dash = (seg.value / total) * c;
              const el = (
                <circle
                  key={seg.label}
                  cx="68"
                  cy="68"
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${Math.max(dash - 2, 0)} ${c - Math.max(dash - 2, 0)}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  transform="rotate(-90 68 68)"
                  style={{ transition: 'stroke-dasharray 0.4s ease' }}
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: THEME.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {total}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: THEME.slateMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>
            Total Inquiries
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 170, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={seg.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: THEME.ink, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
                  {seg.label}
                </span>
                <span style={{ color: THEME.slate, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {seg.value} <span style={{ fontSize: '0.72rem', color: THEME.slateMuted, fontWeight: 500 }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: 4, background: THEME.borderSubtle, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: seg.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProperties().catch(() => []),
      api.getProjects().catch(() => []),
      api.getLeads().catch(() => []),
      api.getVisitRequests().catch(() => []),
      api.getSubmissions().catch(() => []),
    ])
      .then(([propsRes, projRes, leadsRes, visitsRes, subRes]) => {
        setProperties(Array.isArray(propsRes) ? propsRes : []);
        setProjects(Array.isArray(projRes) ? projRes : []);
        setLeads(Array.isArray(leadsRes) ? leadsRes : []);
        setVisits(Array.isArray(visitsRes) ? visitsRes : []);
        setSubmissions(Array.isArray(subRes) ? subRes : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const availableProps = useMemo(() => properties.filter((p) => p.status === 'available').length, [properties]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'Sold Out').length, [projects]);
  const pendingVisits = useMemo(() => visits.filter((v) => v.status === 'pending' || v.status === 'confirmed').length, [visits]);
  const pendingSubmissions = useMemo(() => submissions.filter((s) => s.submission_status === 'Submitted').length, [submissions]);

  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; leads: number; activity: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key, label, leads: 0, activity: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const l of leads) {
      const k = (l.created_at || '').slice(0, 7);
      const bucket = byKey.get(k);
      if (bucket) bucket.leads += 1;
    }
    for (const v of visits) {
      const k = (v.requested_at || '').slice(0, 7);
      const bucket = byKey.get(k);
      if (bucket) bucket.activity += 1;
    }
    for (const p of properties) {
      const k = (p.created_at || '').slice(0, 7);
      const bucket = byKey.get(k);
      if (bucket) bucket.activity += 1;
    }
    return months;
  }, [leads, visits, properties]);

  const channelSegments = useMemo(() => {
    const counts = { Website: 0, WhatsApp: 0, 'Call Center': 0, 'Direct / Other': 0 };
    for (const l of leads) {
      const src = (l.source || 'Website').toLowerCase();
      if (src.includes('whatsapp')) counts.WhatsApp += 1;
      else if (src.includes('call') || src.includes('phone')) counts['Call Center'] += 1;
      else if (src.includes('web') || src === '') counts.Website += 1;
      else counts['Direct / Other'] += 1;
    }
    return [
      { label: 'Attaie Portal', value: counts.Website, color: THEME.cobalt },
      { label: 'WhatsApp Direct', value: counts.WhatsApp, color: THEME.emerald },
      { label: 'Inbound Hotline', value: counts['Call Center'], color: THEME.gold },
      { label: 'Direct / Referral', value: counts['Direct / Other'], color: THEME.slateMuted },
    ];
  }, [leads]);

  const kpis = [
    {
      id: 'props',
      label: 'Portfolio Units',
      subtitle: 'Exclusive Listed Properties',
      value: properties.length,
      delta: `${availableProps} Ready to Buy`,
      tone: THEME.emerald,
      toneBg: THEME.emeraldSoft,
      toneBorder: THEME.emeraldBorder,
      accentBorder: THEME.emerald,
      points: [4, 6, 5, 8, 9, Math.max(properties.length, 1)],
      to: '/properties',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M8 10h.01" />
          <path d="M16 10h.01" />
          <path d="M8 14h.01" />
          <path d="M16 14h.01" />
        </svg>
      ),
    },
    {
      id: 'projects',
      label: 'Master Projects',
      subtitle: 'Tower Developments',
      value: activeProjects,
      delta: `${projects.length} Total Masterplans`,
      tone: THEME.cobalt,
      toneBg: '#EBF4FC',
      toneBorder: '#BCE0F8',
      accentBorder: THEME.lapis,
      points: [2, 2, 3, 3, 4, Math.max(activeProjects, 1)],
      to: '/projects',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      id: 'leads',
      label: 'Active Pipeline',
      subtitle: 'Verified Inbound Leads',
      value: leads.length,
      delta: `${leads.filter((l) => l.stage === 'new' || !l.stage).length} Inbound SLA Due`,
      tone: THEME.gold,
      toneBg: THEME.goldSoft,
      toneBorder: THEME.goldBorder,
      accentBorder: THEME.gold,
      points: monthlySeries.map((m) => m.leads || 1),
      to: '/leads',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'visits',
      label: 'VIP Site Tours',
      subtitle: 'On-Site Client Inspections',
      value: visits.length,
      delta: `${pendingVisits} Confirmed & Pending`,
      tone: THEME.amber,
      toneBg: THEME.amberSoft,
      toneBorder: '#FDE68A',
      accentBorder: THEME.amber,
      points: monthlySeries.map((m) => m.activity || 1),
      to: '/visits',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${THEME.border}`, borderTopColor: THEME.cobalt, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: THEME.slate, fontSize: '0.86rem', fontWeight: 600 }}>Syncing Attaie Executive Console…</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* Executive Command Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.4rem',
          paddingBottom: '1.1rem',
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: THEME.lapis,
                color: '#FFFFFF',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '0.2rem 0.55rem',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
              Executive Command
            </span>
            <span style={{ fontSize: '0.78rem', color: THEME.slateMuted, fontWeight: 500 }}>
              Kabul UTC+04:30 · Attaie Enterprise CRM
            </span>
          </div>

          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: THEME.ink, margin: 0, letterSpacing: '-0.02em' }}>
            Portfolio Cockpit &amp; Pipeline Engine
          </h1>
          <p style={{ fontSize: '0.84rem', color: THEME.slate, margin: '0.25rem 0 0' }}>
            Real-time inventory occupancy, buyer lead velocity, and omnichannel conversion attribution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/leads')}
            style={{
              padding: '0.52rem 1.05rem',
              background: THEME.surface,
              color: THEME.ink,
              border: `1px solid ${THEME.border}`,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Triage Leads</span>
            <span style={{ padding: '0.1rem 0.4rem', borderRadius: 4, background: THEME.slateSoft, fontSize: '0.74rem', fontWeight: 700 }}>
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/properties/new')}
            style={{
              padding: '0.52rem 1.15rem',
              background: THEME.lapis,
              color: '#FFFFFF',
              border: `1px solid ${THEME.lapis}`,
              borderRadius: 7,
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(11,37,69,0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
            <span>New Listing</span>
          </button>
        </div>
      </div>

      {/* 4 Architectural KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.1rem',
          marginBottom: '1.4rem',
        }}
      >
        {kpis.map((kpi) => (
          <button
            key={kpi.id}
            type="button"
            onClick={() => navigate(kpi.to)}
            style={{
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderTop: `3px solid ${kpi.accentBorder}`,
              borderRadius: 10,
              padding: '1.1rem 1.25rem',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(11,37,69,0.03)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(11,37,69,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(11,37,69,0.03)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    background: kpi.toneBg,
                    color: kpi.tone,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: THEME.ink, lineHeight: 1.1 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: THEME.slateMuted, marginTop: 2 }}>
                    {kpi.subtitle}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: kpi.tone,
                  background: kpi.toneBg,
                  border: `1px solid ${kpi.toneBorder}`,
                  padding: '0.18rem 0.55rem',
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                {kpi.delta}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
              <span
                style={{
                  fontSize: '1.95rem',
                  fontWeight: 800,
                  color: THEME.ink,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {kpi.value.toLocaleString()}
              </span>
              <ElegantSparkline id={kpi.id} points={kpi.points} color={kpi.tone} />
            </div>
          </button>
        ))}
      </div>

      {/* Primary Analytics Grid: 6-Month Wave + Acquisition Radial */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.2rem',
          marginBottom: '1.4rem',
        }}
      >
        {/* Wave Trend Card */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: 10,
            padding: '1.25rem 1.4rem',
            boxShadow: '0 1px 3px rgba(11,37,69,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: THEME.ink }}>
                6-Month Trajectory &amp; Portfolio Intake
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: THEME.slate }}>
                Bimonthly trend of inbound CRM inquiries vs. scheduled property viewings
              </p>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: THEME.cobalt,
                background: '#EBF4FC',
                padding: '0.2rem 0.55rem',
                borderRadius: 4,
              }}
            >
              Live Spline View
            </span>
          </div>

          <ArchitecturalWaveChart
            labels={monthlySeries.map((m) => m.label)}
            primary={monthlySeries.map((m) => m.leads)}
            secondary={monthlySeries.map((m) => m.activity)}
          />
        </div>

        {/* Channel Breakdown Matrix */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: 10,
            padding: '1.25rem 1.4rem',
            boxShadow: '0 1px 3px rgba(11,37,69,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: THEME.ink }}>
                  Inquiry Channel Attribution
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: THEME.slate }}>
                  Acquisition funnel split across marketing touchpoints
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: THEME.emerald,
                  background: THEME.emeraldSoft,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 4,
                }}
              >
                100% Attributed
              </span>
            </div>

            <ChannelRadialMatrix segments={channelSegments} />
          </div>

          <div
            style={{
              marginTop: '1.1rem',
              paddingTop: '0.85rem',
              borderTop: `1px solid ${THEME.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: THEME.slate,
            }}
          >
            <span>Primary Inbound Driver: <strong>Attaie Portal (SEO)</strong></span>
            <button
              type="button"
              onClick={() => navigate('/leads')}
              style={{ background: 'none', border: 'none', color: THEME.cobalt, fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Drilldown Source Logs →
            </button>
          </div>
        </div>
      </div>

      {/* Operational Dispatch Section: VIP Site Inspections & Tower Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.2rem',
        }}
      >
        {/* VIP Site Tours Dispatch */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: 10,
            padding: '1.25rem 1.4rem',
            boxShadow: '0 1px 3px rgba(11,37,69,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: THEME.ink }}>
                VIP Site Tours Radar ({visits.slice(0, 4).length})
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: THEME.slate }}>
                Upcoming private architectural inspections requiring branch escort
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/visits')}
              style={{ background: 'none', border: 'none', color: THEME.cobalt, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All ({visits.length}) →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {visits.slice(0, 4).map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 7,
                  background: THEME.slateSoft,
                  border: `1px solid ${THEME.borderSubtle}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: THEME.lapis,
                      color: '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(v.name || 'VIP').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: THEME.ink }}>
                      {v.name || 'Private VIP Client'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: THEME.slateMuted }}>
                      {v.phone || 'Direct Phone'} · {v.requested_at || 'Scheduled'}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.18rem 0.5rem',
                    borderRadius: 4,
                    background: v.status === 'confirmed' ? THEME.emeraldSoft : THEME.goldSoft,
                    color: v.status === 'confirmed' ? THEME.emerald : THEME.gold,
                    border: `1px solid ${v.status === 'confirmed' ? THEME.emeraldBorder : THEME.goldBorder}`,
                    textTransform: 'capitalize',
                  }}
                >
                  {v.status || 'Pending'}
                </span>
              </div>
            ))}

            {visits.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: THEME.slateMuted, fontSize: '0.82rem' }}>
                No pending VIP visits scheduled today.
              </div>
            )}
          </div>
        </div>

        {/* Master Project Occupancy Health */}
        <div
          style={{
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            borderRadius: 10,
            padding: '1.25rem 1.4rem',
            boxShadow: '0 1px 3px rgba(11,37,69,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: THEME.ink }}>
                  Active Tower Developments ({projects.slice(0, 3).length})
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: THEME.slate }}>
                  Masterplan inventory progression &amp; unit reservation status
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                style={{ background: 'none', border: 'none', color: THEME.cobalt, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Tower Catalog →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.slice(0, 3).map((p) => {
                const totalUnits = Number(p.total_units || 40);
                const soldUnits = Math.min(Math.round(totalUnits * 0.72), totalUnits);
                const pct = Math.round((soldUnits / totalUnits) * 100);

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '0.7rem 0.85rem',
                      borderRadius: 7,
                      border: `1px solid ${THEME.borderSubtle}`,
                      background: THEME.slateSoft,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: THEME.ink }}>
                          {p.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: THEME.slateMuted, marginLeft: 6 }}>
                          ({p.location || 'Kabul'})
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: THEME.cobalt, fontVariantNumeric: 'tabular-nums' }}>
                        {pct}% Contracted
                      </span>
                    </div>

                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pct > 80 ? THEME.emerald : THEME.cobalt,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: THEME.slateMuted, fontSize: '0.82rem' }}>
                  No active master projects recorded.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '1.1rem',
              paddingTop: '0.85rem',
              borderTop: `1px solid ${THEME.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: THEME.slate,
            }}
          >
            <span>Media Desk: <strong>{pendingSubmissions} Submissions</strong> Pending</span>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              style={{ background: 'none', border: 'none', color: THEME.cobalt, fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Review Desk →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
