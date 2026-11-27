import {
  addSpreadsheetTab,
  clearSheetValues,
  createSpreadsheetWithTabs,
  getSpreadsheetMetadata,
  updateSheetValues,
  type SpreadsheetMetadata,
} from './googleWorkspaceCore';

export const DESIGNATED_SHEET_STORAGE_KEY = 'attaie_designated_google_sheet_v1';
export const DEFAULT_SALES_LEADS_TAB = 'Sales Leads';
export const DEFAULT_PROJECT_INVENTORY_TAB = 'Project Inventory';

export interface DesignatedSheetConfig {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  leadsTab: string;
  inventoryTab: string;
}

export interface ExportableSalesLead {
  id: string | number;
  serial: string;
  customerName: string;
  phone: string;
  email?: string;
  propertyOrProject: string;
  unitOrRef?: string;
  statusOrStage: string;
  source: string;
  assignedAgent: string;
  scheduledOrCallDate: string;
  requirementsOrNotes: string;
}

export interface ExportableInventoryUnit {
  unitNumber: string;
  serialNumber: string;
  floor: number | string;
  kind: string;
  rooms: number | string;
  areaSqm: number | string;
  pricePerSqm: number | string;
  totalPrice: number | string;
  currency: string;
  status: string;
}

export interface ExportableProjectInventory {
  code: string;
  name: string;
  location: string;
  status: string;
  totalAreaSqm: number | string;
  floors: number | string;
  availableUnits?: number | string;
  totalUnits?: number | string;
  deliveryDate?: string;
  units: ExportableInventoryUnit[];
}

export const SALES_LEADS_HEADERS = [
  'Record ID',
  'Serial / Reference',
  'Customer Name',
  'Phone',
  'Email',
  'Project / Property',
  'Unit / Ref',
  'Status / Stage',
  'Source',
  'Assigned Agent',
  'Call / Follow-up Date',
  'Requirements / Notes',
  'Exported At',
] as const;

export const PROJECT_INVENTORY_HEADERS = [
  'Project Code',
  'Project Name',
  'Location',
  'Project Status',
  'Total Area (sqm)',
  'Floors',
  'Available / Total Units',
  'Unit Number',
  'Unit Serial',
  'Floor',
  'Unit Type',
  'Rooms',
  'Unit Area (sqm)',
  'Price per sqm',
  'Total Price',
  'Currency',
  'Unit Status',
  'Updated At',
] as const;

export function getDesignatedSheetConfig(): DesignatedSheetConfig | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(DESIGNATED_SHEET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DesignatedSheetConfig>;
    if (!parsed.spreadsheetId) return null;
    return {
      spreadsheetId: parsed.spreadsheetId,
      title: parsed.title || 'Attaie Properties CRM Sheet',
      spreadsheetUrl:
        parsed.spreadsheetUrl ||
        `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}/edit`,
      leadsTab: parsed.leadsTab || DEFAULT_SALES_LEADS_TAB,
      inventoryTab: parsed.inventoryTab || DEFAULT_PROJECT_INVENTORY_TAB,
    };
  } catch {
    return null;
  }
}

export function saveDesignatedSheetConfig(config: DesignatedSheetConfig): DesignatedSheetConfig {
  const normalized: DesignatedSheetConfig = {
    spreadsheetId: config.spreadsheetId.trim(),
    title: config.title.trim() || 'Attaie Properties CRM Sheet',
    spreadsheetUrl:
      config.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${config.spreadsheetId.trim()}/edit`,
    leadsTab: config.leadsTab.trim() || DEFAULT_SALES_LEADS_TAB,
    inventoryTab: config.inventoryTab.trim() || DEFAULT_PROJECT_INVENTORY_TAB,
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DESIGNATED_SHEET_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // ignore storage quota errors
  }
  return normalized;
}

export function clearDesignatedSheetConfig(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DESIGNATED_SHEET_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function adaptStaffLeadForSheet(
  lead: {
    id: number;
    serial: string;
    stageSerial?: string;
    customerName: string;
    phone: string;
    projectName?: string | null;
    projectCode?: string | null;
    apartmentNumber?: string | null;
    status: string;
    source: string;
    assigneeId?: number;
    callAt: string;
    requirements: string;
  },
  staffUsers: Array<{ id: number; name: string }> = []
): ExportableSalesLead {
  const assignedUser = staffUsers.find((u) => u.id === lead.assigneeId);
  return {
    id: lead.id,
    serial: lead.stageSerial || lead.serial || `L-${lead.id}`,
    customerName: lead.customerName || 'New inquiry',
    phone: lead.phone || '',
    email: '',
    propertyOrProject:
      [lead.projectCode, lead.projectName].filter(Boolean).join(' — ') || 'General Inquiry',
    unitOrRef: lead.apartmentNumber || '',
    statusOrStage: lead.status,
    source: lead.source || 'manual',
    assignedAgent: assignedUser?.name || (lead.assigneeId ? `Agent #${lead.assigneeId}` : 'Unassigned'),
    scheduledOrCallDate: lead.callAt || '',
    requirementsOrNotes: lead.requirements || '',
  };
}

export function adaptAdminLeadForSheet(lead: {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  property_name: string | null;
  stage: string;
  source: string;
  status: string;
  receipt_reference?: string | null;
  followup_status?: string;
  followup_notes?: string | null;
  followup_at?: string | null;
  created_at: string;
}): ExportableSalesLead {
  return {
    id: `WEB-${lead.id}`,
    serial: lead.receipt_reference || `LEAD-${lead.id}`,
    customerName: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    propertyOrProject: lead.property_name || 'Website Inquiry',
    unitOrRef: lead.followup_status || '',
    statusOrStage: lead.stage || lead.status || 'new',
    source: lead.source || 'Website',
    assignedAgent: 'Website / Admin CRM',
    scheduledOrCallDate: lead.followup_at || lead.created_at || '',
    requirementsOrNotes: [lead.message, lead.followup_notes].filter(Boolean).join(' | '),
  };
}

export function adaptStaffProjectForSheet(project: {
  id: number;
  code: string;
  name: string;
  location: string;
  status: string;
  totalAreaSqm: number;
  floors: number;
  apartments: Array<{
    unitNumber: string;
    serialNumber: string;
    floor: number;
    kind?: string;
    rooms: number;
    areaSqm: number;
    pricePerSqm: number;
    totalPrice: number;
    currency: string;
    status: string;
  }>;
}): ExportableProjectInventory {
  const availableCount = project.apartments.filter((u) => u.status === 'available').length;
  return {
    code: project.code || `PRJ-${project.id}`,
    name: project.name,
    location: project.location,
    status: project.status,
    totalAreaSqm: project.totalAreaSqm ?? 0,
    floors: project.floors ?? 0,
    availableUnits: availableCount,
    totalUnits: project.apartments.length,
    units: project.apartments.map((u) => ({
      unitNumber: u.unitNumber,
      serialNumber: u.serialNumber || `${project.code}-${u.unitNumber}`,
      floor: u.floor,
      kind: u.kind || 'apartment',
      rooms: u.rooms ?? 0,
      areaSqm: u.areaSqm ?? 0,
      pricePerSqm: u.pricePerSqm ?? 0,
      totalPrice: u.totalPrice ?? 0,
      currency: u.currency || 'USD',
      status: u.status,
    })),
  };
}

export function adaptAdminProjectForSheet(
  project: {
    id: number;
    name: string;
    location: string;
    status: string;
    available_units: number;
    total_units: number;
    delivery_date?: string | null;
  },
  units: Array<{
    unit_number: string;
    title: string | null;
    beds: number | null;
    area: number | null;
    floor: number | null;
    price: number | null;
    currency: string;
    status: string;
  }> = []
): ExportableProjectInventory {
  return {
    code: `PRJ-${project.id}`,
    name: project.name,
    location: project.location,
    status: project.status,
    totalAreaSqm: '',
    floors: '',
    availableUnits: project.available_units,
    totalUnits: project.total_units,
    deliveryDate: project.delivery_date || '',
    units: units.map((u) => ({
      unitNumber: u.unit_number,
      serialNumber: `PRJ-${project.id}-${u.unit_number}`,
      floor: u.floor ?? '',
      kind: u.title || 'Unit',
      rooms: u.beds ?? 0,
      areaSqm: u.area ?? 0,
      pricePerSqm: u.area && u.price ? Math.round((u.price / u.area) * 100) / 100 : '',
      totalPrice: u.price ?? 0,
      currency: u.currency || 'USD',
      status: u.status,
    })),
  };
}

export function buildSalesLeadsSheetRows(
  leads: ExportableSalesLead[],
  exportedAt = new Date().toISOString()
): (string | number)[][] {
  const rows: (string | number)[][] = [[...SALES_LEADS_HEADERS]];
  for (const lead of leads) {
    rows.push([
      String(lead.id),
      lead.serial,
      lead.customerName,
      lead.phone,
      lead.email || '',
      lead.propertyOrProject,
      lead.unitOrRef || '',
      lead.statusOrStage,
      lead.source,
      lead.assignedAgent,
      lead.scheduledOrCallDate,
      lead.requirementsOrNotes,
      exportedAt,
    ]);
  }
  return rows;
}

export function buildProjectInventorySheetRows(
  projects: ExportableProjectInventory[],
  exportedAt = new Date().toISOString()
): (string | number)[][] {
  const rows: (string | number)[][] = [[...PROJECT_INVENTORY_HEADERS]];
  for (const proj of projects) {
    const unitSummary =
      proj.totalUnits !== undefined
        ? `${proj.availableUnits ?? 0} / ${proj.totalUnits}`
        : '';

    if (proj.units.length === 0) {
      rows.push([
        proj.code,
        proj.name,
        proj.location,
        proj.status,
        proj.totalAreaSqm,
        proj.floors,
        unitSummary,
        '—',
        '—',
        '',
        'Project Summary',
        '',
        '',
        '',
        '',
        '',
        proj.status,
        exportedAt,
      ]);
      continue;
    }

    for (const unit of proj.units) {
      rows.push([
        proj.code,
        proj.name,
        proj.location,
        proj.status,
        proj.totalAreaSqm,
        proj.floors,
        unitSummary,
        unit.unitNumber,
        unit.serialNumber,
        unit.floor,
        unit.kind,
        unit.rooms,
        unit.areaSqm,
        unit.pricePerSqm,
        unit.totalPrice,
        unit.currency,
        unit.status,
        exportedAt,
      ]);
    }
  }
  return rows;
}

export async function ensureSpreadsheetTab(
  spreadsheetId: string,
  preferredTabTitle: string
): Promise<{ metadata: SpreadsheetMetadata; tabTitle: string; createdTab: boolean }> {
  const metadata = await getSpreadsheetMetadata(spreadsheetId);
  const existing = metadata.sheets.find(
    (s) => s.title.trim().toLowerCase() === preferredTabTitle.trim().toLowerCase()
  );
  if (existing) {
    return { metadata, tabTitle: existing.title, createdTab: false };
  }
  const added = await addSpreadsheetTab(spreadsheetId, preferredTabTitle.trim());
  return {
    metadata: {
      ...metadata,
      sheets: [...metadata.sheets, added],
    },
    tabTitle: added.title,
    createdTab: true,
  };
}

export async function createDesignatedCrmSpreadsheet(
  title = 'Attaie Properties — Sales & Project Inventory'
): Promise<DesignatedSheetConfig> {
  const created = await createSpreadsheetWithTabs(title, [
    DEFAULT_SALES_LEADS_TAB,
    DEFAULT_PROJECT_INVENTORY_TAB,
  ]);
  const config: DesignatedSheetConfig = {
    spreadsheetId: created.spreadsheetId,
    title: created.title,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
    leadsTab: created.sheets[0]?.title || DEFAULT_SALES_LEADS_TAB,
    inventoryTab: created.sheets[1]?.title || DEFAULT_PROJECT_INVENTORY_TAB,
  };
  return saveDesignatedSheetConfig(config);
}

export async function exportSalesLeadsToGoogleSheet(options: {
  spreadsheetId: string;
  leads: ExportableSalesLead[];
  tabName?: string;
  exportedAt?: string;
}): Promise<{
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  tabTitle: string;
  rowCount: number;
}> {
  const targetTab = options.tabName?.trim() || DEFAULT_SALES_LEADS_TAB;
  const { metadata, tabTitle } = await ensureSpreadsheetTab(options.spreadsheetId, targetTab);
  const rows = buildSalesLeadsSheetRows(options.leads, options.exportedAt);

  await clearSheetValues(options.spreadsheetId, tabTitle, 'A1:Z5000');
  await updateSheetValues(options.spreadsheetId, tabTitle, 'A1', rows);

  return {
    spreadsheetId: options.spreadsheetId,
    spreadsheetTitle: metadata.title,
    spreadsheetUrl:
      metadata.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${options.spreadsheetId}/edit`,
    tabTitle,
    rowCount: options.leads.length,
  };
}

export async function exportProjectInventoryToGoogleSheet(options: {
  spreadsheetId: string;
  projects: ExportableProjectInventory[];
  tabName?: string;
  exportedAt?: string;
}): Promise<{
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  tabTitle: string;
  projectCount: number;
  dataRowCount: number;
}> {
  const targetTab = options.tabName?.trim() || DEFAULT_PROJECT_INVENTORY_TAB;
  const { metadata, tabTitle } = await ensureSpreadsheetTab(options.spreadsheetId, targetTab);
  const rows = buildProjectInventorySheetRows(options.projects, options.exportedAt);

  await clearSheetValues(options.spreadsheetId, tabTitle, 'A1:Z5000');
  await updateSheetValues(options.spreadsheetId, tabTitle, 'A1', rows);

  return {
    spreadsheetId: options.spreadsheetId,
    spreadsheetTitle: metadata.title,
    spreadsheetUrl:
      metadata.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${options.spreadsheetId}/edit`,
    tabTitle,
    projectCount: options.projects.length,
    dataRowCount: Math.max(0, rows.length - 1),
  };
}
