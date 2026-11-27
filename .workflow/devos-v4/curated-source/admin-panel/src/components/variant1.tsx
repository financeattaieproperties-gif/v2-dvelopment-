import type { CSSProperties } from 'react';

export const V1 = {
  blue: '#0072BC',
  blueHover: '#005E9B',
  blueSoft: '#E6F2FA',
  green: '#14A850',
  greenSoft: '#E8F7EE',
  slate: '#818285',
  slateSoft: '#F1F5F9',
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  rail: '#FBFBFD',
  border: '#E2E8F0',
  borderSoft: '#CBD5E1',
  ink: '#1E293B',
  danger: '#B91C1C',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
} as const;

export type V1Tone = 'green' | 'blue' | 'slate' | 'danger';

export function v1BadgeStyle(tone: V1Tone): CSSProperties {
  const map: Record<V1Tone, { bg: string; color: string; border: string }> = {
    green: { bg: V1.greenSoft, color: '#0F7A3A', border: '#BDE8CE' },
    blue: { bg: V1.blueSoft, color: V1.blueHover, border: '#B8DCF2' },
    slate: { bg: V1.slateSoft, color: '#475569', border: V1.border },
    danger: { bg: V1.dangerSoft, color: V1.danger, border: V1.dangerBorder },
  };
  const c = map[tone];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '0.22rem 0.6rem',
    borderRadius: 6,
    fontSize: '0.74rem',
    fontWeight: 600,
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };
}

export const V1_STYLES = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
  } as const,
  title: {
    fontSize: '1.35rem',
    fontWeight: 700,
    margin: 0,
    color: V1.ink,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.015em',
  } as const,
  subtitle: {
    fontSize: '0.84rem',
    color: V1.slate,
    margin: '0.22rem 0 0',
  } as const,
  primaryBtn: {
    padding: '0.55rem 1.1rem',
    background: V1.blue,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.84rem',
    whiteSpace: 'nowrap' as const,
  } as const,
  secondaryBtn: {
    padding: '0.52rem 0.95rem',
    background: V1.surface,
    color: V1.ink,
    border: `1px solid ${V1.border}`,
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.82rem',
    whiteSpace: 'nowrap' as const,
  } as const,
  dangerBtn: {
    padding: '0.32rem 0.75rem',
    background: V1.surface,
    color: V1.danger,
    border: `1px solid ${V1.dangerBorder}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: 600,
  } as const,
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: '1rem',
  } as const,
  searchInput: {
    padding: '0.55rem 0.85rem',
    border: `1px solid ${V1.border}`,
    borderRadius: 8,
    fontSize: '0.84rem',
    color: V1.ink,
    background: V1.surface,
    width: 'min(100%, 360px)',
    outline: 'none',
  } as const,
  filterRow: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } as const,
  filterPill: (active: boolean): CSSProperties => ({
    padding: '0.38rem 0.8rem',
    borderRadius: 999,
    border: `1px solid ${active ? V1.blue : V1.border}`,
    background: active ? V1.blueSoft : V1.surface,
    color: active ? V1.blueHover : V1.slate,
    fontWeight: 600,
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  }),
  card: {
    background: V1.surface,
    borderRadius: 8,
    border: `1px solid ${V1.border}`,
    overflow: 'hidden',
  } as const,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    background: V1.surface,
  } as const,
  th: {
    padding: '0.7rem 1rem',
    background: V1.canvas,
    textAlign: 'left' as const,
    fontSize: '0.7rem',
    fontWeight: 700,
    color: V1.slate,
    borderBottom: `1px solid ${V1.border}`,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  } as const,
  td: {
    padding: '0.75rem 1rem',
    borderBottom: `1px solid ${V1.slateSoft}`,
    fontSize: '0.84rem',
    verticalAlign: 'middle' as const,
    color: V1.ink,
    fontVariantNumeric: 'tabular-nums',
  } as const,
};

export function V1Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '0.75rem 1rem',
        background: V1.surface,
        borderTop: `1px solid ${V1.border}`,
        fontSize: '0.8rem',
        color: V1.slate,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span>
        Showing <strong style={{ color: V1.ink }}>{start}</strong>–<strong style={{ color: V1.ink }}>{end}</strong> of{' '}
        <strong style={{ color: V1.ink }}>{total}</strong>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          style={{
            ...V1_STYLES.secondaryBtn,
            padding: '0.34rem 0.7rem',
            fontSize: '0.78rem',
            opacity: safePage <= 1 ? 0.45 : 1,
            cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <span style={{ padding: '0 0.4rem', fontWeight: 600, color: V1.ink }}>
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          style={{
            ...V1_STYLES.secondaryBtn,
            padding: '0.34rem 0.7rem',
            fontSize: '0.78rem',
            opacity: safePage >= totalPages ? 0.45 : 1,
            cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
