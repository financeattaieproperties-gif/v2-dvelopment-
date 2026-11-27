import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import type { User } from 'firebase/auth';
import {
  Building2,
  FolderOpen,
  Table2,
  Calendar,
  FileText,
  CheckSquare,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  LogOut,
  Search,
  AlertTriangle,
  Check,
  X,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/firebase';
import {
  ATTAIE_DRIVE_FOLDER_NAME,
  WorkspaceAuthError,
  ensureAttaiePropertiesFolder,
  listAttaieFolderDocuments,
  uploadDocumentToAttaieFolder,
  listDriveFiles,
  createDriveFolder,
  renameDriveFile,
  deleteDriveFile,
  listUserSpreadsheets,
  getSpreadsheetMetadata,
  getSheetValues,
  createSpreadsheetWithData,
  updateSheetValues,
  listCalendars,
  listCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  listUserDocuments,
  getDocument,
  createPropertyDocument,
  appendDocumentText,
  listTaskLists,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  type AttaieDocumentCategory,
  type DriveFileItem,
  type SpreadsheetMetadata,
  type CalendarListEntry,
  type CalendarEventItem,
  type GoogleDocContent,
  type GoogleTaskList,
  type GoogleTaskItem,
} from '../lib/googleWorkspaceService';
import {
  adaptAdminProjectForSheet,
  createDesignatedCrmSpreadsheet,
  exportProjectInventoryToGoogleSheet,
  getDesignatedSheetConfig,
  saveDesignatedSheetConfig,
  type DesignatedSheetConfig,
} from '../lib/googleSheetsExportService';
import {
  syncCrmScheduleToAgentCalendar,
  type CrmCalendarScheduleType,
} from '../lib/googleCalendarSyncService';
import {
  getProperties,
  getProjects,
  getAllProjectUnits,
  getAgents,
  type Property,
  type Agent,
} from '../lib/dbService';

type WorkspaceModuleId = 'drive' | 'sheets' | 'calendar' | 'docs' | 'tasks';

interface ConfirmationModalState {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => Promise<void>;
}

const DOCUMENT_CATEGORY_LABELS: Record<AttaieDocumentCategory, string> = {
  brochure: 'Property Brochure',
  architectural: 'Architectural Document',
  contract: 'Sales Contract / Deed',
  other: 'General Document',
};

const MODULES: {
  id: WorkspaceModuleId;
  label: string;
  shortTag: string;
  subtitle: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'drive',
    label: 'Google Drive',
    shortTag: 'Brochures & Plans',
    subtitle: `Upload and manage property brochures and architectural documents in the '${ATTAIE_DRIVE_FOLDER_NAME}' Drive folder.`,
    icon: FolderOpen,
  },
  {
    id: 'sheets',
    label: 'Google Sheets',
    shortTag: 'Inventory Sync',
    subtitle: 'Export project inventory updates and property catalogs into a designated Google Sheet.',
    icon: Table2,
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    shortTag: 'Agent Sync',
    subtitle: 'Create and synchronize property visits and lead follow-ups onto the assigned agent calendar.',
    icon: Calendar,
  },
  {
    id: 'docs',
    label: 'Google Docs',
    shortTag: 'Agreements',
    subtitle: 'Read, draft, and update property brochures and sales agreement documents.',
    icon: FileText,
  },
  {
    id: 'tasks',
    label: 'Google Tasks',
    shortTag: 'To-Dos',
    subtitle: 'Track agent follow-ups, document verifications, and closing checklists.',
    icon: CheckSquare,
  },
];

function GoogleSignInButton({
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
      className="gsi-material-button inline-flex items-center justify-center rounded-md border border-[#747775] bg-white px-4 py-2.5 text-sm font-medium text-[#1f1f1f] shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="gsi-material-button-state" />
      <div className="gsi-material-button-content-wrapper flex items-center gap-3">
        <div className="gsi-material-button-icon h-5 w-5 shrink-0">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block', width: '20px', height: '20px' }}
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
        <span className="gsi-material-button-contents font-semibold">{label}</span>
        <span style={{ display: 'none' }}>{label}</span>
      </div>
    </button>
  );
}

export default function GoogleWorkspacePage() {
  const [activeModule, setActiveModule] = useState<WorkspaceModuleId>('drive');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // 1. Drive state ('Attaie Properties' folder)
  const [attaieFolder, setAttaieFolder] = useState<DriveFileItem | null>(null);
  const [driveScope, setDriveScope] = useState<'attaie' | 'all'>('attaie');
  const [driveCategoryFilter, setDriveCategoryFilter] = useState<AttaieDocumentCategory | 'all'>('all');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<AttaieDocumentCategory>('brochure');
  const [uploadProjectRef, setUploadProjectRef] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  // 2. Sheets state (Designated CRM Export)
  const [spreadsheets, setSpreadsheets] = useState<DriveFileItem[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [designatedConfig, setDesignatedConfig] = useState<DesignatedSheetConfig | null>(() =>
    getDesignatedSheetConfig()
  );
  const [sheetMeta, setSheetMeta] = useState<SpreadsheetMetadata | null>(null);
  const [selectedTabTitle, setSelectedTabTitle] = useState('');
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [newSheetTitle, setNewSheetTitle] = useState('Attaie Properties — Sales & Project Inventory');
  const [appendCellNote, setAppendCellNote] = useState('');

  // 3. Calendar state (Agent Sync)
  const [agents, setAgents] = useState<Agent[]>([]);
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [scheduleType, setScheduleType] = useState<CrmCalendarScheduleType>('visit');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [assignedAgentEmail, setAssignedAgentEmail] = useState('');
  const [assignedAgentName, setAssignedAgentName] = useState('');
  const [eventLocation, setEventLocation] = useState('Street 13, Wazir Akbar Khan, Kabul');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStart, setEventStart] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventSummary, setEditEventSummary] = useState('');

  // 4. Docs state
  const [documents, setDocuments] = useState<DriveFileItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [docContent, setDocContent] = useState<GoogleDocContent | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('Attaie Properties — Client Property Dossier');
  const [newDocBody, setNewDocBody] = useState(
    'ATTAIE PROPERTIES KABUL\nProperty Dossier & Viewing Summary\n\nPrepared for client consultation.'
  );
  const [appendDocText, setAppendDocText] = useState('');

  // 5. Tasks state
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState('');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

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

  useEffect(() => {
    getAgents()
      .then((list) => setAgents(Array.isArray(list) ? list : []))
      .catch(() => {
        // optional if backend offline
      });
  }, []);

  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof WorkspaceAuthError) {
      setNeedsAuth(true);
      setError('Please sign in with Google to authorize Google Workspace access.');
      return;
    }
    setError(err instanceof Error ? err.message : 'An unexpected Google Workspace error occurred.');
  }, []);

  const loadActiveModuleData = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (activeModule === 'drive') {
        if (driveScope === 'attaie') {
          const { folder, files } = await listAttaieFolderDocuments({
            folderId: attaieFolder?.id,
            category: driveCategoryFilter,
            searchQuery: driveSearch,
          });
          setAttaieFolder(folder);
          setDriveFiles(files);
        } else {
          const files = await listDriveFiles({ searchQuery: driveSearch });
          setDriveFiles(files);
        }
      } else if (activeModule === 'sheets') {
        const sheetsList = await listUserSpreadsheets();
        setSpreadsheets(sheetsList);
        const preferredId =
          selectedSpreadsheetId ||
          designatedConfig?.spreadsheetId ||
          sheetsList[0]?.id ||
          '';
        if (preferredId) {
          setSelectedSpreadsheetId(preferredId);
          const meta = await getSpreadsheetMetadata(preferredId);
          setSheetMeta(meta);
          const firstTab = meta.sheets[0]?.title || '';
          const activeTab =
            selectedTabTitle && meta.sheets.some((s) => s.title === selectedTabTitle)
              ? selectedTabTitle
              : firstTab;
          setSelectedTabTitle(activeTab);
          if (activeTab) {
            const values = await getSheetValues(preferredId, activeTab);
            setSheetRows(values);
          }
        } else {
          setSheetMeta(null);
          setSheetRows([]);
        }
      } else if (activeModule === 'calendar') {
        const cals = await listCalendars();
        setCalendars(cals);
        const calId = selectedCalendarId || cals.find((c) => c.primary)?.id || 'primary';
        setSelectedCalendarId(calId);
        const evs = await listCalendarEvents(calId);
        setEvents(evs);
      } else if (activeModule === 'docs') {
        const docsList = await listUserDocuments();
        setDocuments(docsList);
        const targetDocId = selectedDocId || docsList[0]?.id || '';
        if (targetDocId) {
          setSelectedDocId(targetDocId);
          const detail = await getDocument(targetDocId);
          setDocContent(detail);
        } else {
          setDocContent(null);
        }
      } else if (activeModule === 'tasks') {
        const lists = await listTaskLists();
        setTaskLists(lists);
        const listId = selectedTaskListId || lists[0]?.id || '';
        if (listId) {
          setSelectedTaskListId(listId);
          const items = await listTasks(listId);
          setTasks(items);
        } else {
          setTasks([]);
        }
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [
    activeModule,
    driveScope,
    attaieFolder?.id,
    driveCategoryFilter,
    driveSearch,
    selectedSpreadsheetId,
    designatedConfig?.spreadsheetId,
    selectedTabTitle,
    selectedCalendarId,
    selectedDocId,
    selectedTaskListId,
    handleApiError,
  ]);

  useEffect(() => {
    if (!needsAuth) {
      void loadActiveModuleData();
    }
  }, [needsAuth, activeModule, loadActiveModuleData]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        setStatusMessage('Connected to Google Workspace.');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setAttaieFolder(null);
    setStatusMessage(null);
  };

  const requestConfirmation = (config: ConfirmationModalState) => {
    setConfirmModal(config);
  };

  const executeConfirmedAction = async () => {
    if (!confirmModal) return;
    setConfirmBusy(true);
    setError(null);
    try {
      await confirmModal.onConfirm();
      setConfirmModal(null);
    } catch (err) {
      handleApiError(err);
      setConfirmModal(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  // ── Drive handlers ──
  const handleUploadToAttaieFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setLoading(true);
    setError(null);
    try {
      const folder = attaieFolder || (await ensureAttaiePropertiesFolder());
      setAttaieFolder(folder);
      const created = await uploadDocumentToAttaieFolder(uploadFile, {
        folderId: folder.id,
        category: uploadCategory,
        projectRef: uploadProjectRef.trim(),
        description: uploadDescription.trim(),
        uploadedBy: user?.email || user?.displayName || 'Staff',
      });
      setUploadFile(null);
      setUploadProjectRef('');
      setUploadDescription('');
      setStatusMessage(
        `Uploaded "${created.name}" to the '${ATTAIE_DRIVE_FOLDER_NAME}' Google Drive folder.`
      );
      await loadActiveModuleData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const parentId =
        driveScope === 'attaie'
          ? (attaieFolder || (await ensureAttaiePropertiesFolder())).id
          : undefined;
      await createDriveFolder(newFolderName.trim(), parentId);
      setNewFolderName('');
      setStatusMessage(
        driveScope === 'attaie'
          ? `Created subfolder inside '${ATTAIE_DRIVE_FOLDER_NAME}'.`
          : 'Created folder in Google Drive.'
      );
      await loadActiveModuleData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameDriveFile = (file: DriveFileItem) => {
    const targetName = renameDraft.trim();
    if (!targetName || targetName === file.name) {
      setRenamingFileId(null);
      return;
    }
    requestConfirmation({
      title: 'Rename Google Drive File?',
      description: `Are you sure you want to rename "${file.name}" to "${targetName}" in Google Drive?`,
      confirmLabel: 'Confirm Rename',
      tone: 'primary',
      onConfirm: async () => {
        await renameDriveFile(file.id, targetName);
        setRenamingFileId(null);
        setStatusMessage(`Renamed file to "${targetName}".`);
        await loadActiveModuleData();
      },
    });
  };

  const handleDeleteDriveFile = (file: DriveFileItem) => {
    requestConfirmation({
      title: 'Delete File from Google Drive?',
      description: `Are you sure you want to permanently delete "${file.name}" from Google Drive? This action cannot be undone.`,
      confirmLabel: 'Delete File',
      tone: 'danger',
      onConfirm: async () => {
        await deleteDriveFile(file.id);
        setStatusMessage(`Deleted "${file.name}" from Google Drive.`);
        await loadActiveModuleData();
      },
    });
  };

  // ── Sheets handlers ──
  const handleCreateDesignatedMasterSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createDesignatedCrmSpreadsheet(newSheetTitle.trim());
      setDesignatedConfig(created);
      setSelectedSpreadsheetId(created.spreadsheetId);
      setStatusMessage(`Created & designated Google Sheet "${created.title}".`);
      await loadActiveModuleData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsDesignatedSheet = () => {
    if (!sheetMeta) return;
    const saved = saveDesignatedSheetConfig({
      spreadsheetId: sheetMeta.spreadsheetId,
      title: sheetMeta.title,
      spreadsheetUrl:
        sheetMeta.spreadsheetUrl ||
        `https://docs.google.com/spreadsheets/d/${sheetMeta.spreadsheetId}/edit`,
      leadsTab: 'Sales Leads',
      inventoryTab: 'Project Inventory',
    });
    setDesignatedConfig(saved);
    setStatusMessage(`Set "${saved.title}" as the designated CRM export sheet.`);
  };

  const handleExportProjectInventoryToDesignatedSheet = async () => {
    const targetId = designatedConfig?.spreadsheetId || selectedSpreadsheetId;
    if (!targetId) {
      setError('Create or select a designated Google Sheet first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [projects, unitsRes] = await Promise.all([
        getProjects().catch(() => []),
        getAllProjectUnits().catch(() => ({ items: [] })),
      ]);
      const adaptable = projects.map((proj) =>
        adaptAdminProjectForSheet(
          proj,
          (unitsRes.items || []).filter((u) => u.project_id === proj.id)
        )
      );
      const sheetName = designatedConfig?.title || sheetMeta?.title || 'Designated Sheet';
      const tabName = designatedConfig?.inventoryTab || 'Project Inventory';
      setLoading(false);

      requestConfirmation({
        title: 'Export Project Inventory to Google Sheets?',
        description: `This will update the "${tabName}" tab in "${sheetName}" with ${adaptable.length} project(s) and their unit inventory updates. Existing rows in that tab will be replaced.`,
        confirmLabel: 'Export Inventory',
        tone: 'primary',
        onConfirm: async () => {
          const result = await exportProjectInventoryToGoogleSheet({
            spreadsheetId: targetId,
            projects: adaptable,
            tabName,
          });
          setStatusMessage(
            `Exported ${result.projectCount} project(s) (${result.dataRowCount} row(s)) into "${result.spreadsheetTitle}" → "${result.tabTitle}".`
          );
          await loadActiveModuleData();
        },
      });
    } catch (err) {
      setLoading(false);
      handleApiError(err);
    }
  };

  const handleExportPropertiesToNewSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const properties = await getProperties();
      const rows: (string | number)[][] = [
        ['Serial', 'Title', 'Type', 'Listing', 'Price (USD)', 'Location', 'Beds', 'Baths', 'Area (sqm)', 'Status'],
        ...properties.map((p: Property) => [
          p.serial_number || `AP-${p.id}`,
          p.title,
          p.type,
          p.listing_type,
          p.price,
          p.location,
          p.beds ?? 0,
          p.baths ?? 0,
          p.area ?? 0,
          p.status,
        ]),
      ];
      const created = await createSpreadsheetWithData(
        `Attaie Properties Catalog (${new Date().toISOString().slice(0, 10)})`,
        'Properties',
        rows
      );
      setSelectedSpreadsheetId(created.spreadsheetId);
      setStatusMessage(`Exported ${properties.length} properties to new Google Sheet.`);
      await loadActiveModuleData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSheetHeaderNote = () => {
    if (!sheetMeta || !selectedTabTitle || !appendCellNote.trim()) return;
    const targetRowIndex = sheetRows.length + 1;
    const noteText = appendCellNote.trim();
    requestConfirmation({
      title: 'Update Google Sheet Data?',
      description: `Are you sure you want to write a new row at "${selectedTabTitle}!A${targetRowIndex}" in "${sheetMeta.title}"?`,
      confirmLabel: 'Update Spreadsheet',
      tone: 'primary',
      onConfirm: async () => {
        await updateSheetValues(sheetMeta.spreadsheetId, selectedTabTitle, `A${targetRowIndex}`, [
          [new Date().toISOString().slice(0, 10), noteText],
        ]);
        setAppendCellNote('');
        setStatusMessage(`Updated "${sheetMeta.title}" (${selectedTabTitle}).`);
        await loadActiveModuleData();
      },
    });
  };

  // ── Calendar handlers ──
  const handleScheduleAgentCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !eventStart) return;
    const targetDesc = assignedAgentEmail.trim()
      ? `${assignedAgentName || assignedAgentEmail} (${assignedAgentEmail})`
      : 'your primary Google Calendar';
    requestConfirmation({
      title: `Sync ${scheduleType === 'visit' ? 'Property Visit' : 'Lead Follow-up'} to Google Calendar?`,
      description: `Create a Google Calendar event for "${customerName.trim()}" at ${new Date(eventStart).toLocaleString()} and synchronize it with ${targetDesc}?`,
      confirmLabel: 'Create & Sync Event',
      tone: 'primary',
      onConfirm: async () => {
        const res = await syncCrmScheduleToAgentCalendar({
          scheduleType,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          propertyOrProject: eventLocation.trim(),
          scheduledAtIso: new Date(eventStart).toISOString(),
          notes: eventDescription.trim(),
          assignedAgentName: assignedAgentName.trim(),
          assignedAgentEmail: assignedAgentEmail.trim(),
          location: eventLocation.trim(),
        });
        setCustomerName('');
        setCustomerPhone('');
        setEventDescription('');
        setStatusMessage(
          `Synchronized ${scheduleType === 'visit' ? 'property visit' : 'follow-up'} to ${res.calendarSummary || 'Google Calendar'}${res.attendeeInvited ? ` and invited ${assignedAgentEmail}` : ''}.`
        );
        await loadActiveModuleData();
      },
    });
  };

  const handleUpdateCalendarEvent = (ev: CalendarEventItem) => {
    const nextTitle = editEventSummary.trim();
    if (!nextTitle) return;
    requestConfirmation({
      title: 'Modify Google Calendar Event?',
      description: `Are you sure you want to update the calendar event "${ev.summary || 'Untitled Event'}" to "${nextTitle}"?`,
      confirmLabel: 'Update Event',
      tone: 'primary',
      onConfirm: async () => {
        await updateCalendarEvent(selectedCalendarId, ev.id, { summary: nextTitle });
        setEditingEventId(null);
        setStatusMessage('Updated Google Calendar event.');
        await loadActiveModuleData();
      },
    });
  };

  const handleDeleteCalendarEvent = (ev: CalendarEventItem) => {
    requestConfirmation({
      title: 'Delete Google Calendar Event?',
      description: `Are you sure you want to delete the event "${ev.summary || 'Untitled Event'}" from your Google Calendar?`,
      confirmLabel: 'Delete Event',
      tone: 'danger',
      onConfirm: async () => {
        await deleteCalendarEvent(selectedCalendarId, ev.id);
        setStatusMessage('Deleted event from Google Calendar.');
        await loadActiveModuleData();
      },
    });
  };

  // ── Docs handlers ──
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createPropertyDocument(newDocTitle.trim(), newDocBody);
      setSelectedDocId(created.documentId);
      setStatusMessage('Created new Google Doc.');
      await loadActiveModuleData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendToDoc = () => {
    if (!docContent || !appendDocText.trim()) return;
    const textToInsert = appendDocText.trim();
    requestConfirmation({
      title: 'Update Google Doc Content?',
      description: `Are you sure you want to append new text to "${docContent.title}" in Google Docs?`,
      confirmLabel: 'Confirm Update',
      tone: 'primary',
      onConfirm: async () => {
        const updated = await appendDocumentText(docContent.documentId, textToInsert);
        setDocContent(updated);
        setAppendDocText('');
        setStatusMessage(`Updated document "${updated.title}".`);
      },
    });
  };

  // ── Tasks handlers ──
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskListId || !newTaskTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createTask(selectedTaskListId, {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
      });
      setNewTaskTitle('');
      setNewTaskNotes('');
      setStatusMessage('Created task in Google Tasks.');
      await loadActiveModuleData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = (task: GoogleTaskItem) => {
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    requestConfirmation({
      title: 'Update Google Task Status?',
      description: `Are you sure you want to mark "${task.title}" as ${nextStatus === 'completed' ? 'Completed' : 'Needs Action'}?`,
      confirmLabel: 'Update Task',
      tone: 'primary',
      onConfirm: async () => {
        await updateTask(selectedTaskListId, task.id, { status: nextStatus });
        setStatusMessage(`Updated task "${task.title}".`);
        await loadActiveModuleData();
      },
    });
  };

  const handleDeleteTask = (task: GoogleTaskItem) => {
    requestConfirmation({
      title: 'Delete Google Task?',
      description: `Are you sure you want to delete the task "${task.title}" from Google Tasks? This action cannot be undone.`,
      confirmLabel: 'Delete Task',
      tone: 'danger',
      onConfirm: async () => {
        await deleteTask(selectedTaskListId, task.id);
        setStatusMessage(`Deleted task "${task.title}".`);
        await loadActiveModuleData();
      },
    });
  };

  const currentModuleSpec = MODULES.find((m) => m.id === activeModule) || MODULES[0];

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-[#0F172A] antialiased">
      <Helmet>
        <title>Google Workspace Hub — Attaie Properties</title>
        <meta
          name="description"
          content="Manage Attaie Properties brochures & architectural documents in Google Drive, export CRM leads & project inventory to Google Sheets, and sync agent follow-ups & visits in Google Calendar."
        />
      </Helmet>

      {/* Mandatory Confirmation Modal for Mutating/Destructive Operations */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                  confirmModal.tone === 'danger'
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-slate-200 bg-slate-100 text-slate-900'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="workspace-confirm-title" className="text-base font-semibold text-[#0F172A]">
                  {confirmModal.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">
                  {confirmModal.description}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmModal(null)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => void executeConfirmedAction()}
                className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-xs font-semibold text-white ${
                  confirmModal.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0F172A] hover:bg-slate-800'
                }`}
              >
                {confirmBusy ? 'Processing…' : confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Option 2: Alabaster Architectural Split-Rail Sidebar */}
      <aside className="hidden md:flex shrink-0 border-r border-[#E2E8F0] bg-white">
        <div className="flex w-16 flex-col items-center border-r border-[#E2E8F0] bg-[#FBFBFD] py-3.5 gap-2">
          <a
            href="/"
            title="Back to Attaie Properties"
            aria-label="Back to Attaie Properties"
            className="mb-3 grid h-9 w-9 place-items-center rounded-md border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            <Building2 className="h-4 w-4" />
          </a>

          <div className="flex flex-1 flex-col items-center gap-1.5">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  title={mod.label}
                  aria-label={mod.label}
                  className={`grid h-10 w-10 place-items-center rounded-md transition ${
                    active
                      ? 'bg-[#0F172A] text-white'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-56 flex-col bg-white">
          <div className="border-b border-[#E2E8F0] px-4 py-3.5">
            <div className="text-[11px] font-medium text-[#64748B]">Attaie Properties</div>
            <div className="text-sm font-semibold text-[#0F172A]">Google Workspace</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 pb-1 text-[11px] font-medium text-[#64748B]">
              Connected Services
            </div>
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? 'bg-[#F1F5F9] font-semibold text-[#0F172A]'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{mod.label}</span>
                  </span>
                  <span className="text-[10px] text-[#64748B]">{mod.shortTag}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#E2E8F0] p-3">
            {user && !needsAuth ? (
              <div className="space-y-2">
                <div className="truncate text-xs font-semibold text-[#0F172A]">
                  {user.displayName || user.email}
                </div>
                <div className="truncate text-[11px] text-[#64748B]">{user.email}</div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-[#64748B]">Not signed in</div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-xs">
            <a
              href="/"
              className="inline-flex items-center gap-1 font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Website</span>
            </a>
            <span className="text-slate-300">/</span>
            <span className="text-[#64748B]">Google Workspace</span>
            <span className="text-slate-300">/</span>
            <strong className="font-semibold text-[#0F172A]">{currentModuleSpec.label}</strong>
          </div>

          <div className="flex md:hidden items-center gap-1 overflow-x-auto">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className={`rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                  activeModule === mod.id
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {mod.shortTag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {!needsAuth && (
              <button
                type="button"
                onClick={() => void loadActiveModuleData()}
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
            <a
              href="/admin"
              className="inline-flex h-8 items-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-medium text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              Admin CRM
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Google Workspace Integration
              </div>
              <h1 className="mt-1 text-lg font-bold text-[#0F172A]">{currentModuleSpec.label}</h1>
              <p className="mt-0.5 text-xs text-[#64748B]">{currentModuleSpec.subtitle}</p>
            </div>
            {needsAuth ? (
              <GoogleSignInButton
                onClick={() => void handleLogin()}
                disabled={isLoggingIn}
                label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
              />
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                <Check className="h-3.5 w-3.5" />
                <span>Authorized ({user?.email})</span>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-800"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {statusMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 flex items-center justify-between gap-3">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-emerald-600 hover:text-emerald-900"
                aria-label="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {needsAuth ? (
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center space-y-4">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Connect Your Google Workspace Account
                </h2>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Sign in with Google to upload brochures &amp; architectural plans to the
                  &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo; Drive folder, export leads &amp;
                  inventory to Google Sheets, and sync visits &amp; follow-ups with agent calendars.
                </p>
              </div>
              <div className="pt-2">
                <GoogleSignInButton
                  onClick={() => void handleLogin()}
                  disabled={isLoggingIn}
                  label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
                />
              </div>
            </div>
          ) : (
            <>
              {/* 1. GOOGLE DRIVE MODULE ('Attaie Properties' Folder) */}
              {activeModule === 'drive' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <div className="space-y-4">
                    <form
                      onSubmit={(e) => void handleUploadToAttaieFolder(e)}
                      className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-[#0F172A]">
                          Upload to &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo;
                        </h2>
                        {attaieFolder?.webViewLink && (
                          <a
                            href={attaieFolder.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A]"
                          >
                            <span>Open Folder</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Upload PDF property brochures, CAD/PDF architectural plans, 3D renders, or
                        contracts directly into the dedicated Drive folder.
                      </p>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#64748B]">
                          Document Category
                        </label>
                        <select
                          value={uploadCategory}
                          onChange={(e) =>
                            setUploadCategory(e.target.value as AttaieDocumentCategory)
                          }
                          className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A]"
                        >
                          <option value="brochure">Property Brochure</option>
                          <option value="architectural">Architectural Document / Plan</option>
                          <option value="contract">Sales Contract / Deed</option>
                          <option value="other">Other Document</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#64748B]">
                          Property / Project Reference
                        </label>
                        <input
                          type="text"
                          value={uploadProjectRef}
                          onChange={(e) => setUploadProjectRef(e.target.value)}
                          placeholder="e.g. AP-101 or Tower B"
                          className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#64748B]">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          placeholder="Revision v2, floor plan notes…"
                          className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#64748B]">
                          Select File (PDF, CAD, Image, Doc)
                        </label>
                        <input
                          type="file"
                          required
                          accept=".pdf,.doc,.docx,.dwg,.dxf,.png,.jpg,.jpeg,.webp,.ppt,.pptx"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-[#64748B] file:mr-2 file:rounded-md file:border file:border-[#E2E8F0] file:bg-[#F8FAFC] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0F172A]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !uploadFile}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload to &lsquo;{ATTAIE_DRIVE_FOLDER_NAME}&rsquo;</span>
                      </button>
                    </form>

                    <form
                      onSubmit={(e) => void handleCreateFolder(e)}
                      className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3"
                    >
                      <h3 className="text-sm font-semibold text-[#0F172A]">Create Subfolder</h3>
                      <input
                        type="text"
                        required
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g. Qala-e-Fatullah Tower Plans"
                        className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A]"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Folder</span>
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-[#0F172A]">
                          {driveScope === 'attaie'
                            ? `${ATTAIE_DRIVE_FOLDER_NAME} Documents (${driveFiles.length})`
                            : `All Google Drive Files (${driveFiles.length})`}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDriveScope('attaie')}
                            className={`rounded border px-2 py-1 text-[11px] font-semibold ${
                              driveScope === 'attaie'
                                ? 'border-[#0F172A] bg-[#0F172A] text-white'
                                : 'border-[#E2E8F0] bg-white text-[#64748B]'
                            }`}
                          >
                            {ATTAIE_DRIVE_FOLDER_NAME} Folder
                          </button>
                          <button
                            type="button"
                            onClick={() => setDriveScope('all')}
                            className={`rounded border px-2 py-1 text-[11px] font-semibold ${
                              driveScope === 'all'
                                ? 'border-[#0F172A] bg-[#0F172A] text-white'
                                : 'border-[#E2E8F0] bg-white text-[#64748B]'
                            }`}
                          >
                            All Drive
                          </button>
                          {driveScope === 'attaie' &&
                            (
                              [
                                ['all', 'All Types'],
                                ['brochure', 'Brochures'],
                                ['architectural', 'Architectural'],
                                ['contract', 'Contracts'],
                              ] as const
                            ).map(([catKey, catLabel]) => (
                              <button
                                key={catKey}
                                type="button"
                                onClick={() => setDriveCategoryFilter(catKey)}
                                className={`rounded border px-2 py-1 text-[11px] font-medium ${
                                  driveCategoryFilter === catKey
                                    ? 'border-[#0F172A] bg-[#F1F5F9] text-[#0F172A]'
                                    : 'border-[#E2E8F0] bg-white text-[#64748B]'
                                }`}
                              >
                                {catLabel}
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={driveSearch}
                            onChange={(e) => setDriveSearch(e.target.value)}
                            placeholder="Search files…"
                            className="rounded-md border border-[#E2E8F0] pl-8 pr-3 py-1.5 text-xs text-[#0F172A]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void loadActiveModuleData()}
                          className="rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-xs font-medium hover:bg-[#F1F5F9]"
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0]">
                      {driveFiles.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#64748B]">
                          No files found in{' '}
                          {driveScope === 'attaie'
                            ? `the '${ATTAIE_DRIVE_FOLDER_NAME}' folder`
                            : 'Google Drive'}
                          . Upload a property brochure or architectural document to get started.
                        </div>
                      ) : (
                        driveFiles.map((file) => {
                          const cat = file.appProperties?.attaieCategory as
                            | AttaieDocumentCategory
                            | undefined;
                          const projRef = file.appProperties?.projectRef;
                          return (
                            <div
                              key={file.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                {renamingFileId === file.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={renameDraft}
                                      onChange={(e) => setRenameDraft(e.target.value)}
                                      className="rounded border border-[#E2E8F0] px-2 py-1 text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRenameDriveFile(file)}
                                      className="rounded bg-[#0F172A] px-2.5 py-1 text-white font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRenamingFileId(null)}
                                      className="rounded border border-[#E2E8F0] px-2 py-1"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-semibold text-[#0F172A] truncate">
                                        {file.name}
                                      </span>
                                      {cat && (
                                        <span className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-semibold text-[#0F172A]">
                                          {DOCUMENT_CATEGORY_LABELS[cat] || cat}
                                        </span>
                                      )}
                                      {projRef && (
                                        <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-[#475569]">
                                          Ref: {projRef}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#64748B] tabular-nums">
                                      {file.mimeType.replace('application/vnd.google-apps.', 'google-')}
                                      {file.modifiedTime
                                        ? ` · Updated ${new Date(file.modifiedTime).toLocaleDateString()}`
                                        : ''}
                                      {file.description ? ` · ${file.description}` : ''}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] px-2 text-[11px] font-medium hover:bg-[#F1F5F9]"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Open</span>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenamingFileId(file.id);
                                    setRenameDraft(file.name);
                                  }}
                                  className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] px-2 text-[11px] font-medium hover:bg-[#F1F5F9]"
                                  aria-label={`Rename ${file.name}`}
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDriveFile(file)}
                                  className="inline-flex h-7 items-center gap-1 rounded border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-600 hover:bg-red-100"
                                  aria-label={`Delete ${file.name}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. GOOGLE SHEETS MODULE (Designated CRM Export) */}
              {activeModule === 'sheets' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
                      <h2 className="text-sm font-semibold text-[#0F172A]">
                        Designated CRM Google Sheet
                      </h2>
                      {designatedConfig ? (
                        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1.5 text-xs">
                          <div className="font-semibold text-[#0F172A] truncate">
                            {designatedConfig.title}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            Tabs: {designatedConfig.leadsTab} · {designatedConfig.inventoryTab}
                          </div>
                          <a
                            href={designatedConfig.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F172A] underline"
                          >
                            <span>Open in Google Sheets</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B]">
                          Create a new designated spreadsheet or select an existing one to sync
                          project inventory updates and sales leads.
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={loading || (!designatedConfig && !selectedSpreadsheetId)}
                        onClick={() => void handleExportProjectInventoryToDesignatedSheet()}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        <Table2 className="h-3.5 w-3.5" />
                        <span>Export Project Inventory Updates</span>
                      </button>

                      {sheetMeta &&
                        designatedConfig?.spreadsheetId !== sheetMeta.spreadsheetId && (
                          <button
                            type="button"
                            onClick={handleSetAsDesignatedSheet}
                            className="inline-flex w-full items-center justify-center rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
                          >
                            Use &ldquo;{sheetMeta.title}&rdquo; as Designated Sheet
                          </button>
                        )}
                    </div>

                    <form
                      onSubmit={(e) => void handleCreateDesignatedMasterSheet(e)}
                      className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3"
                    >
                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        Create Master CRM Sheet
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Creates a dedicated sheet with &lsquo;Sales Leads&rsquo; and &lsquo;Project
                        Inventory&rsquo; tabs.
                      </p>
                      <input
                        type="text"
                        required
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Designated CRM Sheet</span>
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleExportPropertiesToNewSheet()}
                        className="inline-flex w-full items-center justify-center rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                      >
                        Quick Export Public Properties to New Sheet
                      </button>
                    </form>

                    {sheetMeta && (
                      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-[#0F172A]">
                          Append Note Row (Requires Confirmation)
                        </h3>
                        <input
                          type="text"
                          value={appendCellNote}
                          onChange={(e) => setAppendCellNote(e.target.value)}
                          placeholder="Enter audit note or property row summary…"
                          className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleUpdateSheetHeaderNote}
                          disabled={!appendCellNote.trim()}
                          className="inline-flex w-full items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-50"
                        >
                          Append Row to Active Tab
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#64748B]">
                          Select Spreadsheet
                        </label>
                        <select
                          value={selectedSpreadsheetId}
                          onChange={(e) => {
                            setSelectedSpreadsheetId(e.target.value);
                            setSelectedTabTitle('');
                          }}
                          className="rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A]"
                        >
                          {spreadsheets.length === 0 && (
                            <option value="">No spreadsheets found</option>
                          )}
                          {spreadsheets.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {sheetMeta && sheetMeta.sheets.length > 0 && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-[#64748B]">
                            Sheet Tab (Dynamic Metadata)
                          </label>
                          <select
                            value={selectedTabTitle}
                            onChange={(e) => setSelectedTabTitle(e.target.value)}
                            className="rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A]"
                          >
                            {sheetMeta.sheets.map((tab) => (
                              <option key={tab.sheetId} value={tab.title}>
                                {tab.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-[#E2E8F0] rounded-md">
                      {sheetRows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#64748B]">
                          No rows in the selected sheet tab, or no spreadsheet selected.
                        </div>
                      ) : (
                        <table className="w-full border-collapse text-left text-xs tabular-nums">
                          <thead>
                            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                              {sheetRows[0].map((cell, i) => (
                                <th key={i} className="px-3 py-2 font-semibold text-[#0F172A]">
                                  {cell || `Col ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E8F0]">
                            {sheetRows.slice(1, 25).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                {sheetRows[0].map((_, cIdx) => (
                                  <td key={cIdx} className="px-3 py-2 text-slate-700">
                                    {row[cIdx] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. GOOGLE CALENDAR MODULE (Agent Calendar Sync) */}
              {activeModule === 'calendar' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <form
                    onSubmit={handleScheduleAgentCalendarEvent}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3 h-fit"
                  >
                    <h2 className="text-sm font-semibold text-[#0F172A]">
                      Sync Lead Follow-Up / Visit to Agent Calendar
                    </h2>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Schedule Type
                      </label>
                      <select
                        value={scheduleType}
                        onChange={(e) =>
                          setScheduleType(e.target.value as CrmCalendarScheduleType)
                        }
                        className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs"
                      >
                        <option value="visit">Property Visit (60 min)</option>
                        <option value="followup">Lead Follow-up (30 min)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ahmad Shah"
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Customer Phone
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="078..."
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    {agents.length > 0 && (
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-[#64748B]">
                          Quick-Fill Assigned Agent
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const found = agents.find((a) => String(a.id) === e.target.value);
                            if (found) {
                              setAssignedAgentName(found.name);
                              setAssignedAgentEmail(found.email);
                            }
                          }}
                          className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs"
                        >
                          <option value="">Choose an agency advisor…</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-[#64748B]">
                          Agent Name
                        </label>
                        <input
                          type="text"
                          value={assignedAgentName}
                          onChange={(e) => setAssignedAgentName(e.target.value)}
                          placeholder="Assigned agent"
                          className="w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B]">
                          Agent Email
                        </label>
                        <input
                          type="email"
                          value={assignedAgentEmail}
                          onChange={(e) => setAssignedAgentEmail(e.target.value)}
                          placeholder="agent@attaieproperties.com"
                          className="w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Property / Location
                      </label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Scheduled Date &amp; Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        className="w-full rounded-md border border-[#E2E8F0] px-2.5 py-1.5 text-xs tabular-nums"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">Notes</label>
                      <textarea
                        rows={2}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Client requirements or gate instructions…"
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Sync to Assigned Agent Calendar</span>
                    </button>
                  </form>

                  <div className="lg:col-span-2 rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-[#0F172A]">
                        Upcoming Calendar Events ({events.length})
                      </h2>
                      <select
                        value={selectedCalendarId}
                        onChange={(e) => setSelectedCalendarId(e.target.value)}
                        aria-label="Select Google Calendar"
                        className="rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs"
                      >
                        {calendars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.summary} {c.primary ? '(Primary)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0]">
                      {events.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#64748B]">
                          No upcoming events found in this calendar.
                        </div>
                      ) : (
                        events.map((ev) => {
                          const startStr = ev.start?.dateTime || ev.start?.date || '';
                          return (
                            <div
                              key={ev.id}
                              className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                {editingEventId === ev.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editEventSummary}
                                      onChange={(e) => setEditEventSummary(e.target.value)}
                                      className="rounded border border-[#E2E8F0] px-2 py-1 text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCalendarEvent(ev)}
                                      className="rounded bg-[#0F172A] px-2.5 py-1 text-white font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingEventId(null)}
                                      className="rounded border border-[#E2E8F0] px-2 py-1"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-semibold text-[#0F172A]">
                                      {ev.summary || '(No title)'}
                                    </div>
                                    <div className="text-[11px] text-[#64748B] tabular-nums">
                                      {startStr ? new Date(startStr).toLocaleString() : 'All day'}
                                      {ev.location ? ` · ${ev.location}` : ''}
                                      {ev.attendees?.length
                                        ? ` · Agent: ${ev.attendees.map((a) => a.email).join(', ')}`
                                        : ''}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {ev.htmlLink && (
                                  <a
                                    href={ev.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] px-2 text-[11px] font-medium hover:bg-[#F1F5F9]"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View</span>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEventId(ev.id);
                                    setEditEventSummary(ev.summary || '');
                                  }}
                                  className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] px-2 text-[11px] font-medium hover:bg-[#F1F5F9]"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCalendarEvent(ev)}
                                  className="inline-flex h-7 items-center gap-1 rounded border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-600 hover:bg-red-100"
                                  aria-label="Delete event"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. GOOGLE DOCS MODULE */}
              {activeModule === 'docs' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <form
                    onSubmit={(e) => void handleCreateDoc(e)}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3 h-fit"
                  >
                    <h2 className="text-sm font-semibold text-[#0F172A]">
                      Create Property Agreement / Dossier Doc
                    </h2>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Document Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">
                        Initial Content
                      </label>
                      <textarea
                        rows={4}
                        value={newDocBody}
                        onChange={(e) => setNewDocBody(e.target.value)}
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Google Doc</span>
                    </button>
                  </form>

                  <div className="lg:col-span-2 rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#64748B]">
                          Select Google Doc
                        </label>
                        <select
                          value={selectedDocId}
                          onChange={(e) => setSelectedDocId(e.target.value)}
                          className="rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A]"
                        >
                          {documents.length === 0 && <option value="">No documents found</option>}
                          {documents.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {docContent ? (
                      <div className="space-y-4">
                        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                          <div className="text-xs font-semibold text-[#0F172A] mb-2">
                            {docContent.title}
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 max-h-64 overflow-y-auto">
                            {docContent.plainText || '(Empty document)'}
                          </pre>
                        </div>

                        <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
                          <label className="block text-xs font-semibold text-[#0F172A]">
                            Append Clause or Note to Document (Requires Confirmation)
                          </label>
                          <textarea
                            rows={2}
                            value={appendDocText}
                            onChange={(e) => setAppendDocText(e.target.value)}
                            placeholder="Enter clause or inspection note to append…"
                            className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAppendToDoc}
                            disabled={!appendDocText.trim()}
                            className="inline-flex items-center justify-center rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            Append to Google Doc
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-[#64748B]">
                        Select or create a Google Doc to inspect its content.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. GOOGLE TASKS MODULE */}
              {activeModule === 'tasks' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <form
                    onSubmit={(e) => void handleCreateTask(e)}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3 h-fit"
                  >
                    <h2 className="text-sm font-semibold text-[#0F172A]">Add Follow-Up Task</h2>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">Task List</label>
                      <select
                        value={selectedTaskListId}
                        onChange={(e) => setSelectedTaskListId(e.target.value)}
                        className="w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs"
                      >
                        {taskLists.map((tl) => (
                          <option key={tl.id} value={tl.id}>
                            {tl.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">Task Title</label>
                      <input
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="e.g. Verify Qawala Deed for AP-104"
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#64748B]">Notes</label>
                      <textarea
                        rows={2}
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        placeholder="Client contact details or branch instructions…"
                        className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create in Google Tasks</span>
                    </button>
                  </form>

                  <div className="lg:col-span-2 rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[#0F172A]">
                      Tasks ({tasks.length})
                    </h2>
                    <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0]">
                      {tasks.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#64748B]">
                          No tasks in this list.
                        </div>
                      ) : (
                        tasks.map((task) => {
                          const done = task.status === 'completed';
                          return (
                            <div
                              key={task.id}
                              className="flex items-center justify-between gap-3 py-3 text-xs"
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTaskStatus(task)}
                                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                                    done
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                  aria-label={`Toggle completion for ${task.title}`}
                                >
                                  {done && <Check className="h-3 w-3" />}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={`font-semibold ${
                                      done ? 'line-through text-[#64748B]' : 'text-[#0F172A]'
                                    }`}
                                  >
                                    {task.title}
                                  </div>
                                  {task.notes && (
                                    <div className="text-[11px] text-[#64748B] mt-0.5">
                                      {task.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                className="inline-flex h-7 items-center gap-1 rounded border border-red-200 bg-red-50 px-2 text-[11px] font-medium text-red-600 hover:bg-red-100"
                                aria-label={`Delete ${task.title}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
