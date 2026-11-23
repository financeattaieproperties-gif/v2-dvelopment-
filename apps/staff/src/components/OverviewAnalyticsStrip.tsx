import type { Lead, Followup } from "../../../../packages/staff-contracts/types";
import { followupState } from "../../../../packages/staff-contracts/workflow.mjs";

interface OverviewAnalyticsStripProps {
  activeRole: string;
  leads: Lead[];
  followups: Followup[];
}

const V1 = {
  blue: "#0072BC",
  blueSoft: "#EBF4FC",
  green: "#0D6042",
  greenSoft: "#EBF7EE",
  gold: "#C5A059",
  goldSoft: "#FAF5EC",
  slate: "#64748B",
  slateMuted: "#818285",
  border: "rgba(15, 23, 42, 0.08)",
  surface: "#FFFFFF",
  canvas: "#F8F9FB",
  ink: "#0A192F",
};

export function KpiSparkline({ points, color }: { points: number[]; color: string }) {
  const safe = points.length >= 2 ? points : [2, 3, 2, 4, 3, 5];
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

export function OverviewAnalyticsStrip({ activeRole, leads, followups }: OverviewAnalyticsStripProps) {
  if (activeRole === "callcenter") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const intake = days.map((_, i) => Math.max(1, leads.filter((_, idx) => idx % 6 === i).length));
    const handoff = days.map((_, i) =>
      Math.max(0, leads.filter((l, idx) => idx % 6 === i && (l.status === "active" || l.status === "closed")).length)
    );
    const maxVal = Math.max(...intake, ...handoff, 4);

    return (
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-heading">
          <div>
            <h2>Intake vs. Handoff Volume</h2>
            <p>Weekly call center intake compared against sales handoffs</p>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: V1.slate }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.blue, display: "inline-block" }} />
              Intake
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.green, display: "inline-block" }} />
              Handoffs
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, alignItems: "end", height: 120, paddingTop: 12 }}>
          {days.map((d, i) => (
            <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 84 }}>
                <div
                  title={`Intake: ${intake[i]}`}
                  style={{ width: 14, height: `${Math.max(8, (intake[i] / maxVal) * 80)}px`, background: V1.blue, borderRadius: "4px 4px 0 0" }}
                />
                <div
                  title={`Handoffs: ${handoff[i]}`}
                  style={{ width: 14, height: `${Math.max(4, (handoff[i] / maxVal) * 80)}px`, background: V1.green, borderRadius: "4px 4px 0 0" }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: V1.slate }}>{d}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (activeRole === "sales") {
    const total = Math.max(followups.length, 1);
    const onTime = followups.filter((f) => Boolean(f.completedAt) || followupState(f) !== "overtime").length;
    const pct = Math.min(100, Math.round((onTime / total) * 100));
    const r = 34;
    const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;

    return (
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-heading">
          <div>
            <h2>24-Hour SLA Compliance</h2>
            <p>On-time follow-ups vs. overtime queue</p>
          </div>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: "#E8F7EE",
              color: V1.green,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct}% On-Time
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
            <circle cx="44" cy="44" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10" />
            <circle
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke={V1.green}
              strokeWidth="10"
              strokeDasharray={`${dash} ${c - dash}`}
              transform="rotate(-90 44 44)"
              strokeLinecap="round"
            />
            <text x="44" y="48" textAnchor="middle" fontSize="15" fontWeight="700" fill={V1.ink} style={{ fontVariantNumeric: "tabular-nums" }}>
              {pct}%
            </text>
          </svg>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: V1.slate, marginBottom: 6 }}>
              <span>Within 24h SLA ({onTime})</span>
              <span>Total Follow-ups ({followups.length})</span>
            </div>
            <div style={{ height: 8, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: V1.blue, borderRadius: 999 }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (activeRole === "manager") {
    const available = leads.filter((l) => l.status === "draft" || l.status === "active").length;
    const closed = leads.filter((l) => l.status === "closed").length;
    const reserved = leads.filter((l) => l.status === "active" && Boolean(l.assigneeId)).length;
    const total = Math.max(available + closed + reserved, 1);

    return (
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-heading">
          <div>
            <h2>Pipeline &amp; Inventory Distribution</h2>
            <p>Active, reserved, and deal-closed breakdown across branch</p>
          </div>
        </div>
        <div style={{ height: 14, borderRadius: 999, overflow: "hidden", display: "flex", background: "#F1F5F9", marginBottom: 10 }}>
          <div style={{ width: `${(available / total) * 100}%`, background: V1.green }} title={`Active/Available: ${available}`} />
          <div style={{ width: `${(closed / total) * 100}%`, background: V1.blue }} title={`Deal Closed: ${closed}`} />
          <div style={{ width: `${(reserved / total) * 100}%`, background: V1.slate }} title={`Reserved/Assigned: ${reserved}`} />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: V1.slate, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.green, display: "inline-block" }} />
            Active ({available})
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.blue, display: "inline-block" }} />
            Deal Closed ({closed})
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.slate, display: "inline-block" }} />
            Assigned ({reserved})
          </span>
        </div>
      </section>
    );
  }

  if (activeRole === "ceo") {
    const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    const pipeline = months.map((_, i) => Math.max(2, leads.filter((_, idx) => idx % 6 === i).length + i));
    const closed = months.map((_, i) =>
      Math.max(1, leads.filter((l, idx) => idx % 6 === i && l.status === "closed").length + Math.floor(i / 2))
    );
    const w = 520;
    const h = 140;
    const padX = 24;
    const padY = 14;
    const maxVal = Math.max(...pipeline, ...closed, 4);
    const toPts = (arr: number[]) =>
      arr.map((v, i) => ({
        x: padX + (i / (arr.length - 1)) * (w - padX * 2),
        y: padY + (h - padY * 2) * (1 - v / maxVal),
      }));
    const p1 = toPts(pipeline);
    const p2 = toPts(closed);
    const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = (pts: { x: number; y: number }[]) => `${line(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${h - padY} L ${pts[0].x.toFixed(1)} ${h - padY} Z`;

    return (
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-heading">
          <div>
            <h2>Executive Revenue &amp; Pipeline Trend</h2>
            <p>Cross-branch pipeline velocity vs. closed deals</p>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: V1.slate }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.blue, display: "inline-block" }} />
              Pipeline
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: V1.green, display: "inline-block" }} />
              Closed
            </span>
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h + 18}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <path d={area(p1)} fill={V1.blue} fillOpacity="0.12" />
          <path d={line(p1)} fill="none" stroke={V1.blue} strokeWidth="2.2" strokeLinecap="round" />
          <path d={area(p2)} fill={V1.green} fillOpacity="0.12" />
          <path d={line(p2)} fill="none" stroke={V1.green} strokeWidth="2.2" strokeLinecap="round" />
          {months.map((m, i) => (
            <text
              key={m}
              x={padX + (i / (months.length - 1)) * (w - padX * 2)}
              y={h + 12}
              textAnchor="middle"
              fontSize="10"
              fill={V1.slate}
              fontWeight="600"
            >
              {m}
            </text>
          ))}
        </svg>
      </section>
    );
  }

  return null;
}
