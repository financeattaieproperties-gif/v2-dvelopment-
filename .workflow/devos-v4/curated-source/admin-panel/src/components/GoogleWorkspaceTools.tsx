import React, { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Agent, Lead, Project, ProjectUnit } from '../api';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from '../../../shared/googleWorkspaceAuth';
import {
  ATTAIE_DRIVE_FOLDER_NAME,
  WorkspaceAuthError,
  deleteDriveFile,
  ensureAttaiePropertiesFolder,
  listAttaieFolderDocuments,
  listUserSpreadsheets,
  renameDriveFile,
  uploadDocumentToAttaieFolder,
  type AttaieDocumentCategory,
  type DriveFileItem,
} from '../../../shared/googleWorkspaceCore';
import {
  adaptAdminLeadForSheet,
  adaptAdminProjectForSheet,
  createDesignatedCrmSpreadsheet,
  exportProjectInventoryToGoogleSheet,
  exportSalesLeadsToGoogleSheet,
  getDesignatedSheetConfig,
  saveDesignatedSheetConfig,
  type DesignatedSheetConfig,
} from '../../../shared/googleSheetsExportService';
import {
  extractAgentEmail,
  syncCrmScheduleToAgentCalendar,
  type CrmCalendarScheduleType,
} from '../../../shared/googleCalendarSyncService';

export function useAdminGoogleAuth() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsub = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  const signInGoogle = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
      }
      return res;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signOutGoogle = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  return { needsAuth, setNeedsAuth, user, isLoggingIn, signInGoogle, signOutGoogle };
}

export function AdminGoogleSignInButton({
  onClick,
  disabled,
  label = 'Sign in with Google',
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="gsi-material-button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '8px 16px',
        background: '#FFFFFF',
        color: '#1F1F1F',
        border: '1px solid #747775',
        borderRadius: 6,
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="gsi-material-button-state" />
      <div
        className="gsi-material-button-content-wrapper"
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div className="gsi-material-button-icon" style={{ width: 18, height: 18 }}>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block', width: 18, height: 18 }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="gsi-material-button-contents">{label}</span>
        <span style={{ display: 'none' }}>{label}</span>
      </div>
    </button>
  );
}

const STYLES = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.45)',
    padding: 16,
  },
  modal: (maxWidth = 600): React.CSSProperties => ({
    width: '100%',
    maxWidth,
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '1.25rem',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)',
    color: '#1E293B',
  }),
  input: {
    width: '100%',
    padding: '0.52rem 0.75rem',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#1E293B',
    fontSize: '0.84rem',
    boxSizing: 'border-box' as const,
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#818285',
    marginBottom: 4,
  },
  primaryBtn: {
    padding: '0.52rem 1rem',
    borderRadius: 6,
    border: 'none',
    background: '#0072BC',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  secondaryBtn: {
    padding: '0.52rem 0.95rem',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#1E293B',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none',
  },
  dangerBtn: {
    padding: '0.45rem 0.85rem',
    borderRadius: 6,
    border: 'none',
    background: '#B91C1C',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  th: {
    padding: '0.6rem 0.75rem',
    background: '#F8FAFC',
    textAlign: 'left' as const,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#818285',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    borderBottom: '1px solid #E2E8F0',
  },
  td: {
    padding: '0.65rem 0.75rem',
    borderBottom: '1px solid #F1F5F9',
    fontSize: '0.82rem',
    color: '#1E293B',
    fontVariantNumeric: 'tabular-nums' as const,
  },
};

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm?: () => Promise<void>;
}

function AdminConfirmDialog({
  prompt,
  busy,
  onCancel,
  onConfirm,
}: {
  prompt: ConfirmState;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div role="dialog" aria-modal="true" style={{ ...STYLES.overlay, zIndex: 1100 }}>
      <div style={STYLES.modal(440)}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1E293B' }}>
          {prompt.title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#818285', lineHeight: 1.5 }}>
          {prompt.description}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 18,
          }}
        >
          <button type="button" style={STYLES.secondaryBtn} disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            style={prompt.danger ? STYLES.dangerBtn : STYLES.primaryBtn}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Processing…' : prompt.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin Google Drive ('Attaie Properties' Folder) Modal
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AttaieDocumentCategory, string> = {
  brochure: 'Property Brochure',
  architectural: 'Architectural Doc',
  contract: 'Contract / Deed',
  other: 'Project File',
};

export function AdminDriveFolderModal({
  projects = [],
  onClose,
  onNotice,
}: {
  projects?: Project[];
  onClose: () => void;
  onNotice?: (msg: string) => void;
}) {
  const { needsAuth, setNeedsAuth, user, isLoggingIn, signInGoogle, signOutGoogle } =
    useAdminGoogleAuth();
  const [folder, setFolder] = useState<DriveFileItem | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AttaieDocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<AttaieDocumentCategory>('brochure');
  const [projectRef, setProjectRef] = useState('');
  const [description, setDescription] = useState('');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadFolder = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await listAttaieFolderDocuments({
        folderId: folder?.id,
        category: categoryFilter,
        searchQuery,
      });
      setFolder(res.folder);
      setFiles(res.files);
    } catch (err) {
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load Drive folder.');
      }
    } finally {
      setLoading(false);
    }
  }, [folder?.id, categoryFilter, searchQuery, setNeedsAuth]);

  useEffect(() => {
    if (!needsAuth) {
      void loadFolder();
    }
  }, [needsAuth, loadFolder]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const targetFolder = folder || (await ensureAttaiePropertiesFolder());
      setFolder(targetFolder);
      const uploaded = await uploadDocumentToAttaieFolder(selectedFile, {
        folderId: targetFolder.id,
        category: uploadCategory,
        projectRef: projectRef.trim(),
        description: description.trim(),
        uploadedBy: user?.email || user?.displayName || 'Admin',
      });
      setSelectedFile(null);
      setDescription('');
      onNotice?.(`Uploaded "${uploaded.name}" to '${ATTAIE_DRIVE_FOLDER_NAME}' Drive folder.`);
      await loadFolder();
    } catch (err) {
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        setError(err instanceof Error ? err.message : 'Upload to Google Drive failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeConfirm = async () => {
    if (!confirmPrompt) return;
    setConfirmBusy(true);
    try {
      await confirmPrompt.onConfirm?.();
      setConfirmPrompt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
      setConfirmPrompt(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={STYLES.overlay}>
      {confirmPrompt && (
        <AdminConfirmDialog
          prompt={confirmPrompt}
          busy={confirmBusy}
          onCancel={() => setConfirmPrompt(null)}
          onConfirm={() => void executeConfirm()}
        />
      )}
      <div style={STYLES.modal(820)}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Google Drive Repository · {ATTAIE_DRIVE_FOLDER_NAME}
            </div>
            <h2 style={{ margin: '2px 0 4px', fontSize: '1.15rem' }}>
              Property Brochures &amp; Architectural Documents
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Upload and manage brochures, floor plans, and technical dossiers directly in your &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo; Drive folder.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!needsAuth && folder?.webViewLink && (
              <a
                href={folder.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                style={STYLES.secondaryBtn}
              >
                Open Folder
              </a>
            )}
            {!needsAuth && (
              <button
                type="button"
                style={STYLES.secondaryBtn}
                onClick={() => void signOutGoogle()}
              >
                Disconnect
              </button>
            )}
            <button type="button" style={STYLES.secondaryBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              padding: '0.65rem 0.9rem',
              borderRadius: 6,
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {needsAuth ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.86rem', color: '#475569' }}>
              Sign in with Google Workspace to access and upload files to &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo;.
            </p>
            <AdminGoogleSignInButton
              onClick={() => void signInGoogle()}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <form
              onSubmit={(e) => void handleUpload(e)}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 14,
                display: 'grid',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                  gap: 10,
                }}
              >
                <div>
                  <label style={STYLES.label}>Document Type</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as AttaieDocumentCategory)}
                    style={STYLES.input}
                  >
                    <option value="brochure">Property Brochure (PDF/Print)</option>
                    <option value="architectural">Architectural Document (CAD/PDF)</option>
                    <option value="contract">Contract / Deed Template</option>
                    <option value="other">Other Project Document</option>
                  </select>
                </div>
                <div>
                  <label style={STYLES.label}>Project Reference</label>
                  <select
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    style={STYLES.input}
                  >
                    <option value="">General / All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={`PRJ-${p.id} — ${p.name}`}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={STYLES.label}>Description / Revision</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional notes"
                    style={STYLES.input}
                  />
                </div>
                <div>
                  <label style={STYLES.label}>Select File</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg,.webp,.ppt,.pptx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '0.8rem', width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{ ...STYLES.primaryBtn, opacity: loading || !selectedFile ? 0.5 : 1 }}
                  disabled={loading || !selectedFile}
                >
                  {loading ? 'Uploading…' : `Upload to '${ATTAIE_DRIVE_FOLDER_NAME}'`}
                </button>
              </div>
            </form>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(
                  [
                    ['all', 'All'],
                    ['brochure', 'Brochures'],
                    ['architectural', 'Architectural'],
                    ['contract', 'Contracts'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(key)}
                    style={{
                      padding: '0.35rem 0.7rem',
                      borderRadius: 6,
                      border: categoryFilter === key ? '1px solid #0072BC' : '1px solid #E2E8F0',
                      background: categoryFilter === key ? '#E6F2FA' : '#FFFFFF',
                      color: categoryFilter === key ? '#0072BC' : '#1E293B',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search folder…"
                  style={{ ...STYLES.input, width: 190 }}
                />
                <button
                  type="button"
                  style={STYLES.secondaryBtn}
                  onClick={() => void loadFolder()}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={STYLES.th}>File</th>
                    <th style={STYLES.th}>Category</th>
                    <th style={STYLES.th}>Project Ref</th>
                    <th style={STYLES.th}>Modified</th>
                    <th style={STYLES.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...STYLES.td, textAlign: 'center', color: '#64748B', padding: '1.5rem' }}>
                        No documents found in &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo;.
                      </td>
                    </tr>
                  ) : (
                    files.map((file) => {
                      const cat =
                        (file.appProperties?.attaieCategory as AttaieDocumentCategory) || 'other';
                      return (
                        <tr key={file.id}>
                          <td style={STYLES.td}>
                            {renamingId === file.id ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input
                                  value={renameDraft}
                                  onChange={(e) => setRenameDraft(e.target.value)}
                                  style={{ ...STYLES.input, padding: '0.3rem 0.5rem' }}
                                />
                                <button
                                  type="button"
                                  style={STYLES.primaryBtn}
                                  onClick={() => {
                                    const nextName = renameDraft.trim();
                                    if (!nextName || nextName === file.name) {
                                      setRenamingId(null);
                                      return;
                                    }
                                    setConfirmPrompt({
                                      title: 'Rename File in Google Drive?',
                                      description: `Rename "${file.name}" to "${nextName}"?`,
                                      confirmLabel: 'Confirm Rename',
                                      onConfirm: async () => {
                                        await renameDriveFile(file.id, nextName);
                                        setRenamingId(null);
                                        onNotice?.(`Renamed Drive file to "${nextName}".`);
                                        await loadFolder();
                                      },
                                    });
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  style={STYLES.secondaryBtn}
                                  onClick={() => setRenamingId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <strong>{file.name}</strong>
                                {file.description && (
                                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                    {file.description}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                          <td style={STYLES.td}>{CATEGORY_LABELS[cat] || 'Project File'}</td>
                          <td style={STYLES.td}>{file.appProperties?.projectRef || '—'}</td>
                          <td style={STYLES.td}>
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString()
                              : '—'}
                          </td>
                          <td style={STYLES.td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ ...STYLES.secondaryBtn, padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
                                >
                                  Open
                                </a>
                              )}
                              <button
                                type="button"
                                style={{ ...STYLES.secondaryBtn, padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
                                onClick={() => {
                                  setRenamingId(file.id);
                                  setRenameDraft(file.name);
                                }}
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                style={{ ...STYLES.dangerBtn, padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
                                onClick={() =>
                                  setConfirmPrompt({
                                    title: 'Delete File from Google Drive?',
                                    description: `Permanently delete "${file.name}" from '${ATTAIE_DRIVE_FOLDER_NAME}'?`,
                                    confirmLabel: 'Delete File',
                                    danger: true,
                                    onConfirm: async () => {
                                      await deleteDriveFile(file.id);
                                      onNotice?.(`Deleted "${file.name}" from Google Drive.`);
                                      await loadFolder();
                                    },
                                  })
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Admin Google Sheets Export Modal (Sales Leads & Project Inventory Updates)
// ─────────────────────────────────────────────────────────────────────────────

export function AdminSheetsExportModal({
  mode,
  leads = [],
  projects = [],
  projectUnitsById = {},
  onClose,
  onSuccess,
}: {
  mode: 'leads' | 'inventory';
  leads?: Lead[];
  projects?: Project[];
  projectUnitsById?: Record<number, ProjectUnit[]>;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const { needsAuth, setNeedsAuth, isLoggingIn, signInGoogle } = useAdminGoogleAuth();
  const [spreadsheets, setSpreadsheets] = useState<DriveFileItem[]>([]);
  const [designated, setDesignated] = useState<DesignatedSheetConfig | null>(() =>
    getDesignatedSheetConfig()
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => getDesignatedSheetConfig()?.spreadsheetId || ''
  );
  const [newSheetName, setNewSheetName] = useState(
    'Attaie Properties — Sales & Project Inventory'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSheets = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const list = await listUserSpreadsheets();
      setSpreadsheets(list);
      if (!selectedId && list[0]?.id) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to list spreadsheets.');
      }
    } finally {
      setBusy(false);
    }
  }, [selectedId, setNeedsAuth]);

  useEffect(() => {
    if (!needsAuth) {
      void loadSheets();
    }
  }, [needsAuth, loadSheets]);

  const selectedSheetTitle =
    spreadsheets.find((s) => s.id === selectedId)?.name ||
    (designated?.spreadsheetId === selectedId ? designated.title : 'Selected Google Sheet');

  const targetTabName = mode === 'leads' ? 'Sales Leads' : 'Project Inventory';
  const summaryText =
    mode === 'leads'
      ? `${leads.length} sales lead(s)`
      : `${projects.length} project(s) and their unit inventory`;

  const handleCreateSheet = async () => {
    if (!newSheetName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const created = await createDesignatedCrmSpreadsheet(newSheetName.trim());
      setDesignated(created);
      setSelectedId(created.spreadsheetId);
      await loadSheets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Google Sheet.');
    } finally {
      setBusy(false);
    }
  };

  const executeExport = async () => {
    if (!selectedId) return;
    setBusy(true);
    setError('');
    try {
      saveDesignatedSheetConfig({
        spreadsheetId: selectedId,
        title: selectedSheetTitle,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${selectedId}/edit`,
        leadsTab: 'Sales Leads',
        inventoryTab: 'Project Inventory',
      });

      if (mode === 'leads') {
        const res = await exportSalesLeadsToGoogleSheet({
          spreadsheetId: selectedId,
          leads: leads.map((l) => adaptAdminLeadForSheet(l)),
        });
        setConfirmOpen(false);
        onSuccess(
          `Exported ${res.rowCount} sales lead(s) to "${res.spreadsheetTitle}" (Tab: ${res.tabTitle}).`
        );
      } else {
        const res = await exportProjectInventoryToGoogleSheet({
          spreadsheetId: selectedId,
          projects: projects.map((p) =>
            adaptAdminProjectForSheet(p, projectUnitsById[p.id] || [])
          ),
        });
        setConfirmOpen(false);
        onSuccess(
          `Exported ${res.projectCount} project(s) (${res.dataRowCount} unit rows) to "${res.spreadsheetTitle}" (Tab: ${res.tabTitle}).`
        );
      }
      onClose();
    } catch (err) {
      setConfirmOpen(false);
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        setError(err instanceof Error ? err.message : 'Export to Google Sheets failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={STYLES.overlay}>
      {confirmOpen && (
        <AdminConfirmDialog
          prompt={{
            title: 'Confirm Google Sheets Export',
            description: `Write ${summaryText} to "${selectedSheetTitle}" (Tab: "${targetTabName}")? Existing rows in "${targetTabName}" will be updated.`,
            confirmLabel: 'Confirm Export',
          }}
          busy={busy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void executeExport()}
        />
      )}
      <div style={STYLES.modal(520)}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
            {mode === 'leads'
              ? 'Export Sales Leads to Google Sheets'
              : 'Export Project Inventory Updates to Google Sheets'}
          </h3>
          <button type="button" style={STYLES.secondaryBtn} onClick={onClose}>
            Close
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              padding: '0.6rem 0.85rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {needsAuth ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#64748B' }}>
              Sign in with Google to export {summaryText} into your designated Google Sheet.
            </p>
            <AdminGoogleSignInButton
              onClick={() => void signInGoogle()}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '0.7rem 0.9rem',
                fontSize: '0.82rem',
              }}
            >
              Exporting <strong>{summaryText}</strong> to tab{' '}
              <strong>&lsquo;{targetTabName}&rsquo;</strong>.
            </div>

            <div>
              <label style={STYLES.label}>Google Sheet ID (or Paste Sheet URL)</label>
              <input
                type="text"
                value={selectedId}
                placeholder="Paste Google Sheet ID or https://docs.google.com/spreadsheets/d/..."
                onChange={(e) => {
                  const val = e.target.value.trim();
                  const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                  setSelectedId(match ? match[1] : val);
                }}
                disabled={busy}
                style={STYLES.input}
              />
            </div>

            <div>
              <label style={STYLES.label}>Or Select Existing Google Sheet</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={busy}
                style={STYLES.input}
              >
                {spreadsheets.length === 0 && !selectedId && (
                  <option value="">No spreadsheets found — create one below</option>
                )}
                {selectedId &&
                  !spreadsheets.some((s) => s.id === selectedId) &&
                  designated?.spreadsheetId === selectedId && (
                    <option value={selectedId}>{designated.title} (Designated)</option>
                  )}
                {spreadsheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
              <label style={STYLES.label}>Or Create a New Designated CRM Sheet</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  style={STYLES.input}
                />
                <button
                  type="button"
                  style={{ ...STYLES.secondaryBtn, whiteSpace: 'nowrap' }}
                  disabled={busy || !newSheetName.trim()}
                  onClick={() => void handleCreateSheet()}
                >
                  Create Sheet
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button type="button" style={STYLES.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                style={{ ...STYLES.primaryBtn, opacity: busy || !selectedId ? 0.5 : 1 }}
                disabled={busy || !selectedId}
                onClick={() => setConfirmOpen(true)}
              >
                Export to Google Sheets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Admin Google Calendar Sync Confirmation Modal (Follow-up / Property Visit)
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingAdminCalendarSync {
  scheduleType: CrmCalendarScheduleType;
  customerName: string;
  customerPhone?: string;
  propertyOrProject?: string;
  serial?: string;
  scheduledAtIso: string;
  notes?: string;
  assignedAgentName: string;
  assignedAgentEmail: string;
}

export function AdminCalendarSyncConfirmModal({
  pending,
  agents = [],
  onClose,
  onSynced,
}: {
  pending: PendingAdminCalendarSync;
  agents?: Agent[];
  onClose: () => void;
  onSynced: (message: string) => void;
}) {
  const { needsAuth, setNeedsAuth, isLoggingIn, signInGoogle } = useAdminGoogleAuth();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agentName, setAgentName] = useState(pending.assignedAgentName);
  const [agentEmail, setAgentEmail] = useState(pending.assignedAgentEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleAgentPick = (idStr: string) => {
    setSelectedAgentId(idStr);
    const found = agents.find((a) => String(a.id) === idStr);
    if (found) {
      setAgentName(found.name);
      setAgentEmail(extractAgentEmail(found));
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await syncCrmScheduleToAgentCalendar({
        scheduleType: pending.scheduleType,
        customerName: pending.customerName,
        customerPhone: pending.customerPhone,
        propertyOrProject: pending.propertyOrProject,
        serial: pending.serial,
        scheduledAtIso: pending.scheduledAtIso,
        notes: pending.notes,
        assignedAgentName: agentName.trim(),
        assignedAgentEmail: agentEmail.trim(),
      });
      if (res.needsAuth) {
        setNeedsAuth(true);
        return;
      }
      onSynced(
        `Created Google Calendar ${pending.scheduleType === 'visit' ? 'property visit' : 'follow-up'} event for ${agentName.trim() || 'assigned agent'}${res.attendeeInvited && agentEmail.trim() ? ` (${agentEmail.trim()})` : ''}.`
      );
      onClose();
    } catch (err) {
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        setError(err instanceof Error ? err.message : 'Google Calendar sync failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={STYLES.overlay}>
      <div style={STYLES.modal(480)}>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#1E293B' }}>
          Confirm Google Calendar Synchronization
        </h3>
        <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#818285', lineHeight: 1.5 }}>
          Confirm creating a{' '}
          <strong>
            {pending.scheduleType === 'visit' ? 'Property Visit' : 'Lead Follow-up'}
          </strong>{' '}
          event in the assigned agent&rsquo;s Google Calendar:
        </p>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '0.75rem 0.9rem',
            fontSize: '0.82rem',
            display: 'grid',
            gap: 4,
            marginBottom: 12,
          }}
        >
          <div>
            <strong>Customer:</strong> {pending.customerName}
            {pending.customerPhone ? ` (${pending.customerPhone})` : ''}
          </div>
          {pending.propertyOrProject && (
            <div>
              <strong>Property / Project:</strong> {pending.propertyOrProject}
            </div>
          )}
          <div>
            <strong>Time (Kabul):</strong>{' '}
            {new Date(pending.scheduledAtIso).toLocaleString('en-US', {
              timeZone: 'Asia/Kabul',
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
        </div>

        {agents.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <label style={STYLES.label}>Select Assigned Agent</label>
            <select
              value={selectedAgentId}
              onChange={(e) => handleAgentPick(e.target.value)}
              style={STYLES.input}
            >
              <option value="">Custom / Current Agent ({agentName || 'Unassigned'})</option>
              {agents.map((ag) => (
                <option key={ag.id} value={String(ag.id)}>
                  {ag.name} ({ag.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={STYLES.label}>Assigned Agent Google Calendar Email</label>
          <input
            type="email"
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
            placeholder="agent@attaieproperties.com (optional for own primary calendar)"
            style={STYLES.input}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              padding: '0.55rem 0.8rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {needsAuth ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AdminGoogleSignInButton
                onClick={() => void signInGoogle()}
                disabled={isLoggingIn}
                label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
              />
            </div>
            <button type="button" style={STYLES.secondaryBtn} onClick={onClose}>
              Skip Calendar Sync
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" style={STYLES.secondaryBtn} disabled={busy} onClick={onClose}>
              Skip Sync
            </button>
            <button
              type="button"
              style={{ ...STYLES.primaryBtn, opacity: busy ? 0.6 : 1 }}
              disabled={busy}
              onClick={() => void handleConfirm()}
            >
              {busy ? 'Creating Event…' : 'Confirm & Sync to Calendar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
