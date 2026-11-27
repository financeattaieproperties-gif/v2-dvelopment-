import React, { useMemo, useState } from 'react';
import { readUpload } from './readUpload';
import type {
  MarketingProductionEntry,
  Role,
  StaffUser,
  SubmissionPost,
} from '../../../../packages/staff-contracts/types';

export interface MarketingWorkspaceProps {
  entries: MarketingProductionEntry[];
  submissions: SubmissionPost[];
  staffUsers: StaffUser[];
  actorRole: Role;
  onUpload: (dataUrl: string, fileName: string, purpose: string) => Promise<{url: string}>;
  onCreateEntry: (payload: {
    customerName: string;
    address: string;
    propertyType: 'Villa' | 'Block' | 'Building' | 'Apartment';
  }) => Promise<unknown>;
  onAdvanceEntry: (
    entryId: number,
    action:
      | 'schedule_filming'
      | 'complete_filming'
      | 'schedule_editing'
      | 'ready_for_post'
      | 'mark_posted',
    payload: Record<string, unknown>
  ) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
  t?: (s: string) => string;
}

const STAGE_LABELS: Record<MarketingProductionEntry['stage'], string> = {
  submitted: 'Submitted',
  filming_scheduled: 'Filming Scheduled',
  filming_completed: 'Filming Completed',
  editing_scheduled: 'Editing Scheduled',
  ready_for_post: 'Ready for Post',
  posted: 'Posted & Synced',
};

function getStageBadgeStyle(stage: MarketingProductionEntry['stage']): React.CSSProperties {
  if (stage === 'posted') {
    return {
      background: '#E8F7EE',
      color: '#14A850',
      border: '1px solid #BBF7D0',
    };
  }
  if (stage === 'submitted') {
    return {
      background: '#F1F5F9',
      color: '#818285',
      border: '1px solid #E2E8F0',
    };
  }
  return {
    background: '#E6F2FA',
    color: '#0072BC',
    border: '1px solid #BAE6FD',
  };
}

function getPublishBadgeStyle(status: SubmissionPost['publishStatus']): React.CSSProperties {
  if (status === 'Published' || status === 'Approved') {
    return {
      background: '#E8F7EE',
      color: '#14A850',
      border: '1px solid #BBF7D0',
    };
  }
  if (status === 'Rejected') {
    return {
      background: '#FEF2F2',
      color: '#B91C1C',
      border: '1px solid #FECACA',
    };
  }
  return {
    background: '#E6F2FA',
    color: '#0072BC',
    border: '1px solid #BAE6FD',
  };
}

function MiniSparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points
    .map((val, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * 76 + 2;
      const y = 24 - ((val - min) / range) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width="80" height="28" viewBox="0 0 80 28" aria-hidden="true">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export function MarketingWorkspace({
  entries,
  submissions,
  staffUsers,
  actorRole,
  onUpload,
  onCreateEntry,
  onAdvanceEntry,
  onNotice,
  onError,
  t = (s: string) => s,
}: MarketingWorkspaceProps) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<
    'Villa' | 'Block' | 'Building' | 'Apartment'
  >('Villa');
  const [stageFilter, setStageFilter] = useState<'all' | MarketingProductionEntry['stage']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor "Mark Posted" drawer state
  const [postingEntryId, setPostingEntryId] = useState<number | null>(null);
  const [postSerial, setPostSerial] = useState('');
  const [postNote, setPostNote] = useState('');
  const [postPlatform, setPostPlatform] = useState<
    'Facebook' | 'YouTube' | 'Instagram'
  >('Instagram');
  const [postPhotos, setPostPhotos] = useState<string[]>([]);

  // Manager / Marketing Manager "Schedule Filming" inline state per entry
  const [filmingDrafts, setFilmingDrafts] = useState<
    Record<number, { filmingDate: string; videographerId: number }>
  >({});

  const videographers = staffUsers.filter(
    (u) => u.role === 'videographer'
  );

  const canScheduleFilming = [
    'marketing_manager',
    'manager',
  ].includes(actorRole);
  const canCompleteFilming = [
    'videographer',
    'marketing_manager',
  ].includes(actorRole);
  const isEditor = actorRole === 'editor';

  // KPI metrics
  const submittedCount = entries.filter((e) => e.stage === 'submitted').length;
  const filmingScheduledCount = entries.filter((e) => e.stage === 'filming_scheduled').length;
  const editingScheduledCount = entries.filter((e) => e.stage === 'editing_scheduled').length;
  const postedCount = entries.filter((e) => e.stage === 'posted').length;

  // Channel Donut distribution from posted entries + submissions
  const channelStats = useMemo(() => {
    const counts = { Instagram: 0, YouTube: 0, Facebook: 0 };
    entries.forEach((e) => {
      if (e.platform) counts[e.platform] += 1;
    });
    if (counts.Instagram + counts.YouTube + counts.Facebook === 0) {
      submissions.forEach((s) => {
        if (s.socialPlatform) counts[s.socialPlatform] += 1;
      });
    }
    const total = counts.Instagram + counts.YouTube + counts.Facebook;
    return {
      total,
      segments: [
        { name: 'Instagram', count: counts.Instagram, color: '#0072BC' },
        { name: 'YouTube', count: counts.YouTube, color: '#14A850' },
        { name: 'Facebook', count: counts.Facebook, color: '#818285' },
      ],
    };
  }, [entries, submissions]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (stageFilter !== 'all' && entry.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        entry.customerName.toLowerCase().includes(q) ||
        entry.address.toLowerCase().includes(q) ||
        entry.propertyType.toLowerCase().includes(q) ||
        (entry.serialNumber || '').toLowerCase().includes(q)
      );
    });
  }, [entries, stageFilter, searchQuery]);

  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateEntry({ customerName, address, propertyType });
      setCustomerName('');
      setAddress('');
      onNotice(t('Property submitted to Marketing & Production queue.'));
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const handleCompletePosted = async (entryId: number) => {
    try {
      await onAdvanceEntry(entryId, 'mark_posted', {
        version: entries.find(e => e.id === entryId)?.version,
        serialNumber: postSerial,
        propertyInfoNote: postNote,
        photos: postPhotos,
        platform: postPlatform,
      });
      setPostingEntryId(null);
      onNotice(
        `Entry marked Posted (${postSerial}) and queued as 'Submitted' in the isolated Submission Database for Admin publishing.`
      );
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let cumulativeFraction = 0;

  const kpiCards = [
    {
      label: t('Submitted'),
      value: submittedCount,
      delta: `${entries.length} ${t('total')}`,
      deltaBg: '#F1F5F9',
      deltaColor: '#818285',
      sparkColor: '#818285',
      points: [1, 2, 1, 3, Math.max(submittedCount, 1)],
    },
    {
      label: t('Filming Scheduled'),
      value: filmingScheduledCount,
      delta: `${entries.filter((e) => e.stage === 'filming_completed').length} ${t('filmed')}`,
      deltaBg: '#E6F2FA',
      deltaColor: '#0072BC',
      sparkColor: '#0072BC',
      points: [1, 2, 3, 2, Math.max(filmingScheduledCount, 1)],
    },
    {
      label: t('Editing Scheduled'),
      value: editingScheduledCount,
      delta: `${entries.filter((e) => e.stage === 'ready_for_post').length} ${t('ready')}`,
      deltaBg: '#E6F2FA',
      deltaColor: '#0072BC',
      sparkColor: '#0072BC',
      points: [0, 1, 2, 2, Math.max(editingScheduledCount, 1)],
    },
    {
      label: t('Posted & Synced'),
      value: postedCount,
      delta: `${submissions.length} ${t('in DB')}`,
      deltaBg: '#E8F7EE',
      deltaColor: '#14A850',
      sparkColor: '#14A850',
      points: [1, 2, 3, 4, Math.max(postedCount, 1)],
    },
  ];

  return (
    <section
      className="panel"
      data-testid="marketing-workspace"
      style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 20,
        color: '#1E293B',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {/* Header */}
      <div
        className="panel-heading"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          paddingBottom: 16,
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div>
          <p
            className="eyebrow"
            style={{ color: '#818285', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            {t('Marketing & Media Production Department')}
          </p>
          <h2 style={{ color: '#1E293B', fontSize: 20, fontWeight: 600, marginTop: 4 }}>
            {t('Filming, Editing & Social Post Production Pipeline')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#E6F2FA',
              color: '#0072BC',
              border: '1px solid #BAE6FD',
              borderRadius: 999,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t('Active Production')}: {entries.filter((e) => e.stage !== 'posted').length}
          </span>
          <span
            style={{
              background: '#E8F7EE',
              color: '#14A850',
              border: '1px solid #BBF7D0',
              borderRadius: 999,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t('Posted & Sent to Submissions DB')}: {postedCount}
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>
                {kpi.label}
              </span>
              <span
                style={{
                  background: kpi.deltaBg,
                  color: kpi.deltaColor,
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {kpi.delta}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <strong style={{ fontSize: 28, lineHeight: 1, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>
                {kpi.value}
              </strong>
              <MiniSparkline points={kpi.points} stroke={kpi.sparkColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Top Split: Submit Property Form + Channel Donut Chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
          gap: 16,
          marginTop: 16,
          alignItems: 'stretch',
        }}
      >
        <form
          onSubmit={handleSubmitProperty}
          data-testid="marketing-submit-property-form"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
              {t('Submit Property for Filming & Media Production')}
            </h3>
            <div className="form-grid">
              <div className="field">
                <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Customer / Owner Name')}</label>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Haji Mirwais"
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#FFFFFF', color: '#1E293B' }}
                />
              </div>
              <div className="field">
                <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Property Address')}</label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street 10, Wazir Akbar Khan, Kabul"
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#FFFFFF', color: '#1E293B' }}
                />
              </div>
              <div className="field">
                <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Property Type')}</label>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(
                      e.target.value as 'Villa' | 'Block' | 'Building' | 'Apartment'
                    )
                  }
                  style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#FFFFFF', color: '#1E293B' }}
                >
                  <option value="Villa">{t('Villa')}</option>
                  <option value="Block">{t('Block')}</option>
                  <option value="Building">{t('Building')}</option>
                  <option value="Apartment">{t('Apartment')}</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 14 }}>
            <button
              type="submit"
              className="button"
              data-testid="submit-marketing-property-btn"
              style={{
                background: '#0072BC',
                color: '#FFFFFF',
                border: '1px solid #0072BC',
                borderRadius: 8,
                padding: '9px 16px',
                fontWeight: 600,
              }}
            >
              {t('Submit Property to Marketing Queue')}
            </button>
          </div>
        </form>

        {/* Channel Donut Chart */}
        <div
          data-testid="marketing-channel-donut"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('Channel Distribution')}
              </p>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>
                {t('Published Social Mix')}
              </h3>
            </div>
            <span
              style={{
                background: '#F1F5F9',
                color: '#818285',
                borderRadius: 999,
                padding: '3px 9px',
                fontSize: 11,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {channelStats.total} {t('posts')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Channel Donut Chart">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="14"
              />
              {channelStats.total > 0 &&
                channelStats.segments.map((seg) => {
                  const fraction = seg.count / channelStats.total;
                  const dashLength = fraction * circumference;
                  const dashOffset = -cumulativeFraction * circumference;
                  cumulativeFraction += fraction;
                  if (seg.count === 0) return null;
                  return (
                    <circle
                      key={seg.name}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={`${dashLength} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 60 60)"
                    />
                  );
                })}
              <text
                x="60"
                y="56"
                textAnchor="middle"
                fill="#1E293B"
                fontSize="20"
                fontWeight="700"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {channelStats.total}
              </text>
              <text
                x="60"
                y="72"
                textAnchor="middle"
                fill="#818285"
                fontSize="10"
                fontWeight="600"
              >
                {t('CHANNELS')}
              </text>
            </svg>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {channelStats.segments.map((seg) => {
                const pct = channelStats.total > 0 ? Math.round((seg.count / channelStats.total) * 100) : 0;
                return (
                  <div
                    key={seg.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      paddingBottom: 6,
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1E293B', fontWeight: 500 }}>
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: seg.color,
                          display: 'inline-block',
                        }}
                      />
                      {seg.name}
                    </span>
                    <span style={{ color: '#818285', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {seg.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Production Pipeline Table */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          marginTop: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                ['all', t('All')],
                ['submitted', t('Submitted')],
                ['filming_scheduled', t('Filming')],
                ['editing_scheduled', t('Editing')],
                ['ready_for_post', t('Ready')],
                ['posted', t('Posted')],
              ] as const
            ).map(([key, label]) => {
              const active = stageFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStageFilter(key)}
                  style={{
                    background: active ? '#E6F2FA' : '#FFFFFF',
                    color: active ? '#0072BC' : '#818285',
                    border: active ? '1px solid #0072BC' : '1px solid #E2E8F0',
                    borderRadius: 999,
                    padding: '4px 11px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search owner, address, or serial...')}
            aria-label="Search marketing pipeline"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              minWidth: 220,
              color: '#1E293B',
              background: '#F8FAFC',
            }}
          />
        </div>

        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Property & Owner')}</th>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Type')}</th>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Filming Schedule')}</th>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Editing & Content Type')}</th>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Post Serial & Platform')}</th>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Stage')}</th>
                <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Role Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px 14px', color: '#818285', fontSize: 13, textAlign: 'center' }}>
                    {t('No marketing production entries match the current filter.')}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    data-testid={`marketing-row-${entry.id}`}
                    style={{ borderBottom: '1px solid #E2E8F0' }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: '#1E293B', display: 'block' }}>{entry.customerName}</strong>
                      <small style={{ color: '#818285' }}>{entry.address}</small>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1E293B' }}>{entry.propertyType}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {entry.filmingDate ? (
                        <>
                          <strong style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{entry.filmingDate}</strong>
                          <small style={{ color: '#818285' }}>{t('Videographer')}: {entry.videographerName || 'Jawad Noori'}</small>
                        </>
                      ) : (
                        <small style={{ color: '#818285' }}>{t('Unscheduled')}</small>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {entry.editingDeadlineAt ? (
                        <>
                          <strong style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{t('Due')}: {entry.editingDeadlineAt}</strong>
                          <small style={{ color: '#818285' }}>{entry.contentType || t('Editing in progress')}</small>
                        </>
                      ) : (
                        <small style={{ color: '#818285' }}>{t('Awaiting filming')}</small>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {entry.serialNumber ? (
                        <>
                          <strong style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{entry.serialNumber}</strong>
                          <small style={{ color: '#818285' }}>{entry.platform} ({entry.photos.length} {t('photos')})</small>
                        </>
                      ) : (
                        <small style={{ color: '#818285' }}>{t('Not posted yet')}</small>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        className={`badge ${entry.stage}`}
                        style={{
                          ...getStageBadgeStyle(entry.stage),
                          borderRadius: 999,
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          display: 'inline-block',
                        }}
                      >
                        {t(STAGE_LABELS[entry.stage] || entry.stage)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {entry.stage === 'submitted' && canScheduleFilming && (() => {
                        const defaultVideographerId = videographers[0]?.id || 0;
                        const draft = filmingDrafts[entry.id] || {
                          filmingDate: new Date().toISOString().slice(0, 10),
                          videographerId: defaultVideographerId,
                        };
                        return (
                          <div
                            data-testid={`schedule-filming-controls-${entry.id}`}
                            style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 190 }}
                          >
                            <input
                              type="date"
                              aria-label={`Filming date for ${entry.customerName}`}
                              value={draft.filmingDate}
                              onChange={(e) =>
                                setFilmingDrafts((prev) => ({
                                   ...prev,
                                  [entry.id]: { ...draft, filmingDate: e.target.value },
                                }))
                              }
                              style={{
                                border: '1px solid #E2E8F0',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 12,
                                color: '#1E293B',
                                background: '#FFFFFF',
                              }}
                            />
                            <select
                              aria-label={`Videographer for ${entry.customerName}`}
                              value={draft.videographerId}
                              onChange={(e) =>
                                setFilmingDrafts((prev) => ({
                                  ...prev,
                                  [entry.id]: { ...draft, videographerId: Number(e.target.value) },
                                }))
                              }
                              style={{
                                border: '1px solid #E2E8F0',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 12,
                                color: '#1E293B',
                                background: '#FFFFFF',
                              }}
                            >
                              {videographers.length === 0 ? (
                                <option value={0}>{t('Select Videographer')}</option>
                              ) : (
                                videographers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))
                              )}
                            </select>
                            <button
                              type="button"
                              className="button secondary"
                              style={{ border: '1px solid #0072BC', background: '#E6F2FA', color: '#0072BC', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                              onClick={async () => {
                                try {
                                  const filmingDate =
                                    draft.filmingDate ||
                                    (typeof window !== 'undefined' && typeof window.prompt === 'function'
                                      ? window.prompt('Filming date (YYYY-MM-DD)') || ''
                                      : '');
                                  const videographerId =
                                    draft.videographerId ||
                                    Number(
                                      typeof window !== 'undefined' && typeof window.prompt === 'function'
                                        ? window.prompt(
                                            'Videographer staff ID: ' +
                                              videographers.map((u) => `${u.id}: ${u.name}`).join(', ')
                                          ) || 0
                                        : 0
                                    );
                                  await onAdvanceEntry(entry.id, 'schedule_filming', {
                                    version: entry.version,
                                    filmingDate,
                                    videographerId,
                                  });
                                  onNotice(`Scheduled filming for ${entry.customerName}.`);
                                } catch (err) {
                                  onError((err as Error).message);
                                }
                              }}
                            >
                              {t('Schedule Filming')}
                            </button>
                          </div>
                        );
                      })()}
                      {entry.stage === 'submitted' && !canScheduleFilming && (
                        <small style={{ color: '#818285' }}>{t('Awaiting Manager filming schedule')}</small>
                      )}
                      {entry.stage === 'filming_scheduled' && canCompleteFilming && (
                        <button
                          type="button"
                          className="button secondary"
                          style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#1E293B', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                          onClick={async () => {
                            try {
                              await onAdvanceEntry(entry.id, 'complete_filming', {version: entry.version});
                              onNotice(`Filming completed for ${entry.customerName}; sent to Editor queue.`);
                            } catch (err) {
                              onError((err as Error).message);
                            }
                          }}
                        >
                          {t('Mark Filming Completed')}
                        </button>
                      )}
                      {entry.stage === 'filming_completed' && isEditor && (
                        <button
                          type="button"
                          className="button secondary"
                          style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#1E293B', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                          onClick={async () => {
                            try {
                              await onAdvanceEntry(entry.id, 'schedule_editing', {
                                version: entry.version,
                                editingDeadlineAt: window.prompt('Editing deadline (YYYY-MM-DD)') || '',
                              });
                              onNotice('Editing deadline set.');
                            } catch (err) {
                              onError((err as Error).message);
                            }
                          }}
                        >
                          {t('Set Editing Date')}
                        </button>
                      )}
                      {entry.stage === 'editing_scheduled' && isEditor && (
                        <button
                          type="button"
                          className="button secondary"
                          style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#1E293B', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                          onClick={async () => {
                            try {
                              await onAdvanceEntry(entry.id, 'ready_for_post', {
                                version: entry.version,
                                contentType: window.prompt('Content type (for example Reel or Ad Video)') || '',
                              });
                              onNotice('Marked Ready for Post.');
                            } catch (err) {
                              onError((err as Error).message);
                            }
                          }}
                        >
                          {t('Mark Ready for Post')}
                        </button>
                      )}
                      {entry.stage === 'ready_for_post' && isEditor && (
                        <button
                          type="button"
                          className="button"
                          data-testid={`open-mark-posted-btn-${entry.id}`}
                          style={{ background: '#0072BC', color: '#FFFFFF', border: '1px solid #0072BC', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                          onClick={() => { setPostingEntryId(entry.id); setPostSerial(''); setPostNote(''); setPostPhotos([]); }}
                        >
                          {t('Complete & Mark Posted')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Complete & Mark Posted Right-Side Drawer (Requires AP - 1765 Serial, Note, 5 Photos, Platform) */}
      {postingEntryId !== null && isEditor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.25)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 50,
          }}
        >
          <aside
            data-testid="editor-mark-posted-panel"
            style={{
              width: 'min(520px, 100vw)',
              height: '100%',
              background: '#FFFFFF',
              borderLeft: '1px solid #E2E8F0',
              padding: 20,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <p style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('Social Sync Drawer')} • {t('Entry')} #{postingEntryId}
                  </p>
                  <h3 style={{ marginTop: 4, fontSize: 17, fontWeight: 600, color: '#1E293B' }}>
                    {t('Complete & Mark Posted')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPostingEntryId(null)}
                  style={{
                    background: '#F1F5F9',
                    color: '#818285',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {t('Close')}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                <div className="field">
                  <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Post Serial Number (Format: AP - 1765)')}</label>
                  <input
                    value={postSerial}
                    onChange={(e) => setPostSerial(e.target.value)}
                    placeholder="AP - 1766"
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', color: '#1E293B' }}
                  />
                </div>

                <div className="field">
                  <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Social Platform')}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {(['Facebook', 'YouTube', 'Instagram'] as const).map((plat) => {
                      const active = postPlatform === plat;
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setPostPlatform(plat)}
                          style={{
                            background: active ? '#E6F2FA' : '#FFFFFF',
                            color: active ? '#0072BC' : '#818285',
                            border: active ? '1px solid #0072BC' : '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '8px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {plat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="field">
                  <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Property Information Note (Pasted for Admin Website Publishing)')}</label>
                  <textarea
                    rows={3}
                    value={postNote}
                    onChange={(e) => setPostNote(e.target.value)}
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', color: '#1E293B' }}
                  />
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Five Property Photos (Exactly 5 Required)')}</label>
                    <small style={{ color: postPhotos.length === 5 ? '#14A850' : '#818285', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {postPhotos.length} / 5 {t('photos uploaded')}
                    </small>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    aria-label="Five property photos"
                    onChange={async e => {
                      const files = Array.from(e.target.files || []);
                      setPostPhotos([]);
                      if (files.length !== 5) { onError('Select exactly five property photos.'); return; }
                      try { const urls = []; for (const file of files) { const uploaded = await onUpload(await readUpload(file), file.name, 'marketing_photo'); urls.push(uploaded.url); } setPostPhotos(urls); }
                      catch (error) { onError((error as Error).message); }
                    }}
                    style={{ marginTop: 4 }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {[0, 1, 2, 3, 4].map((slot) => {
                      const url = postPhotos[slot];
                      return (
                        <div
                          key={slot}
                          style={{
                            aspectRatio: '1 / 1',
                            borderRadius: 8,
                            border: url ? '1px solid #14A850' : '1px dashed #E2E8F0',
                            background: url ? '#E8F7EE' : '#F8FAFC',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            color: '#818285',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {url ? (
                            <img
                              src={url}
                              alt={`Property upload ${slot + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            `#${slot + 1}`
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal-actions"
              style={{
                paddingTop: 14,
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="button secondary"
                onClick={() => setPostingEntryId(null)}
                style={{
                  background: '#FFFFFF',
                  color: '#818285',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontWeight: 600,
                }}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="button"
                disabled={postPhotos.length !== 5 || !postSerial.trim() || !postNote.trim()}
                data-testid="confirm-mark-posted-btn"
                onClick={() => handleCompletePosted(postingEntryId)}
                style={{
                  background: '#0072BC',
                  color: '#FFFFFF',
                  border: '1px solid #0072BC',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontWeight: 600,
                }}
              >
                {t('Mark Posted & Submit 5 Photos to Submission DB')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Read-Only Submission DB Status Preview inside Marketing */}
      <div style={{ marginTop: 20 }}>
        <SubmissionsStatusView submissions={submissions} t={t} />
      </div>
    </section>
  );
}

export function SubmissionsStatusView({
  submissions,
  t = (s: string) => s,
}: {
  submissions: SubmissionPost[];
  t?: (s: string) => string;
}) {
  return (
    <section
      className="panel"
      data-testid="submissions-status-view"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        className="panel-heading"
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <p className="eyebrow" style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('Isolated Third Database (Submission DB — Read-Only for Internal Staff)')}
          </p>
          <h2 style={{ color: '#1E293B', fontSize: 16, fontWeight: 600, marginTop: 2 }}>
            {t('Website Publishing Submissions Status')}
          </h2>
        </div>
        <span
          style={{
            background: '#E6F2FA',
            color: '#0072BC',
            border: '1px solid #BAE6FD',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {submissions.length} {t('Submissions')}
        </span>
      </div>
      <div className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Post Serial')}</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Customer & Address')}</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Type & Platform')}</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Property Info Note')}</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Photos')}</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Publish Status')}</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr
                key={sub.id}
                data-testid={`submission-row-${sub.serialNumber}`}
                style={{ borderBottom: '1px solid #E2E8F0' }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <strong style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{sub.serialNumber}</strong>
                  <small style={{ color: '#818285' }}>{t('By')} {sub.submittedBy}</small>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <strong style={{ color: '#1E293B' }}>{sub.customerName}</strong>
                  <small style={{ color: '#818285' }}>{sub.address}</small>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <strong style={{ color: '#1E293B' }}>{sub.propertyType}</strong>
                  <small style={{ color: '#818285' }}>{sub.socialPlatform}</small>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <small style={{ color: '#818285' }}>{sub.propertyInfoNote}</small>
                </td>
                <td style={{ padding: '12px 14px', color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{sub.photos.length} {t('Photos')}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span
                    className={`badge ${sub.publishStatus}`}
                    style={{
                      ...getPublishBadgeStyle(sub.publishStatus),
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'inline-block',
                    }}
                  >
                    {t(sub.publishStatus)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
