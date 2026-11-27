import type { Lead, Followup } from "../../../../packages/staff-contracts/types";
import { observedFollowupCompliance, observedLeadDistribution } from "../../../../packages/staff-contracts/observed-metrics.mjs";

interface OverviewAnalyticsStripProps {
  language?: "en" | "fa";
  activeRole: string;
  leads: Lead[];
  followups: Followup[];
}

export function KpiSparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2 || points.some(point => !Number.isFinite(point))) return null;
  const safe = points;
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const span = Math.max(max - min, 1);
  const w = 84;
  const h = 26;
  const pts = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return { x, y };
  });

  const linePath = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`), "");
  const areaPath = pts.length > 0 ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${h} L ${pts[0].x.toFixed(1)} ${h} Z` : "";
  const gradId = `spark-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

export function OverviewAnalyticsStrip({ activeRole, leads, followups, language = "en" }: OverviewAnalyticsStripProps) {
  const fa = language === "fa";
  if (activeRole === "sales") {
    const result = observedFollowupCompliance(followups);
    return <section className="panel" style={{ marginBottom: 16 }}>
      <h2>{fa ? "رعایت مهلت پیگیری" : "Follow-up compliance"}</h2>
      <p>{fa ? "پیگیری‌های در انتظار شامل درصد نیست." : "Pending follow-ups are excluded from the percentage."}</p>
      <strong style={{fontVariantNumeric:"tabular-nums",fontSize:28}}>{result.percent === null ? "—" : `${result.percent}%`}</strong>
      <p>{fa ? "به‌موقع / دیرشده / در انتظار" : "On time / Late / Pending"}: {result.onTime} / {result.late} / {result.pending}</p>
    </section>;
  }
  if (!["manager", "ceo", "callcenter"].includes(activeRole)) return null;
  const distribution = observedLeadDistribution(leads);
  const labels: Record<string,string> = fa ? {draft:"پیش‌نویس",active:"فعال",closed:"معامله بسته‌شده",lost:"از دست‌رفته"} : {draft:"Draft",active:"Active",closed:"Deal closed",lost:"Lost"};
  return <section className="panel" style={{marginBottom:16}}>
    <h2>{fa ? "وضعیت سرنخ‌های بارگذاری‌شده" : "Loaded lead snapshot"}</h2>
    <p>{fa ? "فقط رکوردهای بارگذاری‌شده؛ مجموع تمام شعب، درآمد یا موجودی ملک نیست." : "Loaded records only; not a complete branch total, revenue or property inventory."}</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:24}}>{distribution.map(({status,count}: {status:string;count:number}) => <div key={status}><span>{labels[status]}</span><strong style={{display:"block",fontSize:24,fontVariantNumeric:"tabular-nums"}}>{count}</strong></div>)}</div>
    <p>{fa ? "داده تاریخی تأییدشده در دسترس نیست." : "Verified historical series is unavailable."}</p>
  </section>;
}
