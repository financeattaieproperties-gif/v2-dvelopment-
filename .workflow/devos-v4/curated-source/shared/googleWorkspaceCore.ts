import { getAccessToken } from './googleWorkspaceAuth';

export const ATTAIE_DRIVE_FOLDER_NAME = 'Attaie Properties';

export type AttaieDocumentCategory = 'brochure' | 'architectural' | 'contract' | 'other';

export class WorkspaceAuthError extends Error {
  constructor(message = 'Google Workspace authentication required.') {
    super(message);
    this.name = 'WorkspaceAuthError';
  }
}

export async function workspaceFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new WorkspaceAuthError();
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof Blob) && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    let detail = 'Google Workspace authorization expired or lacks permission.';
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) {
        detail = errJson.error.message;
      }
    } catch {
      // ignore parse error
    }
    if (res.status === 401) {
      throw new WorkspaceAuthError(detail);
    }
    throw new Error(detail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = `Google API Error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Google Drive API (https://www.googleapis.com/drive/v3)
// ─────────────────────────────────────────────────────────────────────────────

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  description?: string;
  parents?: string[];
  appProperties?: Record<string, string>;
}

const DRIVE_FILE_FIELDS =
  'id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink,description,parents,appProperties';

export async function listDriveFiles(options?: {
  searchQuery?: string;
  mimeType?: string;
  parentFolderId?: string;
  pageSize?: number;
}): Promise<DriveFileItem[]> {
  const clauses = ['trashed = false'];
  if (options?.parentFolderId) {
    clauses.push(`'${options.parentFolderId.replace(/'/g, "\\'")}' in parents`);
  }
  if (options?.mimeType) {
    clauses.push(`mimeType = '${options.mimeType.replace(/'/g, "\\'")}'`);
  }
  if (options?.searchQuery?.trim()) {
    const safe = options.searchQuery.trim().replace(/'/g, "\\'");
    clauses.push(`name contains '${safe}'`);
  }
  const params = new URLSearchParams({
    q: clauses.join(' and '),
    pageSize: String(options?.pageSize || 50),
    orderBy: 'modifiedTime desc',
    fields: `files(${DRIVE_FILE_FIELDS})`,
  });
  const data = await workspaceFetch<{ files?: DriveFileItem[] }>(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`
  );
  return data.files || [];
}

export async function createDriveFolder(
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const payload: Record<string, unknown> = {
    name: folderName.trim(),
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    payload.parents = [parentFolderId];
  }
  return workspaceFetch<DriveFileItem>(
    `https://www.googleapis.com/drive/v3/files?fields=${encodeURIComponent(DRIVE_FILE_FIELDS)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Finds the dedicated 'Attaie Properties' folder in Google Drive or creates it if missing.
 */
export async function ensureAttaiePropertiesFolder(): Promise<DriveFileItem> {
  const params = new URLSearchParams({
    q: `name = '${ATTAIE_DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    pageSize: '10',
    orderBy: 'createdTime asc',
    fields: `files(${DRIVE_FILE_FIELDS})`,
  });
  const data = await workspaceFetch<{ files?: DriveFileItem[] }>(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`
  );
  const existing = data.files?.[0];
  if (existing) {
    return existing;
  }
  return createDriveFolder(ATTAIE_DRIVE_FOLDER_NAME);
}

export async function listAttaieFolderDocuments(options?: {
  folderId?: string;
  category?: AttaieDocumentCategory | 'all';
  searchQuery?: string;
}): Promise<{ folder: DriveFileItem; files: DriveFileItem[] }> {
  const folder = options?.folderId
    ? { id: options.folderId, name: ATTAIE_DRIVE_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }
    : await ensureAttaiePropertiesFolder();

  const files = await listDriveFiles({
    parentFolderId: folder.id,
    searchQuery: options?.searchQuery,
    pageSize: 100,
  });

  const filtered =
    options?.category && options.category !== 'all'
      ? files.filter((f) => f.appProperties?.attaieCategory === options.category)
      : files;

  return { folder, files: filtered };
}

export function buildDriveUploadMetadata(options: {
  fileName: string;
  mimeType: string;
  folderId: string;
  category: AttaieDocumentCategory;
  projectRef?: string;
  description?: string;
  uploadedBy?: string;
}) {
  const appProperties: Record<string, string> = {
    attaieCategory: options.category,
  };
  if (options.projectRef?.trim()) {
    appProperties.projectRef = options.projectRef.trim();
  }
  if (options.uploadedBy?.trim()) {
    appProperties.uploadedBy = options.uploadedBy.trim();
  }
  return {
    name: options.fileName.trim(),
    mimeType: options.mimeType || 'application/octet-stream',
    parents: [options.folderId],
    description: options.description?.trim() || undefined,
    appProperties,
  };
}

export async function uploadDocumentToAttaieFolder(
  file: File,
  options: {
    category: AttaieDocumentCategory;
    projectRef?: string;
    description?: string;
    uploadedBy?: string;
    folderId?: string;
    customFileName?: string;
  }
): Promise<DriveFileItem> {
  const folder = options.folderId
    ? { id: options.folderId }
    : await ensureAttaiePropertiesFolder();

  const mimeType = file.type || 'application/octet-stream';
  const metadata = buildDriveUploadMetadata({
    fileName: options.customFileName?.trim() || file.name,
    mimeType,
    folderId: folder.id,
    category: options.category,
    projectRef: options.projectRef,
    description: options.description,
    uploadedBy: options.uploadedBy,
  });

  const boundary = `attaie_drive_boundary_${Date.now().toString(36)}`;
  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const closingPart = `\r\n--${boundary}--`;

  const multipartBlob = new Blob([metadataPart, file, closingPart], {
    type: `multipart/related; boundary=${boundary}`,
  });

  return workspaceFetch<DriveFileItem>(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${encodeURIComponent(DRIVE_FILE_FIELDS)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    }
  );
}

export async function renameDriveFile(fileId: string, newName: string): Promise<DriveFileItem> {
  return workspaceFetch<DriveFileItem>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(DRIVE_FILE_FIELDS)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ name: newName.trim() }),
    }
  );
}

export async function updateDriveDocumentMetadata(
  fileId: string,
  patch: {
    name?: string;
    description?: string;
    category?: AttaieDocumentCategory;
    projectRef?: string;
  }
): Promise<DriveFileItem> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.description !== undefined) payload.description = patch.description.trim();
  if (patch.category !== undefined || patch.projectRef !== undefined) {
    payload.appProperties = {
      ...(patch.category ? { attaieCategory: patch.category } : {}),
      ...(patch.projectRef !== undefined ? { projectRef: patch.projectRef.trim() } : {}),
    };
  }
  return workspaceFetch<DriveFileItem>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(DRIVE_FILE_FIELDS)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  await workspaceFetch<void>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Google Sheets API (https://sheets.googleapis.com/v4)
// ─────────────────────────────────────────────────────────────────────────────

export interface SpreadsheetTabInfo {
  sheetId: number;
  title: string;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl?: string;
  sheets: SpreadsheetTabInfo[];
}

export async function listUserSpreadsheets(): Promise<DriveFileItem[]> {
  return listDriveFiles({
    mimeType: 'application/vnd.google-apps.spreadsheet',
    pageSize: 30,
  });
}

export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<SpreadsheetMetadata> {
  const raw = await workspaceFetch<{
    spreadsheetId: string;
    spreadsheetUrl?: string;
    properties?: { title?: string };
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }>;
  }>(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);

  return {
    spreadsheetId: raw.spreadsheetId,
    title: raw.properties?.title || 'Untitled Spreadsheet',
    spreadsheetUrl: raw.spreadsheetUrl,
    sheets: (raw.sheets || []).map((s, idx) => ({
      sheetId: s.properties?.sheetId ?? idx,
      title: s.properties?.title || `Tab ${idx + 1}`,
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

export async function getSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  cellRange = 'A1:Z50'
): Promise<string[][]> {
  const safeSheet = `'${sheetTitle.replace(/'/g, "''")}'`;
  const range = `${safeSheet}!${cellRange}`;
  const data = await workspaceFetch<{ values?: string[][] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`
  );
  return data.values || [];
}

export async function createSpreadsheetWithTabs(
  title: string,
  tabTitles: string[]
): Promise<SpreadsheetMetadata> {
  const cleanTabs = tabTitles.map((t) => t.trim()).filter(Boolean);
  const raw = await workspaceFetch<{
    spreadsheetId: string;
    spreadsheetUrl?: string;
    properties?: { title?: string };
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }>;
  }>('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: title.trim() },
      sheets: (cleanTabs.length ? cleanTabs : ['Data']).map((t) => ({
        properties: { title: t },
      })),
    }),
  });

  return {
    spreadsheetId: raw.spreadsheetId,
    title: raw.properties?.title || title.trim(),
    spreadsheetUrl: raw.spreadsheetUrl,
    sheets: (raw.sheets || []).map((s, idx) => ({
      sheetId: s.properties?.sheetId ?? idx,
      title: s.properties?.title || cleanTabs[idx] || `Tab ${idx + 1}`,
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

export async function addSpreadsheetTab(
  spreadsheetId: string,
  tabTitle: string
): Promise<SpreadsheetTabInfo> {
  const res = await workspaceFetch<{
    replies?: Array<{
      addSheet?: {
        properties?: {
          sheetId?: number;
          title?: string;
          gridProperties?: { rowCount?: number; columnCount?: number };
        };
      };
    }>;
  }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabTitle.trim(),
              },
            },
          },
        ],
      }),
    }
  );
  const props = res.replies?.[0]?.addSheet?.properties;
  return {
    sheetId: props?.sheetId ?? 0,
    title: props?.title || tabTitle.trim(),
    rowCount: props?.gridProperties?.rowCount,
    columnCount: props?.gridProperties?.columnCount,
  };
}

export async function clearSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  cellRange = 'A1:Z5000'
): Promise<void> {
  const safeSheet = `'${sheetTitle.replace(/'/g, "''")}'`;
  const range = `${safeSheet}!${cellRange}`;
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
}

export async function createSpreadsheetWithData(
  title: string,
  sheetTitle: string,
  rows: (string | number)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const created = await createSpreadsheetWithTabs(title, [sheetTitle.trim() || 'Properties']);
  const actualTabTitle = created.sheets[0]?.title || sheetTitle.trim() || 'Properties';
  if (rows.length > 0) {
    await updateSheetValues(created.spreadsheetId, actualTabTitle, 'A1', rows);
  }

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
  };
}

export async function updateSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  startCell: string,
  values: (string | number)[][]
): Promise<void> {
  const safeSheet = `'${sheetTitle.replace(/'/g, "''")}'`;
  const range = `${safeSheet}!${startCell}`;
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Google Calendar API (https://www.googleapis.com/calendar/v3)
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  timeZone?: string;
  accessRole?: 'freeBusyReader' | 'reader' | 'writer' | 'owner' | string;
}

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
}

export interface CalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: CalendarAttendee[];
}

export async function listCalendars(): Promise<CalendarListEntry[]> {
  const data = await workspaceFetch<{ items?: CalendarListEntry[] }>(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList'
  );
  return data.items || [];
}

export async function listCalendarEvents(calendarId = 'primary'): Promise<CalendarEventItem[]> {
  const params = new URLSearchParams({
    maxResults: '25',
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const data = await workspaceFetch<{ items?: CalendarEventItem[] }>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
  );
  return data.items || [];
}

export async function createCalendarEvent(
  calendarId: string,
  input: {
    summary: string;
    location?: string;
    description?: string;
    startIso: string;
    endIso: string;
    timeZone?: string;
    attendees?: Array<{ email: string; displayName?: string }>;
  },
  options?: { sendUpdates?: 'all' | 'externalOnly' | 'none' }
): Promise<CalendarEventItem> {
  const tz = input.timeZone || 'Asia/Kabul';
  const sendUpdates = options?.sendUpdates || (input.attendees?.length ? 'all' : 'none');
  const query = new URLSearchParams({ sendUpdates });

  return workspaceFetch<CalendarEventItem>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${query.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        summary: input.summary.trim(),
        location: input.location?.trim() || undefined,
        description: input.description?.trim() || undefined,
        start: { dateTime: new Date(input.startIso).toISOString(), timeZone: tz },
        end: { dateTime: new Date(input.endIso).toISOString(), timeZone: tz },
        ...(input.attendees?.length
          ? {
              attendees: input.attendees.map((a) => ({
                email: a.email.trim(),
                ...(a.displayName?.trim() ? { displayName: a.displayName.trim() } : {}),
              })),
            }
          : {}),
      }),
    }
  );
}

export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  patch: {
    summary?: string;
    location?: string;
    description?: string;
  }
): Promise<CalendarEventItem> {
  return workspaceFetch<CalendarEventItem>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }
  );
}

export async function deleteCalendarEvent(calendarId: string, eventId: string): Promise<void> {
  await workspaceFetch<void>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Google Docs API (https://docs.googleapis.com/v1)
// ─────────────────────────────────────────────────────────────────────────────

export interface GoogleDocContent {
  documentId: string;
  title: string;
  plainText: string;
  endIndex: number;
}

export async function listUserDocuments(): Promise<DriveFileItem[]> {
  return listDriveFiles({
    mimeType: 'application/vnd.google-apps.document',
    pageSize: 20,
  });
}

export async function getDocument(documentId: string): Promise<GoogleDocContent> {
  const raw = await workspaceFetch<{
    documentId: string;
    title?: string;
    body?: {
      content?: Array<{
        endIndex?: number;
        paragraph?: {
          elements?: Array<{
            textRun?: { content?: string };
          }>;
        };
      }>;
    };
  }>(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`);

  const chunks: string[] = [];
  let maxEndIndex = 1;
  for (const block of raw.body?.content || []) {
    if (typeof block.endIndex === 'number' && block.endIndex > maxEndIndex) {
      maxEndIndex = block.endIndex;
    }
    for (const el of block.paragraph?.elements || []) {
      if (el.textRun?.content) {
        chunks.push(el.textRun.content);
      }
    }
  }

  return {
    documentId: raw.documentId,
    title: raw.title || 'Untitled Document',
    plainText: chunks.join(''),
    endIndex: Math.max(1, maxEndIndex - 1),
  };
}

export async function createPropertyDocument(
  title: string,
  initialBodyText: string
): Promise<{ documentId: string }> {
  const created = await workspaceFetch<{ documentId: string }>(
    'https://docs.googleapis.com/v1/documents',
    {
      method: 'POST',
      body: JSON.stringify({ title: title.trim() }),
    }
  );

  if (initialBodyText.trim()) {
    await workspaceFetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(created.documentId)}:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: initialBodyText,
              },
            },
          ],
        }),
      }
    );
  }

  return { documentId: created.documentId };
}

export async function appendDocumentText(
  documentId: string,
  textToAppend: string
): Promise<GoogleDocContent> {
  const current = await getDocument(documentId);
  await workspaceFetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: current.endIndex },
              text: `\n${textToAppend}`,
            },
          },
        ],
      }),
    }
  );
  return getDocument(documentId);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Google Tasks API (https://tasks.googleapis.com/tasks/v1)
// ─────────────────────────────────────────────────────────────────────────────

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export async function listTaskLists(): Promise<GoogleTaskList[]> {
  const data = await workspaceFetch<{ items?: GoogleTaskList[] }>(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists'
  );
  return data.items || [];
}

export async function listTasks(taskListId: string): Promise<GoogleTaskItem[]> {
  const data = await workspaceFetch<{ items?: GoogleTaskItem[] }>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=true`
  );
  return data.items || [];
}

export async function createTask(
  taskListId: string,
  input: { title: string; notes?: string; dueIso?: string }
): Promise<GoogleTaskItem> {
  return workspaceFetch<GoogleTaskItem>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: input.title.trim(),
        notes: input.notes?.trim() || undefined,
        due: input.dueIso ? new Date(input.dueIso).toISOString() : undefined,
      }),
    }
  );
}

export async function updateTask(
  taskListId: string,
  taskId: string,
  patch: Partial<Pick<GoogleTaskItem, 'title' | 'notes' | 'status'>>
): Promise<GoogleTaskItem> {
  return workspaceFetch<GoogleTaskItem>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }
  );
}

export async function deleteTask(taskListId: string, taskId: string): Promise<void> {
  await workspaceFetch<void>(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
    }
  );
}
