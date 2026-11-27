import React, { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  Calendar,
  Check,
  ExternalLink,
  FolderOpen,
  LogOut,
  Plus,
  RefreshCw,
  Table2,
  Trash2,
  Edit3,
  Upload,
  X,
} from 'lucide-react';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from '../../../../shared/googleWorkspaceAuth';
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
} from '../../../../shared/googleWorkspaceCore';
import {
  adaptStaffLeadForSheet,
  adaptStaffProjectForSheet,
  createDesignatedCrmSpreadsheet,
  exportProjectInventoryToGoogleSheet,
  exportSalesLeadsToGoogleSheet,
  getDesignatedSheetConfig,
  saveDesignatedSheetConfig,
  type DesignatedSheetConfig,
} from '../../../../shared/googleSheetsExportService';
import {
  syncCrmScheduleToAgentCalendar,
  type CrmCalendarScheduleType,
} from '../../../../shared/googleCalendarSyncService';
import type {
  InventoryProject,
  Lead,
  StaffUser,
} from '../../../../packages/staff-contracts/types';

export function useStaffGoogleWorkspaceAuth() {
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

export function StaffGoogleSignInButton({
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
        fontSize: 13,
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

interface ConfirmPrompt {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm?: () => Promise<void>;
}

function StaffConfirmDialog({
  prompt,
  busy,
  onCancel,
  onConfirm,
}: {
  prompt: ConfirmPrompt;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle size={20} color={prompt.danger ? '#B91C1C' : '#0072BC'} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1E293B' }}>{prompt.title}</h3>
            <p style={{ marginTop: 6, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              {prompt.description}
            </p>
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button"
            style={prompt.danger ? { background: '#DC2626', color: '#FFFFFF' } : undefined}
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
// 1. Staff Google Drive ('Attaie Properties' Folder) Panel
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_BADGES: Record<AttaieDocumentCategory, string> = {
  brochure: 'Brochure',
  architectural: 'Architectural Doc',
  contract: 'Contract',
  other: 'Document',
};

export function StaffDriveDocumentsPanel({
  projects = [],
  defaultProjectRef = '',
  onNotice,
  onError,
}: {
  projects?: InventoryProject[];
  defaultProjectRef?: string;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}) {
  const { needsAuth, setNeedsAuth, user, isLoggingIn, signInGoogle, signOutGoogle } =
    useStaffGoogleWorkspaceAuth();
  const [folder, setFolder] = useState<DriveFileItem | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<AttaieDocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<AttaieDocumentCategory>('architectural');
  const [projectRef, setProjectRef] = useState(defaultProjectRef);
  const [description, setDescription] = useState('');

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  // Confirmation modal state
  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmPrompt | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadFolder = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
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
        onError(err instanceof Error ? err.message : 'Failed to load Google Drive folder.');
      }
    } finally {
      setLoading(false);
    }
  }, [folder?.id, categoryFilter, searchQuery, onError, setNeedsAuth]);

  useEffect(() => {
    if (!needsAuth) {
      void loadFolder();
    }
  }, [needsAuth, loadFolder]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    try {
      const targetFolder = folder || (await ensureAttaiePropertiesFolder());
      setFolder(targetFolder);
      const uploaded = await uploadDocumentToAttaieFolder(selectedFile, {
        folderId: targetFolder.id,
        category: uploadCategory,
        projectRef: projectRef.trim(),
        description: description.trim(),
        uploadedBy: user?.email || user?.displayName || 'Staff',
      });
      setSelectedFile(null);
      setDescription('');
      onNotice(
        `Uploaded "${uploaded.name}" into the '${ATTAIE_DRIVE_FOLDER_NAME}' Google Drive folder.`
      );
      await loadFolder();
    } catch (err) {
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        onError(err instanceof Error ? err.message : 'Google Drive upload failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestRename = (file: DriveFileItem) => {
    const nextName = renameDraft.trim();
    if (!nextName || nextName === file.name) {
      setRenamingId(null);
      return;
    }
    setConfirmPrompt({
      title: 'Rename File in Google Drive?',
      description: `Rename "${file.name}" to "${nextName}" inside the '${ATTAIE_DRIVE_FOLDER_NAME}' folder?`,
      confirmLabel: 'Confirm Rename',
      onConfirm: async () => {
        await renameDriveFile(file.id, nextName);
        setRenamingId(null);
        onNotice(`Renamed Drive document to "${nextName}".`);
        await loadFolder();
      },
    });
  };

  const requestDelete = (file: DriveFileItem) => {
    setConfirmPrompt({
      title: 'Delete File from Google Drive?',
      description: `Permanently delete "${file.name}" from '${ATTAIE_DRIVE_FOLDER_NAME}' in Google Drive? This cannot be undone.`,
      confirmLabel: 'Delete File',
      danger: true,
      onConfirm: async () => {
        await deleteDriveFile(file.id);
        onNotice(`Deleted "${file.name}" from Google Drive.`);
        await loadFolder();
      },
    });
  };

  const runConfirm = async () => {
    if (!confirmPrompt) return;
    setConfirmBusy(true);
    try {
      await confirmPrompt.onConfirm?.();
      setConfirmPrompt(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Google Drive action failed.');
      setConfirmPrompt(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <section
      className="panel"
      style={{ marginTop: 18 }}
      data-testid="staff-google-drive-documents-panel"
    >
      {confirmPrompt && (
        <StaffConfirmDialog
          prompt={confirmPrompt}
          busy={confirmBusy}
          onCancel={() => setConfirmPrompt(null)}
          onConfirm={() => void runConfirm()}
        />
      )}

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Google Drive Repository · {ATTAIE_DRIVE_FOLDER_NAME}</p>
          <h2>Property Brochures &amp; Architectural Documents</h2>
          <p>
            Upload and manage PDF brochures, CAD/PDF architectural plans, and project dossiers in
            the dedicated &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo; Google Drive folder.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {needsAuth ? (
            <StaffGoogleSignInButton
              onClick={() => void signInGoogle()}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
            />
          ) : (
            <>
              <span className="badge active">
                <FolderOpen size={13} style={{ marginRight: 4 }} />
                {ATTAIE_DRIVE_FOLDER_NAME}
              </span>
              {folder?.webViewLink && (
                <a
                  href={folder.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button secondary"
                >
                  <ExternalLink size={14} />
                  Open Folder
                </a>
              )}
              <button
                type="button"
                className="button secondary"
                onClick={() => void loadFolder()}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                Refresh
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => void signOutGoogle()}
                title={user?.email || 'Disconnect Google'}
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {needsAuth ? (
        <div style={{ padding: '20px 16px', textAlign: 'center', color: '#64748B' }}>
          <p style={{ marginBottom: 12 }}>
            Connect Google Workspace to upload property brochures and architectural documents into
            the dedicated &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo; folder.
          </p>
          <StaffGoogleSignInButton
            onClick={() => void signInGoogle()}
            disabled={isLoggingIn}
            label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
          />
        </div>
      ) : (
        <div style={{ padding: '14px 16px', display: 'grid', gap: 16 }}>
          <form
            onSubmit={(e) => void handleUpload(e)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 14,
              display: 'grid',
              gap: 12,
            }}
          >
            <div className="form-grid">
              <div className="field">
                <label>Document Type</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as AttaieDocumentCategory)}
                >
                  <option value="brochure">Property Brochure (PDF/Print)</option>
                  <option value="architectural">Architectural Document (CAD/PDF/3D)</option>
                  <option value="contract">Contract / Deed Template</option>
                  <option value="other">Other Project File</option>
                </select>
              </div>
              <div className="field">
                <label>Project / Property Reference</label>
                {projects.length > 0 ? (
                  <select
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                  >
                    <option value="">General / All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={`${p.code} — ${p.name}`}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    placeholder="e.g. PRJ-01 or AP-102"
                  />
                )}
              </div>
              <div className="field">
                <label>Notes (Optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Floor plan revision, brochure language, etc."
                />
              </div>
              <div className="field">
                <label>Document File</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg,.webp,.ppt,.pptx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="button"
                disabled={loading || !selectedFile}
              >
                <Upload size={15} />
                Upload to &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo;
              </button>
            </div>
          </form>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div className="filter-bar" style={{ margin: 0 }}>
              {(
                [
                  ['all', 'All Files'],
                  ['brochure', 'Brochures'],
                  ['architectural', 'Architectural'],
                  ['contract', 'Contracts'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={categoryFilter === key ? 'active' : ''}
                  onClick={() => setCategoryFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search folder…"
                style={{
                  padding: '6px 10px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => void loadFolder()}
              >
                Search
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Project Ref</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: 20 }}>
                      No files in &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo; matching this filter.
                    </td>
                  </tr>
                ) : (
                  files.map((file) => {
                    const cat =
                      (file.appProperties?.attaieCategory as AttaieDocumentCategory) || 'other';
                    return (
                      <tr key={file.id}>
                        <td>
                          {renamingId === file.id ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input
                                value={renameDraft}
                                onChange={(e) => setRenameDraft(e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 6,
                                  fontSize: 12,
                                }}
                              />
                              <button
                                type="button"
                                className="button"
                                onClick={() => requestRename(file)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="button secondary"
                                onClick={() => setRenamingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <strong>{file.name}</strong>
                              {file.description && <small>{file.description}</small>}
                            </>
                          )}
                        </td>
                        <td>
                          <span className="badge normal">{CATEGORY_BADGES[cat] || 'Document'}</span>
                        </td>
                        <td>{file.appProperties?.projectRef || '—'}</td>
                        <td>
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button secondary"
                              >
                                <ExternalLink size={13} />
                                Open
                              </a>
                            )}
                            <button
                              type="button"
                              className="button secondary"
                              onClick={() => {
                                setRenamingId(file.id);
                                setRenameDraft(file.name);
                              }}
                            >
                              <Edit3 size={13} />
                              Rename
                            </button>
                            <button
                              type="button"
                              className="button secondary"
                              style={{ color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => requestDelete(file)}
                            >
                              <Trash2 size={13} />
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
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Staff Google Sheets Export Modal (Sales Leads & Project Inventory Updates)
// ─────────────────────────────────────────────────────────────────────────────

export function StaffSheetsExportModal({
  mode,
  leads = [],
  projects = [],
  staffUsers = [],
  onClose,
  onSuccess,
  onError,
}: {
  mode: 'leads' | 'inventory';
  leads?: Lead[];
  projects?: InventoryProject[];
  staffUsers?: StaffUser[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (err: string) => void;
}) {
  const { needsAuth, setNeedsAuth, isLoggingIn, signInGoogle } =
    useStaffGoogleWorkspaceAuth();
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSheets = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setBusy(true);
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
        onError(err instanceof Error ? err.message : 'Failed to list Google Sheets.');
      }
    } finally {
      setBusy(false);
    }
  }, [selectedId, onError, setNeedsAuth]);

  useEffect(() => {
    if (!needsAuth) {
      void loadSheets();
    }
  }, [needsAuth, loadSheets]);

  const handleCreateNewDesignated = async () => {
    if (!newSheetName.trim()) return;
    setBusy(true);
    try {
      const created = await createDesignatedCrmSpreadsheet(newSheetName.trim());
      setDesignated(created);
      setSelectedId(created.spreadsheetId);
      await loadSheets();
      onSuccess(`Created & designated Google Sheet "${created.title}".`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create Google Sheet.');
    } finally {
      setBusy(false);
    }
  };

  const selectedSheetTitle =
    spreadsheets.find((s) => s.id === selectedId)?.name ||
    (designated?.spreadsheetId === selectedId ? designated.title : 'Selected Google Sheet');

  const targetTabName = mode === 'leads' ? 'Sales Leads' : 'Project Inventory';
  const recordSummary =
    mode === 'leads'
      ? `${leads.length} sales lead(s)`
      : `${projects.length} project(s) and their unit inventory`;

  const executeExport = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      saveDesignatedSheetConfig({
        spreadsheetId: selectedId,
        title: selectedSheetTitle,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${selectedId}/edit`,
        leadsTab: 'Sales Leads',
        inventoryTab: 'Project Inventory',
      });

      if (mode === 'leads') {
        const adapted = leads.map((l) => adaptStaffLeadForSheet(l, staffUsers));
        const res = await exportSalesLeadsToGoogleSheet({
          spreadsheetId: selectedId,
          leads: adapted,
        });
        setConfirmOpen(false);
        onSuccess(
          `Exported ${res.rowCount} sales lead(s) to "${res.spreadsheetTitle}" (Tab: ${res.tabTitle}).`
        );
      } else {
        const adapted = projects.map((p) => adaptStaffProjectForSheet(p));
        const res = await exportProjectInventoryToGoogleSheet({
          spreadsheetId: selectedId,
          projects: adapted,
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
        onError(err instanceof Error ? err.message : 'Google Sheets export failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        padding: 16,
      }}
    >
      {confirmOpen && (
        <StaffConfirmDialog
          prompt={{
            title: 'Update Designated Google Sheet?',
            description: `Export ${recordSummary} into "${selectedSheetTitle}" (Tab: "${targetTabName}")? Existing rows in "${targetTabName}" will be refreshed.`,
            confirmLabel: 'Confirm Export',
          }}
          busy={busy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void executeExport()}
        />
      )}

      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Table2 size={18} />
            <h3 style={{ margin: 0, fontSize: 16 }}>
              {mode === 'leads'
                ? 'Export Sales Leads to Google Sheets'
                : 'Export Project Inventory to Google Sheets'}
            </h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {needsAuth ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
              Sign in with Google to export {recordSummary} to your designated Google Sheet.
            </p>
            <StaffGoogleSignInButton
              onClick={() => void signInGoogle()}
              disabled={isLoggingIn}
              label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 12,
                fontSize: 12.5,
              }}
            >
              Ready to export <strong>{recordSummary}</strong> into tab{' '}
              <strong>&lsquo;{targetTabName}&rsquo;</strong>.
            </div>

            <div className="field">
              <label>Google Sheet ID (or Paste Sheet URL)</label>
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
              />
            </div>

            <div className="field">
              <label>Or Select Existing Google Sheet</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={busy}
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

            <div
              style={{
                borderTop: '1px solid #E2E8F0',
                paddingTop: 12,
                display: 'grid',
                gap: 8,
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Or Create a New Designated CRM Sheet
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy || !newSheetName.trim()}
                  onClick={() => void handleCreateNewDesignated()}
                >
                  <Plus size={14} />
                  Create Sheet
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button type="button" className="button secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="button"
                disabled={busy || !selectedId}
                onClick={() => setConfirmOpen(true)}
              >
                <Check size={15} />
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
// 3. Staff Google Calendar Sync Confirmation Modal (Lead Follow-up / Property Visit)
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingStaffCalendarSync {
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

export function StaffCalendarSyncConfirmModal({
  pending,
  onClose,
  onSynced,
  onError,
}: {
  pending: PendingStaffCalendarSync;
  onClose: () => void;
  onSynced: (message: string) => void;
  onError: (err: string) => void;
}) {
  const { needsAuth, setNeedsAuth, isLoggingIn, signInGoogle } =
    useStaffGoogleWorkspaceAuth();
  const [agentEmail, setAgentEmail] = useState(pending.assignedAgentEmail);
  const [busy, setBusy] = useState(false);

  const handleConfirmSync = async () => {
    setBusy(true);
    try {
      const res = await syncCrmScheduleToAgentCalendar({
        scheduleType: pending.scheduleType,
        customerName: pending.customerName,
        customerPhone: pending.customerPhone,
        propertyOrProject: pending.propertyOrProject,
        serial: pending.serial,
        scheduledAtIso: pending.scheduledAtIso,
        notes: pending.notes,
        assignedAgentName: pending.assignedAgentName,
        assignedAgentEmail: agentEmail.trim(),
      });
      if (res.needsAuth) {
        setNeedsAuth(true);
        return;
      }
      onSynced(
        `Created Google Calendar ${pending.scheduleType === 'visit' ? 'property visit' : 'follow-up'} event for ${pending.assignedAgentName || 'assigned agent'}${res.attendeeInvited && agentEmail.trim() ? ` (${agentEmail.trim()})` : ''}.`
      );
      onClose();
    } catch (err) {
      if (err instanceof WorkspaceAuthError) {
        setNeedsAuth(true);
      } else {
        onError(err instanceof Error ? err.message : 'Google Calendar sync failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.48)',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Calendar size={18} />
          <h3 style={{ margin: 0, fontSize: 15.5, color: '#1E293B' }}>
            Confirm Google Calendar Synchronization
          </h3>
        </div>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 12 }}>
          CRM record saved! Confirm creating the{' '}
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
            padding: 12,
            fontSize: 12.5,
            display: 'grid',
            gap: 4,
            marginBottom: 14,
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
          <div>
            <strong>Assigned Agent:</strong> {pending.assignedAgentName}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Assigned Agent Google Calendar Email</label>
          <input
            type="email"
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
            placeholder="agent@attaieproperties.com (optional if syncing to your own calendar)"
          />
        </div>

        {needsAuth ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <StaffGoogleSignInButton
                onClick={() => void signInGoogle()}
                disabled={isLoggingIn}
                label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
              />
            </div>
            <button type="button" className="button secondary" onClick={onClose}>
              Skip Calendar Sync
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
              Skip Sync
            </button>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => void handleConfirmSync()}
            >
              <Check size={15} />
              {busy ? 'Creating Event…' : 'Confirm & Sync to Calendar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
