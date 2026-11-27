import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Project, type ProjectUnit } from '../api';
import { AdminSheetsExportModal } from '../components/GoogleWorkspaceTools';
import { ProjectOccupancyCard } from '../components/ProjectOccupancyCard';
import { V1, V1Pagination, V1_STYLES, v1BadgeStyle, type V1Tone } from '../components/variant1';

type Status = Project['status'];

const STATUSES: Status[] = ['Coming Soon', 'In Progress', 'Sold Out', 'Under Construction', 'Ready'];
const nextStatus = (s: Status): Status => STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length];
const PAGE_SIZE = 12;

const STATUS_TONE: Record<Status, V1Tone> = {
  Ready: 'green',
  'In Progress': 'blue',
  'Under Construction': 'blue',
  'Coming Soon': 'slate',
  'Sold Out': 'green',
};

export default function Projects() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [workspaceNotice, setWorkspaceNotice] = useState('');
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [projectUnitsById, setProjectUnitsById] = useState<Record<number, ProjectUnit[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.getProjects()
      .then(setItems)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load projects.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (p.name || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const remove = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setError(null);
    try {
      await api.deleteProject(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete project "${name}".`);
    }
  };

  const cycleStatus = async (p: Project) => {
    const next = nextStatus(p.status);
    setToggling(p.id);
    setError(null);
    try {
      const { id: _id, created_at: _ca, ...rest } = p;
      await api.updateProject({ ...rest, id: p.id, status: next });
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update status for "${p.name}".`);
    } finally {
      setToggling(null);
    }
  };

  const openSheetsExport = async () => {
    setLoadingUnits(true);
    try {
      const entries = await Promise.all(
        items.map(async (proj) => {
          try {
            const units = await api.getProjectUnits(proj.id);
            return [proj.id, units] as const;
          } catch {
            return [proj.id, []] as const;
          }
        })
      );
      setProjectUnitsById(Object.fromEntries(entries));
      setSheetsOpen(true);
    } finally {
      setLoadingUnits(false);
    }
  };

  if (loading) return <p style={{ padding: '2rem', color: V1.slate }}>Loading…</p>;

  return (
    <div>
      <div style={V1_STYLES.header}>
        <div>
          <h1 style={V1_STYLES.title}>Projects ({items.length})</h1>
          <p style={V1_STYLES.subtitle}>Track residential developments, unit availability, and delivery schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            style={{ ...V1_STYLES.secondaryBtn, opacity: loadingUnits ? 0.6 : 1 }}
            data-testid="admin-projects-sheets-btn"
            disabled={loadingUnits}
            onClick={() => void openSheetsExport()}
          >
            {loadingUnits ? 'Loading Units…' : 'Export Inventory to Sheets'}
          </button>
          <button style={V1_STYLES.primaryBtn} onClick={() => navigate('/projects/new')}>
            + Add Project
          </button>
        </div>
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

      {workspaceNotice && (
        <div
          role="status"
          style={{
            background: V1.greenSoft,
            border: '1px solid #BDE8CE',
            color: '#0F7A3A',
            padding: '0.7rem 1rem',
            borderRadius: 8,
            marginBottom: '1rem',
            fontWeight: 600,
            fontSize: '0.84rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {workspaceNotice}</span>
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setWorkspaceNotice('')}
            style={{ background: 'none', border: 'none', color: '#0F7A3A', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      <ProjectOccupancyCard projects={items} />

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
              {st === 'all' ? `All (${items.length})` : `${st} (${items.filter((i) => i.status === st).length})`}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search projects by name or location"
          style={V1_STYLES.searchInput}
        />
      </div>

      <div style={V1_STYLES.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={V1_STYLES.table}>
            <thead>
              <tr>
                {['', 'Name', 'Status', 'Units', 'Delivery', 'Actions'].map((h) => (
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
                        PROJ
                      </div>
                    )}
                  </td>
                  <td style={V1_STYLES.td}>
                    <div style={{ fontWeight: 600, marginBottom: '0.1rem' }}>{p.name}</div>
                    <div style={{ color: V1.slate, fontSize: '0.8rem' }}>{p.location}</div>
                  </td>
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
                    <span className="tabular-nums" style={{ fontWeight: 600, color: V1.ink }}>
                      {p.available_units}
                    </span>
                    <span style={{ color: V1.slate }}> / {p.total_units}</span>
                    <div style={{ fontSize: '0.78rem', color: V1.slate }}>available</div>
                  </td>
                  <td style={V1_STYLES.td}>
                    {p.delivery_date ? <span style={{ fontWeight: 600 }}>{p.delivery_date}</span> : <span style={{ color: V1.borderSoft }}>—</span>}
                  </td>
                  <td style={V1_STYLES.td}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        style={{ ...V1_STYLES.primaryBtn, padding: '0.32rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => navigate(`/projects/${p.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button style={V1_STYLES.dangerBtn} onClick={() => remove(p.id, p.name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...V1_STYLES.td, textAlign: 'center', color: V1.slate, padding: '3rem' }}>
                    {items.length === 0 ? 'No projects yet. Add your first one →' : 'No projects match the current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <V1Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </div>

      {sheetsOpen && (
        <AdminSheetsExportModal
          mode="inventory"
          projects={items}
          projectUnitsById={projectUnitsById}
          onClose={() => setSheetsOpen(false)}
          onSuccess={(msg) => setWorkspaceNotice(msg)}
        />
      )}
    </div>
  );
}
