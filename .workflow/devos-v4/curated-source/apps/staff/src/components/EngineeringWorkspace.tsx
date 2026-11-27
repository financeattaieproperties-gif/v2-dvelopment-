import React, { useMemo, useState } from 'react';
import { readUpload } from './readUpload';
import type {
  EngineeringDeliverable,
  EngineeringDeliverableVersion,
  InventoryProject,
  Role,
} from '../../../../packages/staff-contracts/types';
import { isManagerRole } from '../../../../packages/staff-contracts/workflow.mjs';

export interface EngineeringWorkspaceProps {
  deliverables: EngineeringDeliverable[];
  projects?: InventoryProject[];
  actorRole: Role;
  onUpload: (dataUrl: string, fileName: string, purpose: string) => Promise<{url: string}>;
  onUploadVersion: (
    deliverableId: number,
    payload: { fileUrl: string; fileName: string; format: string; notes: string; version: number }
  ) => Promise<unknown>;
  onReviewVersion: (
    deliverableId: number,
    payload: {
      version: number;
      versionNumber: number;
      decision: 'approved' | 'revision_requested';
      comment: string;
    }
  ) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
  t?: (s: string) => string;
}

type DeliverableFilterStatus = 'all' | 'submitted' | 'approved' | 'revision_requested' | 'awaiting_v1';

function getLatestVersion(deliv: EngineeringDeliverable): EngineeringDeliverableVersion | null {
  if (deliv.versions.length === 0) return null;
  return deliv.versions[deliv.versions.length - 1];
}

function getVersionBadgeStyle(status: EngineeringDeliverableVersion['status'] | 'awaiting_v1'): React.CSSProperties {
  if (status === 'approved') {
    return {
      background: '#E8F7EE',
      color: '#14A850',
      border: '1px solid #BBF7D0',
    };
  }
  if (status === 'revision_requested') {
    return {
      background: '#FEF2F2',
      color: '#B91C1C',
      border: '1px solid #FECACA',
    };
  }
  if (status === 'submitted') {
    return {
      background: '#E6F2FA',
      color: '#0072BC',
      border: '1px solid #BAE6FD',
    };
  }
  return {
    background: '#F1F5F9',
    color: '#818285',
    border: '1px solid #E2E8F0',
  };
}

function formatStatusLabel(
  status: EngineeringDeliverableVersion['status'] | 'awaiting_v1',
  t: (s: string) => string = (s) => s
): string {
  if (status === 'approved') return t('Approved');
  if (status === 'revision_requested') return t('Revision Requested');
  if (status === 'submitted') return t('Pending CEO Review');
  return t('Awaiting v1');
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

export function EngineeringWorkspace({
  deliverables,
  projects = [],
  actorRole,
  onUpload,
  onUploadVersion,
  onReviewVersion,
  onNotice,
  onError,
  t = (s: string) => s,
}: EngineeringWorkspaceProps) {
  const canReview = isManagerRole(actorRole);
  const canUpload = [
    'architect',
    'graphic_designer',
    'visual_designer_3d',
  ].includes(actorRole);

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [format, setFormat] = useState('2D Floor Plan (CAD/PDF)');
  const [notes, setNotes] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<DeliverableFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleDeliverables = useMemo(
    () =>
      canReview
        ? deliverables
        : deliverables.filter((d) => d.role === actorRole || !canUpload),
    [canReview, canUpload, deliverables, actorRole]
  );

  // KPI counts
  const assignedCount = visibleDeliverables.length;
  const pendingReviewCount = visibleDeliverables.filter(
    (d) => getLatestVersion(d)?.status === 'submitted'
  ).length;
  const approvedCount = visibleDeliverables.filter(
    (d) => getLatestVersion(d)?.status === 'approved'
  ).length;
  const revisionCount = visibleDeliverables.filter(
    (d) => getLatestVersion(d)?.status === 'revision_requested'
  ).length;

  const filteredDeliverables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleDeliverables.filter((deliv) => {
      const latest = getLatestVersion(deliv);
      const latestStatus: DeliverableFilterStatus = latest ? latest.status : 'awaiting_v1';
      if (statusFilter !== 'all' && latestStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        deliv.title.toLowerCase().includes(q) ||
        deliv.projectCode.toLowerCase().includes(q) ||
        deliv.projectName.toLowerCase().includes(q) ||
        deliv.assigneeName.toLowerCase().includes(q) ||
        (deliv.apartmentNumber || '').toLowerCase().includes(q)
      );
    });
  }, [visibleDeliverables, statusFilter, searchQuery]);

  const activeDeliverable = useMemo(() => {
    if (selectedDeliverableId !== null) {
      const found = visibleDeliverables.find((d) => d.id === selectedDeliverableId);
      if (found) return found;
    }
    return filteredDeliverables[0] || visibleDeliverables[0] || null;
  }, [selectedDeliverableId, visibleDeliverables, filteredDeliverables]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingId === null) return;
    try {
      if (!fileUrl || uploadingFile) throw new Error(t('Choose a file'));
      await onUploadVersion(uploadingId, {
        fileUrl,
        fileName,
        format,
        notes,
        version: deliverables.find((d) => d.id === uploadingId)!.version,
      });
      setUploadingId(null);
      onNotice(`Uploaded new deliverable version (${fileName}) to version history.`);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const kpiCards = [
    {
      label: t('Assigned'),
      value: assignedCount,
      delta: `${projects.length || visibleDeliverables.length} ${t('linked')}`,
      deltaBg: '#F1F5F9',
      deltaColor: '#818285',
      sparkColor: '#818285',
      points: [1, 2, 2, 3, Math.max(assignedCount, 1)],
    },
    {
      label: t('Pending CEO Review'),
      value: pendingReviewCount,
      delta: t('In queue'),
      deltaBg: '#E6F2FA',
      deltaColor: '#0072BC',
      sparkColor: '#0072BC',
      points: [1, 3, 2, 2, Math.max(pendingReviewCount, 1)],
    },
    {
      label: t('Approved'),
      value: approvedCount,
      delta: assignedCount > 0 ? `${Math.round((approvedCount / assignedCount) * 100)}% ${t('rate')}` : `0% ${t('rate')}`,
      deltaBg: '#E8F7EE',
      deltaColor: '#14A850',
      sparkColor: '#14A850',
      points: [0, 1, 2, 3, Math.max(approvedCount, 1)],
    },
    {
      label: t('Revision Requested'),
      value: revisionCount,
      delta: revisionCount > 0 ? t('Action needed') : t('Clear'),
      deltaBg: revisionCount > 0 ? '#FEF2F2' : '#E8F7EE',
      deltaColor: revisionCount > 0 ? '#B91C1C' : '#14A850',
      sparkColor: revisionCount > 0 ? '#B91C1C' : '#14A850',
      points: [1, 1, 0, 1, revisionCount],
    },
  ];

  return (
    <section
      className="panel"
      data-testid="engineering-workspace"
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
            {t('Engineering & Graphic Department')} • {canReview ? t('Manager Deliverable Review') : `Role: ${actorRole.replace(/_/g, ' ')}`}
          </p>
          <h2 style={{ color: '#1E293B', fontSize: 20, fontWeight: 600, marginTop: 4 }}>
            {t('Project-Linked Tasks & Versioned Deliverables')}
          </h2>
        </div>
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
          {visibleDeliverables.length} {t('Deliverable Packages')}
        </span>
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

      {/* Upload New Deliverable Version Form */}
      {uploadingId !== null && canUpload && (
        <form
          style={{
            marginTop: 16,
            background: '#FFFFFF',
            border: '1px solid #0072BC',
            borderRadius: 10,
            padding: 16,
          }}
          onSubmit={handleUploadSubmit}
          data-testid="engineering-upload-version-form"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
              {t('Upload New Deliverable Version (Preserves All Prior Versions)')}
            </h3>
            <span style={{ color: '#0072BC', fontSize: 12, fontWeight: 600 }}>
              {t('Package')} #{uploadingId}
            </span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Deliverable File Name')}</label>
              <input
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
              />
            </div>
            <div className="field">
              <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Deliverable Format / Asset Type')}</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
              >
                <option value="2D Floor Plan (CAD/PDF)">{t('2D Floor Plan (CAD/PDF)')}</option>
                <option value="Brochure / Print Asset">{t('Brochure / Print Asset')}</option>
                <option value="3D Exterior / Interior Render">{t('3D Exterior / Interior Render')}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="engineering-file" style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Deliverable file')}</label>
              <input id="engineering-file" type="file" required disabled={uploadingFile} onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return;
                setUploadingFile(true); setFileUrl('');
                try { const result = await onUpload(await readUpload(file), file.name, 'engineering_deliverable'); setFileUrl(result.url); setFileName(file.name); }
                catch (error) { onError((error as Error).message); }
                finally { setUploadingFile(false); }
              }} />
              <small style={{ color: fileUrl ? '#14A850' : '#818285', fontWeight: 600 }}>
                {uploadingFile ? t('Uploading...') : fileUrl ? t('File ready') : t('Choose a file')}
              </small>
            </div>
            <div className="field">
              <label style={{ color: '#818285', fontSize: 12, fontWeight: 600 }}>{t('Revision & Technical Notes')}</label>
              <input
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setUploadingId(null)}
              style={{ background: '#FFFFFF', color: '#818285', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', fontWeight: 600 }}
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              className="button"
              data-testid="submit-deliverable-version-btn"
              style={{ background: '#0072BC', color: '#FFFFFF', border: '1px solid #0072BC', borderRadius: 8, padding: '8px 16px', fontWeight: 600 }}
            >
              {t('Submit Version to Manager Review')}
            </button>
          </div>
        </form>
      )}

      {/* Split View: Hairline Deliverables Table (Left) + Version History Drawer (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 1fr)',
          gap: 16,
          marginTop: 16,
          alignItems: 'start',
        }}
      >
        {/* Left: Hairline Deliverables Table */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
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
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(
                [
                  ['all', t('All')],
                  ['submitted', t('Pending Review')],
                  ['approved', t('Approved')],
                  ['revision_requested', t('Revision')],
                  ['awaiting_v1', t('Awaiting v1')],
                ] as const
              ).map(([key, label]) => {
                const active = statusFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    style={{
                      background: active ? '#E6F2FA' : '#FFFFFF',
                      color: active ? '#0072BC' : '#818285',
                      border: active ? '1px solid #0072BC' : '1px solid #E2E8F0',
                      borderRadius: 999,
                      padding: '4px 10px',
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
              placeholder={t('Filter deliverables...')}
              aria-label="Filter engineering deliverables"
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                minWidth: 180,
                background: '#F8FAFC',
                color: '#1E293B',
              }}
            />
          </div>

          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Project & Unit')}</th>
                  <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Deliverable')}</th>
                  <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Assignee')}</th>
                  <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Latest')}</th>
                  <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'start' }}>{t('Status')}</th>
                  <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'end' }}>{t('Action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliverables.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 14px', color: '#818285', fontSize: 13, textAlign: 'center' }}>
                      {t('No deliverables match the current filter.')}
                    </td>
                  </tr>
                ) : (
                  filteredDeliverables.map((deliv) => {
                    const latest = getLatestVersion(deliv);
                    const latestStatus = latest ? latest.status : 'awaiting_v1';
                    const isSelected = activeDeliverable?.id === deliv.id;
                    return (
                      <tr
                        key={deliv.id}
                        data-testid={`deliverable-card-${deliv.id}`}
                        onClick={() => setSelectedDeliverableId(deliv.id)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #E2E8F0',
                          background: isSelected ? '#E6F2FA' : '#FFFFFF',
                          boxShadow: isSelected ? 'inset 3px 0 0 #0072BC' : undefined,
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#1E293B', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                            {deliv.projectCode} {deliv.apartmentNumber ? `• ${deliv.apartmentNumber}` : ''}
                          </strong>
                          <small style={{ color: '#818285' }}>{deliv.projectName}</small>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#1E293B' }}>{deliv.title}</strong>
                          <small style={{ color: '#818285' }}>{deliv.category.replace(/_/g, ' ')}</small>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#1E293B' }}>{deliv.assigneeName}</strong>
                          <small style={{ color: '#818285' }}>{deliv.role.replace(/_/g, ' ')}</small>
                        </td>
                        <td style={{ padding: '12px 14px', fontVariantNumeric: 'tabular-nums' }}>
                          {latest ? (
                            <span
                              style={{
                                background: '#F1F5F9',
                                color: '#1E293B',
                                border: '1px solid #E2E8F0',
                                borderRadius: 6,
                                padding: '2px 7px',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              v{latest.versionNumber}
                            </span>
                          ) : (
                            <small style={{ color: '#818285' }}>—</small>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              ...getVersionBadgeStyle(latestStatus),
                              borderRadius: 999,
                              padding: '3px 9px',
                              fontSize: 11,
                              fontWeight: 600,
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatStatusLabel(latestStatus, t)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'end' }}>
                          {canUpload && deliv.role === actorRole ? (
                            <button
                              type="button"
                              className="button"
                              data-testid={`open-upload-version-btn-${deliv.id}`}
                              style={{
                                background: '#0072BC',
                                color: '#FFFFFF',
                                border: '1px solid #0072BC',
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDeliverableId(deliv.id);
                                setUploadingId(deliv.id);
                                setFileUrl('');
                                setFileName('');
                                setNotes('');
                              }}
                            >
                              + {t('Upload')} v{deliv.versions.length + 1}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDeliverableId(deliv.id);
                              }}
                              style={{
                                background: '#FFFFFF',
                                color: '#0072BC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                padding: '5px 10px',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {t('Inspect')} ({deliv.versions.length})
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Version History Drawer (v1, v2, v3...) */}
        <aside
          data-testid="engineering-version-drawer"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 16,
            position: 'sticky',
            top: 16,
          }}
        >
          {!activeDeliverable ? (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: '#818285', fontSize: 13 }}>
              {t('Select a deliverable row to inspect its version history (v1, v2, v3).')}
            </div>
          ) : (
            <div>
              <div style={{ paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#0072BC', fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {activeDeliverable.projectCode} {activeDeliverable.apartmentNumber ? `• ${activeDeliverable.apartmentNumber}` : ''}
                  </span>
                  <span
                    style={{
                      background: '#F1F5F9',
                      color: '#818285',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {activeDeliverable.versions.length} {activeDeliverable.versions.length === 1 ? t('version') : t('versions')}
                  </span>
                </div>
                <h3 style={{ margin: '6px 0 4px', fontSize: 16, fontWeight: 600, color: '#1E293B' }}>
                  {activeDeliverable.title}
                </h3>
                <small style={{ color: '#818285' }}>
                  {activeDeliverable.projectName} • {activeDeliverable.assigneeName} ({activeDeliverable.role.replace(/_/g, ' ')})
                </small>
                {activeDeliverable.deadlineAt && (
                  <small style={{ color: '#818285', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    Deadline: {activeDeliverable.deadlineAt}
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                {activeDeliverable.versions.length === 0 ? (
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px dashed #E2E8F0',
                      borderRadius: 8,
                      padding: 16,
                      color: '#818285',
                      fontSize: 13,
                      textAlign: 'center',
                    }}
                  >
                    {t('No versions uploaded yet. Waiting for v1 upload.')}
                  </div>
                ) : (
                  activeDeliverable.versions.map((ver) => {
                    const key = `${activeDeliverable.id}-${ver.versionNumber}`;
                    return (
                      <div
                        key={ver.versionNumber}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: 12,
                          background: '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                background: '#E6F2FA',
                                color: '#0072BC',
                                borderRadius: 6,
                                padding: '2px 8px',
                                fontSize: 12,
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              v{ver.versionNumber}
                            </span>
                            <strong style={{ color: '#1E293B', fontSize: 13 }}>{ver.fileName}</strong>
                          </div>
                          <span
                            className={`badge ${ver.status}`}
                            style={{
                              ...getVersionBadgeStyle(ver.status),
                              borderRadius: 999,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {t(ver.status)}
                          </span>
                        </div>

                        <small style={{ color: '#818285', marginTop: 6 }}>
                          {ver.format} • {t('By')} <strong style={{ color: '#1E293B' }}>{ver.submittedBy}</strong>
                        </small>
                        {ver.notes && (
                          <p style={{ marginTop: 6, fontSize: 12, color: '#1E293B', lineHeight: 1.45 }}>
                            {ver.notes}
                          </p>
                        )}
                        {ver.reviewerComment && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: '6px 8px',
                              background: '#F8FAFC',
                              borderLeft: '2px solid #818285',
                              fontSize: 12,
                              color: '#1E293B',
                            }}
                          >
                            <span style={{ color: '#818285', fontWeight: 600 }}>{t('Manager')}:</span> {ver.reviewerComment}
                          </div>
                        )}

                        {canReview && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input
                              placeholder={t('Manager review note...')}
                              value={reviewComments[key] || ''}
                              onChange={(e) =>
                                setReviewComments((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                border: '1px solid #E2E8F0',
                                borderRadius: 6,
                                fontSize: 12,
                                color: '#1E293B',
                                background: '#F8FAFC',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="button"
                                data-testid={`approve-deliverable-${activeDeliverable.id}-v${ver.versionNumber}`}
                                style={{
                                  flex: 1,
                                  background: '#14A850',
                                  color: '#FFFFFF',
                                  border: '1px solid #14A850',
                                  borderRadius: 8,
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                                onClick={async () => {
                                  try {
                                    await onReviewVersion(activeDeliverable.id, {
                                      version: activeDeliverable.version,
                                      versionNumber: ver.versionNumber,
                                      decision: 'approved',
                                      comment:
                                        reviewComments[key] ||
                                        'Approved by Manager',
                                    });
                                    onNotice(
                                      `Approved ${activeDeliverable.title} v${ver.versionNumber}.`
                                    );
                                  } catch (err) {
                                    onError((err as Error).message);
                                  }
                                }}
                              >
                                {t('Approve')} v{ver.versionNumber}
                              </button>
                              <button
                                type="button"
                                className="button secondary"
                                data-testid={`revision-deliverable-${activeDeliverable.id}-v${ver.versionNumber}`}
                                style={{
                                  flex: 1,
                                  background: '#FEF2F2',
                                  color: '#B91C1C',
                                  border: '1px solid #FECACA',
                                  borderRadius: 8,
                                  padding: '7px 12px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                                onClick={async () => {
                                  try {
                                    await onReviewVersion(activeDeliverable.id, {
                                      version: activeDeliverable.version,
                                      versionNumber: ver.versionNumber,
                                      decision: 'revision_requested',
                                      comment:
                                        reviewComments[key] ||
                                        'Please revise and upload next version.',
                                    });
                                    onNotice(
                                      `Requested revision on ${activeDeliverable.title} v${ver.versionNumber}.`
                                    );
                                  } catch (err) {
                                    onError((err as Error).message);
                                  }
                                }}
                              >
                                {t('Request Revision')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
