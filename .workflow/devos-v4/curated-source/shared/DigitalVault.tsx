import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Folder,
  FolderPlus,
  UploadCloud,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FileArchive,
  Download,
  Eye,
  Trash2,
  ChevronRight,
  Search,
  RefreshCw,
  Home,
  User,
  Clock,
  HardDrive,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export interface VaultFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_by_name: string;
  created_at: string;
}

export interface VaultFile {
  id: number;
  folder_id: number | null;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploader_name: string;
  uploader_role?: string;
  created_at: string;
}

export interface Breadcrumb {
  id: number;
  name: string;
  parent_id: number | null;
}

interface DigitalVaultProps {
  currentUser?: {
    name?: string;
    role?: string;
    uid?: string;
  };
  apiBaseUrl?: string;
}

export const DigitalVault: React.FC<DigitalVaultProps> = ({
  currentUser,
  apiBaseUrl = '/api',
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  
  // Modals & previews
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const fetchVault = useCallback(
    async (folderId: number | null, query = '') => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (folderId !== null) params.set('folder_id', String(folderId));
        if (query.trim() !== '') params.set('q', query.trim());

        const res = await fetch(`${apiBaseUrl}/vault.php?${params.toString()}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            ...(currentUser?.name ? { 'X-Staff-Name': currentUser.name } : {}),
            ...(currentUser?.role ? { 'X-Staff-Role': currentUser.role } : {}),
            ...(currentUser?.uid ? { 'X-Staff-Uid': currentUser.uid } : {}),
          },
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setFolders(data.folders || []);
        setFiles(data.files || []);
        setBreadcrumbs(data.breadcrumbs || []);
      } catch (err: any) {
        notify(err.message || 'Failed to load vault items', 'error');
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl, currentUser]
  );

  useEffect(() => {
    fetchVault(currentFolderId, searchQuery);
  }, [currentFolderId, searchQuery, fetchVault]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch(`${apiBaseUrl}/vault.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(currentUser?.name ? { 'X-Staff-Name': currentUser.name } : {}),
          ...(currentUser?.role ? { 'X-Staff-Role': currentUser.role } : {}),
        },
        body: JSON.stringify({
          action: 'create_folder',
          name: newFolderName.trim(),
          parent_id: currentFolderId,
          uploader_name: currentUser?.name || 'Staff Member',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create folder');

      notify(`Folder "${newFolderName.trim()}" created successfully`);
      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchVault(currentFolderId, searchQuery);
    } catch (err: any) {
      notify(err.message || 'Error creating folder', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgressText(`Uploading ${selectedFiles.length} file(s)...`);

    let uploadedCount = 0;
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgressText(`Uploading (${i + 1}/${selectedFiles.length}): ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId !== null) formData.append('folder_id', String(currentFolderId));
        formData.append('uploader_name', currentUser?.name || 'Staff Member');
        if (currentUser?.role) formData.append('uploader_role', currentUser.role);

        const res = await fetch(`${apiBaseUrl}/vault.php`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            ...(currentUser?.name ? { 'X-Staff-Name': currentUser.name } : {}),
            ...(currentUser?.role ? { 'X-Staff-Role': currentUser.role } : {}),
          },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed uploading ${file.name}`);
        }
        uploadedCount++;
      }
      notify(`Successfully uploaded ${uploadedCount} file(s)`);
      fetchVault(currentFolderId, searchQuery);
    } catch (err: any) {
      notify(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (type: 'folder' | 'file', id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${type} "${name}"?`)) return;

    try {
      const res = await fetch(`${apiBaseUrl}/vault.php`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ type, id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to delete ${type}`);

      notify(`Deleted ${name} successfully`);
      fetchVault(currentFolderId, searchQuery);
    } catch (err: any) {
      notify(err.message || 'Delete operation failed', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-emerald-600" />;
    }
    if (mime.includes('pdf') || ['pdf'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (mime.includes('spreadsheet') || mime.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-700" />;
    }
    if (mime.includes('word') || ['doc', 'docx'].includes(ext)) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="w-5 h-5 text-amber-600" />;
    }
    if (['js', 'ts', 'tsx', 'php', 'json', 'html', 'css', 'py'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-purple-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const canPreviewInBrowser = (file: VaultFile) => {
    const mime = file.mime_type.toLowerCase();
    const ext = file.original_name.split('.').pop()?.toLowerCase() || '';
    return (
      mime.startsWith('image/') ||
      mime.startsWith('video/') ||
      mime.startsWith('audio/') ||
      mime.includes('pdf') ||
      ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf', 'txt', 'mp4', 'webm'].includes(ext)
    );
  };

  return (
    <div className="digital-vault-container alabaster-card" style={{ padding: '24px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(10, 25, 47, 0.05)' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 500,
            background: notification.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: notification.type === 'error' ? '#991B1B' : '#166534',
            border: `1px solid ${notification.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <AlertCircle size={18} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive className="w-6 h-6 text-[#0072BC]" style={{ color: '#0072BC' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0A192F', margin: 0, letterSpacing: '-0.02em' }}>
              Digital Vault
            </h2>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: '#E6F2FA', color: '#0072BC' }}>
              Full Access Storage
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Shared organization drive for all team members. Upload any file type, create folders, preview, and download.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowNewFolderModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          >
            <FolderPlus size={16} style={{ color: '#0072BC' }} />
            <span>New Folder</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#0072BC',
              color: '#FFFFFF',
              border: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0, 114, 188, 0.25)',
              opacity: isUploading ? 0.8 : 1,
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => !isUploading && (e.currentTarget.style.background = '#005E9B')}
            onMouseOut={(e) => !isUploading && (e.currentTarget.style.background = '#0072BC')}
          >
            <UploadCloud size={16} />
            <span>{isUploading ? 'Uploading...' : 'Upload Files'}</span>
          </button>
        </div>
      </div>

      {/* Uploading Status Banner */}
      {isUploading && (
        <div style={{ padding: '10px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#0284C7' }}>
          <RefreshCw size={16} className="animate-spin" />
          <span>{uploadProgressText}</span>
        </div>
      )}

      {/* Navigation Toolbar: Breadcrumbs & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
        {/* Breadcrumb path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', flex: 1, minWidth: '220px', overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: currentFolderId === null ? '#0A192F' : '#64748B', fontWeight: currentFolderId === null ? 700 : 500, cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }}
          >
            <Home size={15} style={{ color: '#0072BC' }} />
            <span>Vault Root</span>
          </button>

          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight size={14} style={{ color: '#94A3B8' }} />
              <button
                type="button"
                onClick={() => setCurrentFolderId(b.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === breadcrumbs.length - 1 ? '#0A192F' : '#64748B',
                  fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search Input & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files or folders..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#1E293B',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchVault(currentFolderId, searchQuery)}
            title="Refresh vault"
            style={{ padding: '6px 8px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#0072BC' }} />
          <p style={{ fontSize: '14px' }}>Loading digital vault items...</p>
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
          <Folder size={40} style={{ color: '#94A3B8', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>
            {searchQuery ? 'No matching files or folders found' : 'This folder is empty'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '380px', margin: '0 auto 16px auto' }}>
            {searchQuery
              ? 'Try modifying your search term or navigate back to root.'
              : 'Upload project documents, legal agreements, floor plans, blueprints, or spreadsheets for your team.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowNewFolderModal(true)}
              style={{ padding: '8px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer' }}
            >
              + Create Folder
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, background: '#0072BC', color: '#FFF', border: 'none', cursor: 'pointer' }}
            >
              Upload First File
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Folders Grid */}
          {folders.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Folders ({folders.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {folders.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setCurrentFolderId(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#F1F5F9';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Folder size={20} style={{ color: '#0072BC', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0A192F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={10} />
                          <span>{f.created_by_name}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Delete folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete('folder', f.id, f.name);
                      }}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#DC2626')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files List Table */}
          {files.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Files ({files.length})
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '12px', fontWeight: 600 }}>
                      <th style={{ padding: '10px 14px' }}>File Name</th>
                      <th style={{ padding: '10px 14px' }}>Size</th>
                      <th style={{ padding: '10px 14px' }}>Uploaded By</th>
                      <th style={{ padding: '10px 14px' }}>Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, idx) => (
                      <tr
                        key={file.id}
                        style={{
                          borderBottom: idx === files.length - 1 ? 'none' : '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#FBFBFD')}
                        onMouseOut={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {getFileIcon(file.mime_type, file.original_name)}
                            <div>
                              <div
                                onClick={() => canPreviewInBrowser(file) ? setPreviewFile(file) : window.open(file.file_url, '_blank')}
                                style={{
                                  fontWeight: 600,
                                  color: '#0072BC',
                                  cursor: 'pointer',
                                  maxWidth: '360px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={file.original_name}
                              >
                                {file.original_name}
                              </div>
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>{file.mime_type}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                          {formatFileSize(file.file_size)}
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{file.uploader_name}</span>
                            {file.uploader_role && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', textTransform: 'capitalize' }}>
                                {file.uploader_role}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <span>{file.created_at ? new Date(file.created_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {canPreviewInBrowser(file) ? (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                title="Preview in browser"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  background: '#E6F2FA',
                                  color: '#0072BC',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                }}
                              >
                                <Eye size={13} />
                                <span>Preview</span>
                              </button>
                            ) : (
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noreferrer"
                                title="Open file"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  background: '#F1F5F9',
                                  color: '#475569',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                }}
                              >
                                <ExternalLink size={13} />
                                <span>Open</span>
                              </a>
                            )}

                            <a
                              href={file.file_url}
                              download={file.original_name}
                              title="Download to computer"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                background: '#F1F5F9',
                                color: '#1E293B',
                                border: '1px solid #CBD5E1',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Download size={13} />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDelete('file', file.id, file.original_name)}
                              title="Delete file"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 25, 47, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
          onClick={() => setShowNewFolderModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={20} style={{ color: '#0072BC' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0A192F' }}>
                  Create New Folder
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Folder Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Kabul Tower Floor Plans, Legal Contracts"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', background: '#0072BC', color: '#FFFFFF', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Browser Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 25, 47, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              background: '#0A192F',
              borderRadius: '12px 12px 0 0',
              color: '#FFFFFF',
              maxWidth: '1100px',
              width: '100%',
              margin: '0 auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {getFileIcon(previewFile.mime_type, previewFile.original_name)}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                  {previewFile.original_name}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Uploaded by {previewFile.uploader_name} · {formatFileSize(previewFile.file_size)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href={previewFile.file_url}
                download={previewFile.original_name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#0072BC',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                <Download size={14} />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: '#1E293B',
              borderRadius: '0 0 12px 12px',
              maxWidth: '1100px',
              width: '100%',
              margin: '0 auto',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {previewFile.mime_type.startsWith('image/') ? (
              <img
                src={previewFile.file_url}
                alt={previewFile.original_name}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            ) : previewFile.mime_type.includes('pdf') ? (
              <iframe
                src={previewFile.file_url}
                title={previewFile.original_name}
                style={{ width: '100%', height: '75vh', border: 'none', borderRadius: '8px', background: '#FFFFFF' }}
              />
            ) : previewFile.mime_type.startsWith('video/') ? (
              <video
                src={previewFile.file_url}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ color: '#FFFFFF', textAlign: 'center' }}>
                <p>This file type cannot be rendered inline.</p>
                <a
                  href={previewFile.file_url}
                  download={previewFile.original_name}
                  style={{ color: '#38BDF8', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Click here to download
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
