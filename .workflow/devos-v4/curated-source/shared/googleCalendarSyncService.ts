import { getAccessToken, getWorkspaceUserEmail } from './googleWorkspaceAuth';
import {
  createCalendarEvent,
  listCalendars,
  type CalendarEventItem,
  type CalendarListEntry,
} from './googleWorkspaceCore';

export type CrmCalendarScheduleType = 'followup' | 'visit';

export interface CrmCalendarSyncInput {
  scheduleType: CrmCalendarScheduleType;
  customerName: string;
  customerPhone?: string;
  propertyOrProject?: string;
  serial?: string;
  scheduledAtIso: string;
  durationMinutes?: number;
  notes?: string;
  assignedAgentName?: string;
  assignedAgentEmail?: string;
  location?: string;
  timeZone?: string;
}

export interface AgentCalendarResolution {
  calendarId: string;
  calendarSummary: string;
  isDirectAgentCalendar: boolean;
  attachAttendee: boolean;
}

export interface CrmCalendarSyncResult {
  synced: boolean;
  needsAuth?: boolean;
  calendarId?: string;
  calendarSummary?: string;
  event?: CalendarEventItem;
  attendeeInvited?: boolean;
  reason?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function extractAgentEmail(agent?: {
  email?: string | null;
  username?: string | null;
}): string {
  const email = agent?.email?.trim();
  if (email && EMAIL_RE.test(email)) return email;
  const username = agent?.username?.trim();
  if (username && EMAIL_RE.test(username)) return username;
  return '';
}

export function resolveAgentCalendarTarget(
  calendars: CalendarListEntry[],
  assignedAgentEmail?: string,
  signedInUserEmail?: string | null
): AgentCalendarResolution {
  const cleanAgentEmail = assignedAgentEmail?.trim().toLowerCase() || '';
  const cleanSignedInEmail = signedInUserEmail?.trim().toLowerCase() || '';

  if (cleanAgentEmail && EMAIL_RE.test(cleanAgentEmail)) {
    const directWritable = calendars.find(
      (c) =>
        (c.id.toLowerCase() === cleanAgentEmail ||
          c.summary.toLowerCase() === cleanAgentEmail) &&
        (!c.accessRole || c.accessRole === 'owner' || c.accessRole === 'writer')
    );
    if (directWritable) {
      return {
        calendarId: directWritable.id,
        calendarSummary: directWritable.summary || directWritable.id,
        isDirectAgentCalendar: true,
        attachAttendee: cleanAgentEmail !== cleanSignedInEmail,
      };
    }
  }

  const primaryCal = calendars.find((c) => c.primary) || calendars[0];
  return {
    calendarId: primaryCal?.id || 'primary',
    calendarSummary: primaryCal?.summary || 'Primary Calendar',
    isDirectAgentCalendar: !cleanAgentEmail || cleanAgentEmail === cleanSignedInEmail,
    attachAttendee:
      Boolean(cleanAgentEmail && EMAIL_RE.test(cleanAgentEmail)) &&
      cleanAgentEmail !== cleanSignedInEmail,
  };
}

export function buildCrmCalendarEventPayload(input: CrmCalendarSyncInput): {
  summary: string;
  location: string;
  description: string;
  startIso: string;
  endIso: string;
  timeZone: string;
  attendees?: Array<{ email: string; displayName?: string }>;
} {
  const isVisit = input.scheduleType === 'visit';
  const durationMinutes =
    typeof input.durationMinutes === 'number' && input.durationMinutes > 0
      ? input.durationMinutes
      : isVisit
        ? 60
        : 30;

  const startDate = new Date(input.scheduledAtIso);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('Invalid follow-up or visit date/time for Google Calendar sync.');
  }
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const label = isVisit ? 'Property Visit' : 'Lead Follow-up';
  const subjectSuffix = input.propertyOrProject?.trim()
    ? ` — ${input.propertyOrProject.trim()}`
    : '';
  const summary = `[${label}] ${input.customerName.trim() || 'Client'}${subjectSuffix}`;

  const lines = [
    `Attaie Properties CRM — ${label}`,
    input.serial ? `Reference: ${input.serial}` : '',
    `Customer: ${input.customerName.trim() || 'Client'}`,
    input.customerPhone ? `Phone: ${input.customerPhone.trim()}` : '',
    input.propertyOrProject ? `Property / Project: ${input.propertyOrProject.trim()}` : '',
    input.assignedAgentName
      ? `Assigned Agent: ${input.assignedAgentName.trim()}${input.assignedAgentEmail ? ` (${input.assignedAgentEmail.trim()})` : ''}`
      : '',
    input.notes?.trim() ? `\nCRM Notes:\n${input.notes.trim()}` : '',
  ].filter(Boolean);

  const cleanAgentEmail = input.assignedAgentEmail?.trim();
  const attendees =
    cleanAgentEmail && EMAIL_RE.test(cleanAgentEmail)
      ? [
          {
            email: cleanAgentEmail,
            displayName: input.assignedAgentName?.trim() || undefined,
          },
        ]
      : undefined;

  return {
    summary,
    location:
      input.location?.trim() ||
      input.propertyOrProject?.trim() ||
      'Attaie Properties — Kabul, Afghanistan',
    description: lines.join('\n'),
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    timeZone: input.timeZone || 'Asia/Kabul',
    attendees,
  };
}

export async function syncCrmScheduleToAgentCalendar(
  input: CrmCalendarSyncInput
): Promise<CrmCalendarSyncResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      synced: false,
      needsAuth: true,
      reason: 'Google Workspace sign-in is required to sync this event to Google Calendar.',
    };
  }

  const calendars = await listCalendars();
  const resolution = resolveAgentCalendarTarget(
    calendars,
    input.assignedAgentEmail,
    getWorkspaceUserEmail()
  );

  const payload = buildCrmCalendarEventPayload(input);
  const event = await createCalendarEvent(
    resolution.calendarId,
    {
      ...payload,
      attendees: resolution.attachAttendee ? payload.attendees : undefined,
    },
    {
      sendUpdates: resolution.attachAttendee ? 'all' : 'none',
    }
  );

  return {
    synced: true,
    calendarId: resolution.calendarId,
    calendarSummary: resolution.calendarSummary,
    event,
    attendeeInvited: resolution.attachAttendee,
  };
}
