import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Property } from '../api';
import { V1, V1Pagination, V1_STYLES, v1BadgeStyle, type V1Tone } from '../components/variant1';

type Status = Property['status'];

const STATUS_TONE: Record<Status, V1Tone> = {
  available: 'green',
  sold: 'green',
  rented: 'blue',
  pending: 'slate',
};

const STATUSES: Status[] = ['available', 'pending', 'sold', 'rented'];
const nextStatus = (s: Status): Status => STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length];
const PAGE_SIZE = 15;

export default function Properties() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.getProperties()
      .then(setItems)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load properties.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (p.serial_number || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const remove = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setError(null);
    try {
      await api.deleteProperty(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete property "${title}".`);
    }
  };

  const cycleStatus = async (p: Property) => {
    const next = nextStatus(p.status);
    setToggling(p.id);
    setError(null);
    try {
      const { id: _id, created_at: _ca, ...rest } = p;
      await api.updateProperty({ ...rest, id: p.id, status: next });
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update status for "${p.title}".`);
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <p style={{ padding: '2rem', color: V1.slate }}>Loading…</p>;

  return (
    <div>
      <div style={V1_STYLES.header}>
        <div>
          <h1 style={V1_STYLES.title}>Properties ({items.length})</h1>
          <p style={V1_STYLES.subtitle}>Manage residential &amp; commercial listings, pricing, and availability.</p>
        </div>
        <button style={V1_STYLES.primaryBtn} onClick={() => navigate('/properties/new')}>
          + Add Property
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: V1.dangerSoft,
            border: `1px solid ${V1.danger}40`,
            color: V1.danger,
            padding: '0.75rem 1rem',
            borderRadius: 8,
            marginBottom: '1rem',
            fontWeight: 600,
            fontSize: '0.84rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✕ {error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: V1.danger,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0.2rem 0.4rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={V1_STYLES.toolbar}>
        <div style={V1_STYLES.filterRow}>
          {(['all', ...STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              style={V1_STYLES.filterPill(statusFilter === st)}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
            >
              {st === 'all' ? `All (${items.length})` : `${st.charAt(0).toUpperCase() + st.slice(1)} (${items.filter((i) => i.status === st).length})`}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by serial number, title, or location"
          style={V1_STYLES.searchInput}
        />
      </div>

      <div style={V1_STYLES.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={V1_STYLES.table}>
            <thead>
              <tr>
                {['', 'Title', 'Price', 'Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={V1_STYLES.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...V1_STYLES.td, width: 68, paddingRight: 0 }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, display: 'block', border: `1px solid ${V1.border}` }} />
                    ) : (
                      <div style={{ width: 52, height: 40, background: V1.slateSoft, color: V1.slate, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                        PROP
                      </div>
                    )}
                  </td>
                  <td style={V1_STYLES.td}>
                    <div style={{ color: V1.ink, fontWeight: 600, fontSize: '0.74rem', marginBottom: '0.18rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {p.serial_number}
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: '0.1rem' }}>{p.title}</div>
                    <div style={{ color: V1.slate, fontSize: '0.8rem' }}>{p.location}</div>
                  </td>
                  <td style={V1_STYLES.td}>
                    <div style={{ fontWeight: 600 }}>${Number(p.price).toLocaleString()}</div>
                    <div style={{ color: V1.slate, fontSize: '0.78rem' }}>{p.listing_type === 'rent' ? '/mo' : 'sale'}</div>
                  </td>
                  <td style={V1_STYLES.td}>{p.type}</td>
                  <td style={V1_STYLES.td}>
                    <button
                      style={{ ...v1BadgeStyle(STATUS_TONE[p.status] || 'slate'), cursor: 'pointer', opacity: toggling === p.id ? 0.5 : 1 }}
                      onClick={() => cycleStatus(p)}
                      title="Click to cycle status"
                      disabled={toggling === p.id}
                    >
                      {p.status}
                    </button>
                    <div style={{ fontSize: '0.7rem', color: V1.slate, marginTop: '0.2rem' }}>click to change</div>
                  </td>
                  <td style={V1_STYLES.td}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        style={{ ...V1_STYLES.primaryBtn, padding: '0.32rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => navigate(`/properties/${p.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button style={V1_STYLES.dangerBtn} onClick={() => remove(p.id, p.title)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...V1_STYLES.td, textAlign: 'center', color: V1.slate, padding: '3rem' }}>
                    {items.length === 0 ? 'No properties yet. Add your first one →' : 'No properties match the current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <V1Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
