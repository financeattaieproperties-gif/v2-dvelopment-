import { useEffect, useMemo, useState } from 'react';
import { api, type Agent, type VisitRequest } from '../api';
import { V1, V1Pagination, V1_STYLES } from '../components/variant1';
import { extractAgentEmail } from '../../../shared/googleCalendarSyncService';
import FullscreenCalendar from '../components/ui/FullscreenCalendar';
import {
  AdminCalendarSyncConfirmModal,
  type PendingAdminCalendarSync,
} from '../components/GoogleWorkspaceTools';

const VALID_TRANSITIONS: Record<VisitRequest['status'], VisitRequest['status'][]> = {
  pending:   ['pending', 'confirmed', 'declined', 'cancelled'],
  confirmed: ['confirmed', 'completed', 'cancelled'],
  declined:  ['declined', 'pending'],
  completed: ['completed'],
  cancelled: ['cancelled', 'pending'],
};

const STATUS_BADGE: Record<VisitRequest['status'], { bg: string; color: string }> = {
  pending:   { bg: V1.slateSoft, color: '#475569' },
  confirmed: { bg: V1.greenSoft, color: '#0F7A3A' },
  declined:  { bg: V1.dangerSoft, color: V1.danger },
  completed: { bg: V1.blueSoft, color: V1.blueHover },
  cancelled: { bg: V1.slateSoft, color: V1.slate },
};

const VISIT_PAGE_SIZE = 10;

const S = {
  title:      { fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', color: V1.ink, fontVariantNumeric: 'tabular-nums' } as const,
  filterBar:  { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginBottom: '1.25rem', background: V1.surface, padding: '1rem 1.25rem', borderRadius: 8, border: `1px solid ${V1.border}` } as const,
  input:      { padding: '0.5rem 0.75rem', border: `1px solid ${V1.border}`, borderRadius: 6, fontSize: '0.86rem', minWidth: 180, color: V1.ink } as const,
  select:     { padding: '0.5rem 0.75rem', border: `1px solid ${V1.border}`, borderRadius: 6, fontSize: '0.86rem', background: V1.surface, color: V1.ink } as const,
  card:       { background: V1.surface, borderRadius: 8, padding: '1.25rem 1.5rem', border: `1px solid ${V1.border}`, marginBottom: '1rem' } as const,
  noteInput:  { width: '100%', padding: '0.55rem 0.75rem', border: `1px solid ${V1.border}`, borderRadius: 6, fontSize: '0.86rem', marginTop: '0.5rem', boxSizing: 'border-box' as const, color: V1.ink } as const,
  btn:        { padding: '0.45rem 1rem', background: V1.blue, color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const } as const,
  clearBtn:   { padding: '0.45rem 0.9rem', background: V1.canvas, color: V1.ink, border: `1px solid ${V1.border}`, borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const } as const,
};

export default function Visits() {
  const [items, setItems]               = useState<VisitRequest[]>([]);
  const [agents, setAgents]             = useState<Agent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter]     = useState<string>('');
  const [searchQuery, setSearchQuery]   = useState<string>('');
  const [draftNotes, setDraftNotes]     = useState<Record<number, string>>({});
  const [draftStatus, setDraftStatus]   = useState<Record<number, VisitRequest['status']>>({});
  const [draftAgentId, setDraftAgentId] = useState<Record<number, string>>({});
  const [syncFlag, setSyncFlag]         = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode]         = useState<'list' | 'calendar'>('list');
  const [page, setPage]                 = useState(1);
  const [pendingCalendarSync, setPendingCalendarSync] = useState<PendingAdminCalendarSync | null>(null);

  const load = () => {
    setError(null);
    return api.getVisitRequests()
      .then(list => {
        setItems(list);
        const notes: Record<number, string> = {};
        const statuses: Record<number, VisitRequest['status']> = {};
        for (const item of list) {
          notes[item.id] = item.staff_note ?? '';
          statuses[item.id] = item.status;
        }
        setDraftNotes(notes);
        setDraftStatus(statuses);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load visit requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.getAgents()
      .then(res => setAgents(Array.isArray(res) ? res : []))
      .catch(() => setAgents([]));
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (dateFilter) {
        const itemDate = item.requested_at.slice(0, 10);
        if (itemDate !== dateFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const match =
          item.listing_name.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [items, statusFilter, dateFilter, searchQuery]);

  const saveUpdate = async (item: VisitRequest) => {
    const nextStatus = draftStatus[item.id] ?? item.status;
    const nextNote   = draftNotes[item.id] ?? item.staff_note ?? '';
    setSaving(item.id);
    setError(null);
    try {
      await api.updateVisitRequest(item.id, nextStatus, nextNote);
      await load();
      const shouldSync = syncFlag[item.id] ?? (nextStatus === 'confirmed');
      if (shouldSync) {
        const reqDate = new Date(item.requested_at.endsWith('Z') ? item.requested_at : `${item.requested_at}Z`);
        const pickedAgent = agents.find(a => String(a.id) === draftAgentId[item.id]);
        setPendingCalendarSync({
          scheduleType: 'visit',
          customerName: item.name,
          customerPhone: item.phone,
          propertyOrProject: item.listing_name,
          serial: `VISIT-${item.id}`,
          scheduledAtIso: Number.isNaN(reqDate.getTime()) ? new Date().toISOString() : reqDate.toISOString(),
          notes: nextNote || `Visit Status: ${nextStatus}`,
          assignedAgentName: pickedAgent?.name || 'Assigned Agent',
          assignedAgentEmail: extractAgentEmail(pickedAgent),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update visit request');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h1 style={{ ...S.title, marginBottom: 0 }}>Visit Requests ({filteredItems.length} of {items.length})</h1>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={viewMode === 'list' ? S.btn : S.clearBtn}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            style={viewMode === 'calendar' ? S.btn : S.clearBtn}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Filters by status, date, and listing/customer */}
      <div style={S.filterBar}>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={S.select}
        >
          <option value="all">All Statuses</option>
          {(['pending', 'confirmed', 'declined', 'completed', 'cancelled'] as const).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <input
          type="date"
          aria-label="Filter by requested date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={S.input}
        />

        <input
          type="search"
          aria-label="Filter by listing, customer, or phone"
          placeholder="Search listing, name, or phone…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...S.input, flex: 1 }}
        />

        {(statusFilter !== 'all' || dateFilter || searchQuery) && (
          <button
            type="button"
            style={S.clearBtn}
            onClick={() => { setStatusFilter('all'); setDateFilter(''); setSearchQuery(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {calendarNotice && (
        <div
          role="status"
          style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
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
          <span>✓ {calendarNotice}</span>
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setCalendarNotice('')}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <FullscreenCalendar
          title="Visit Requests Schedule"
          events={filteredItems.map(item => ({
            id: item.id,
            date: item.requested_at.slice(0, 10),
            title: `${item.name} — ${item.listing_name}`,
            subtitle: `${item.phone} (${item.status})`,
            status: item.status,
          }))}
          onSelectEvent={ev => {
            setDateFilter(ev.date);
            setViewMode('list');
          }}
        />
      ) : filteredItems.length === 0 ? (
        <p style={{ color: V1.slate }}>No visit requests match the current filters.</p>
      ) : (
        <>
        {filteredItems.slice((page - 1) * VISIT_PAGE_SIZE, page * VISIT_PAGE_SIZE).map(item => {
          const allowedStatuses = VALID_TRANSITIONS[item.status] ?? [item.status];
          const currentDraftStatus = draftStatus[item.id] ?? item.status;
          const currentDraftNote = draftNotes[item.id] ?? item.staff_note ?? '';
          const currentSyncChecked = syncFlag[item.id] ?? (currentDraftStatus === 'confirmed');
          const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
          const reqDate = new Date(item.requested_at.endsWith('Z') ? item.requested_at : `${item.requested_at}Z`);

          return (
            <article key={item.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1.02rem', color: '#1E293B' }}>{item.name}</strong>
                    <span style={{ padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', background: badge.bg, color: badge.color }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0', color: '#818285', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {item.listing_name} · <a href={`tel:+${item.phone}`} style={{ color: '#0072BC', fontWeight: 600, textDecoration: 'underline' }}>+{item.phone}</a>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#818285', fontVariantNumeric: 'tabular-nums' }}>
                    Requested for (Kabul time): <strong style={{ color: '#1E293B' }}>{reqDate.toLocaleString('en-US', { timeZone: 'Asia/Kabul', dateStyle: 'medium', timeStyle: 'short' })}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {agents.length > 0 && (
                    <select
                      aria-label={`Assign agent for ${item.name}`}
                      value={draftAgentId[item.id] ?? ''}
                      onChange={e => setDraftAgentId(prev => ({ ...prev, [item.id]: e.target.value }))}
                      disabled={saving === item.id}
                      style={S.select}
                    >
                      <option value="">Assign Agent (Calendar)</option>
                      {agents.map(ag => (
                        <option key={ag.id} value={String(ag.id)}>{ag.name}</option>
                      ))}
                    </select>
                  )}
                  <select
                    aria-label={`Visit status for ${item.name}`}
                    value={currentDraftStatus}
                    onChange={e => {
                      const next = e.target.value as VisitRequest['status'];
                      setDraftStatus(prev => ({ ...prev, [item.id]: next }));
                      if (next === 'confirmed') {
                        setSyncFlag(prev => ({ ...prev, [item.id]: true }));
                      }
                    }}
                    disabled={saving === item.id}
                    style={S.select}
                  >
                    {allowedStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentSyncChecked}
                      onChange={e => setSyncFlag(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    />
                    Sync Calendar
                  </label>
                  <button
                    type="button"
                    onClick={() => saveUpdate(item)}
                    disabled={saving === item.id}
                    style={S.btn}
                  >
                    {saving === item.id ? 'Saving…' : 'Save Update'}
                  </button>
                </div>
              </div>

              {/* Staff Note Editor */}
              <div style={{ marginTop: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Staff Note
                  <input
                    type="text"
                    value={currentDraftNote}
                    onChange={e => setDraftNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Add confirmation details, agent assigned, or follow-up notes…"
                    style={S.noteInput}
                  />
                </label>
              </div>

              {/* Audit History */}
              <details style={{ marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                  History ({item.events?.length ?? 0} events)
                </summary>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {(item.events ?? []).map((event, index) => (
                    <p key={index} style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                      <strong>{event.previous_status ? `${event.previous_status} → ${event.next_status}` : event.next_status}</strong>
                      {' '}by <em>{event.actor}</em>
                      {' · '}{event.note || 'No note'}
                      {' · '}{new Date(event.created_at).toLocaleString()}
                    </p>
                  ))}
                </div>
              </details>
            </article>
          );
        })}
        <div style={{ ...V1_STYLES.card, overflow: 'hidden' }}>
          <V1Pagination page={page} pageSize={VISIT_PAGE_SIZE} total={filteredItems.length} onPageChange={setPage} />
        </div>
        </>
      )}

      {pendingCalendarSync && (
        <AdminCalendarSyncConfirmModal
          pending={pendingCalendarSync}
          agents={agents}
          onClose={() => setPendingCalendarSync(null)}
          onSynced={(msg) => setCalendarNotice(msg)}
        />
      )}
    </div>
  );
}

