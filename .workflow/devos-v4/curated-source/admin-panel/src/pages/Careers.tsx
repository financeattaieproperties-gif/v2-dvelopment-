import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type CareerJob } from '../api';
import { V1, V1Pagination, V1_STYLES, v1BadgeStyle } from '../components/variant1';

const S = {
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' as const, gap: '0.75rem' } as const,
  title:   { fontSize: '1.35rem', fontWeight: 700, margin: 0, color: V1.ink } as const,
  btnRow:  { display: 'flex', gap: '0.6rem', alignItems: 'center' } as const,
  addBtn:  { ...V1_STYLES.primaryBtn, padding: '0.55rem 1.1rem' } as const,
  appsBtn: { ...V1_STYLES.secondaryBtn, padding: '0.55rem 1.1rem' } as const,
  card:    V1_STYLES.card,
  table:   { ...V1_STYLES.table, fontSize: '0.88rem' } as const,
  th:      V1_STYLES.th,
  td:      V1_STYLES.td,
  actBtn:  (bg: string, color = '#fff', border = 'none') => ({
    padding: '0.35rem 0.7rem', background: bg, color, border, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' as const,
  }),
  badge:   (status: string, isExpired?: boolean) => {
    if (status === 'draft') return v1BadgeStyle('slate');
    if (status === 'closed' || isExpired) return v1BadgeStyle('danger');
    return v1BadgeStyle('green');
  },
  errBox:  { padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, background: V1.dangerSoft, color: V1.danger, fontSize: '0.85rem', fontWeight: 600 } as const,
};

const CAREER_PAGE_SIZE = 12;

export default function Careers() {
  const [jobs, setJobs]       = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | CareerJob['status']>('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const navigate              = useNavigate();

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (!q) return true;
      return (j.title || '').toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q);
    });
  }, [jobs, statusFilter, search]);

  const load = () => {
    setLoading(true);
    setError(null);
    api.getCareers()
      .then(setJobs)
      .catch((err: Error) => setError(err.message || 'Failed to load career announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const quickStatus = async (job: CareerJob, nextStatus: CareerJob['status']) => {
    setError(null);
    try {
      await api.updateCareer({
        id: job.id,
        title: job.title,
        location: job.location,
        employment_type: job.employment_type,
        description: job.description,
        qualifications: job.qualifications,
        deadline_at: job.deadline_at,
        status: nextStatus,
      });
      load();
    } catch (err) {
      setError((err as Error).message || 'Failed to update status');
    }
  };

  const remove = async (job: CareerJob) => {
    setError(null);
    try {
      await api.deleteCareer(job.id);
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (err) {
      setError((err as Error).message || 'Could not delete job announcement');
    }
  };

  return (
    <div>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Careers & Job Announcements</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Publish job openings, manage deadlines, and review candidate applications.
          </p>
        </div>
        <div style={S.btnRow}>
          <button style={S.appsBtn} onClick={() => navigate('/careers/applications')}>
            View All Applications
          </button>
          <button style={S.addBtn} onClick={() => navigate('/careers/new')}>
            + Post Job Opening
          </button>
        </div>
      </div>

      {error && <div style={S.errBox}>{error}</div>}

      <div style={V1_STYLES.toolbar}>
        <div style={V1_STYLES.filterRow}>
          {(['all', 'published', 'draft', 'closed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              style={V1_STYLES.filterPill(statusFilter === st)}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
            >
              {st === 'all' ? `All (${jobs.length})` : `${st.charAt(0).toUpperCase() + st.slice(1)} (${jobs.filter((j) => j.status === st).length})`}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search job openings by title or location"
          style={V1_STYLES.searchInput}
        />
      </div>

      <div style={S.card}>
        {loading ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>Loading career announcements…</p>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600 }}>No job announcements posted yet.</p>
            <button style={S.addBtn} onClick={() => navigate('/careers/new')}>+ Create First Job Announcement</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Title & Location</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Deadline (Kabul)</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Applications</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.slice((page - 1) * CAREER_PAGE_SIZE, page * CAREER_PAGE_SIZE).map(job => {
                  const statusLabel =
                    job.status === 'draft'
                      ? 'Draft'
                      : job.status === 'closed'
                      ? 'Closed'
                      : job.is_expired
                      ? 'Expired'
                      : 'Published';

                  return (
                    <tr key={job.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{job.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#818285' }}>{job.location}</div>
                      </td>
                      <td style={S.td}>{job.employment_type}</td>
                      <td style={S.td}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem' }}>
                          {job.deadline_at.slice(0, 16).replace('T', ' ')}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(job.status, job.is_expired)}>{statusLabel}</span>
                      </td>
                      <td style={S.td}>
                        <button
                          style={S.actBtn('#E6F2FA', '#0072BC', '1px solid #BAE6FD')}
                          onClick={() => navigate(`/careers/${job.id}/applications`)}
                        >
                          {job.application_count ?? 0} Applicants →
                        </button>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            style={S.actBtn(V1.blue)}
                            onClick={() => navigate(`/careers/${job.id}/edit`)}
                          >
                            Edit
                          </button>
                          {job.status !== 'published' && (
                            <button
                              style={S.actBtn(V1.green)}
                              onClick={() => quickStatus(job, 'published')}
                            >
                              Publish
                            </button>
                          )}
                          {job.status === 'published' && (
                            <button
                              style={S.actBtn('#d97706')}
                              onClick={() => quickStatus(job, 'closed')}
                            >
                              Close
                            </button>
                          )}
                          {job.status !== 'draft' && (
                            <button
                              style={S.actBtn('#e2e8f0', '#334155')}
                              onClick={() => quickStatus(job, 'draft')}
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            style={S.actBtn('#fee2e2', '#dc2626')}
                            onClick={() => remove(job)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <V1Pagination page={page} pageSize={CAREER_PAGE_SIZE} total={filteredJobs.length} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
