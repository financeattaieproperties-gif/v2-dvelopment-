/**
 * Attaie Properties Sales PWA - Lead Notification Service
 * Manages notification permissions, mobile service worker push alerts, audio chimes,
 * and deduplicated real-time lead assignment alerts.
 */

export interface LeadNotificationPayload {
  id: number | string;
  customerName: string;
  serial?: string | null;
  requirements?: string | null;
  source?: string | null;
  propertyName?: string | null;
  projectName?: string | null;
  assignedBy?: string | null;
  assignedAt?: string | null;
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const NOTIFIED_CACHE_KEY_PREFIX = 'attaie_notified_lead_ids_';

/**
 * Check if the current browser environment supports the Notifications and Service Worker APIs
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current permission status
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

/**
 * Synthesizes a subtle, pleasant 2-tone chime using Web Audio API
 * Works completely offline without requiring external audio asset files.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant two-tone chime (F#5 739.99 Hz -> A#5 932.33 Hz)
    osc.frequency.setValueAtTime(739.99, now);
    osc.frequency.setValueAtTime(932.33, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    // Audio playback error or autoplay policy suppression
  }
}

/**
 * Retrieve the active ServiceWorkerRegistration for the Sales PWA
 */
async function getSalesServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    // Check specific /sales/ registration first
    const salesReg = await navigator.serviceWorker.getRegistration('/sales/');
    if (salesReg && salesReg.active) return salesReg;

    // Check root / local registration
    const rootReg = await navigator.serviceWorker.getRegistration();
    if (rootReg && rootReg.active) return rootReg;

    // Await ready registration with a 1.5s timeout
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

/**
 * Dispatch a notification for an assigned lead via the Service Worker or Web Notification API
 */
export async function notifyLeadAssigned(
  lead: LeadNotificationPayload,
  options?: { isTest?: boolean }
): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') return false;

  const leadId = lead.id;
  const leadSerial = lead.serial || `#${leadId}`;
  const title = options?.isTest
    ? `🔔 [Test] New Lead Assigned · ${leadSerial}`
    : `🔔 New Lead Assigned · ${leadSerial}`;

  const propertyOrProject = lead.propertyName || lead.projectName || '';
  const detailSnippet = lead.requirements
    ? lead.requirements.trim().slice(0, 85)
    : 'Immediate customer follow-up requested.';

  const body = [
    lead.customerName,
    propertyOrProject ? `(${propertyOrProject})` : '',
    detailSnippet ? `— ${detailSnippet}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const win = typeof window !== 'undefined' ? (window as unknown as { __ATTAIE_ANDROID_APP__?: boolean }) : {};
  const isAndroidBundle = Boolean(win.__ATTAIE_ANDROID_APP__ || (typeof location !== 'undefined' && location.pathname.endsWith('/index.html')));
  const targetUrl = isAndroidBundle
    ? `./index.html?page=leads&id=${leadId}`
    : `/sales/leads?id=${leadId}`;
  const iconUrl = isAndroidBundle ? './pwa-192x192.png' : '/sales/pwa-192x192.png';

  const notificationOptions: NotificationOptions & {
    vibrate?: number[];
    renotify?: boolean;
  } = {
    body,
    icon: iconUrl,
    badge: iconUrl,
    tag: `lead-assigned-${leadId}`,
    data: {
      url: targetUrl,
      leadId,
      assignedAt: lead.assignedAt || new Date().toISOString(),
    },
    // Distinctive mobile vibration: buzz 200ms, pause 100ms, buzz 200ms
    vibrate: [200, 100, 200, 100, 200],
    renotify: true,
    requireInteraction: true,
  };

  playNotificationSound();

  // Try Service Worker registration first (standard for mobile PWAs)
  try {
    const reg = await getSalesServiceWorkerRegistration();
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(title, notificationOptions);
      return true;
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to postMessage to active service worker controller
  try {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_LEAD_NOTIFICATION',
        title,
        options: notificationOptions,
      });
      return true;
    }
  } catch {
    // Continue to Window Notification fallback
  }

  // Fallback to standard Window Notification if available in foreground
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      window.location.href = targetUrl;
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatches an instant test notification so staff can verify mobile vibration, sound, and banner display
 */
export async function sendTestLeadNotification(): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const requested = await requestNotificationPermission();
    if (requested !== 'granted') return false;
  }

  return notifyLeadAssigned(
    {
      id: 999,
      serial: 'AP-702',
      customerName: 'Eng. Maryam Sadat',
      propertyName: 'Contemporary High-Rise Apartment in Shahr-e-Naw',
      requirements: 'Floor plan requested and installment terms consultation scheduled for tomorrow.',
      assignedBy: 'Attaie Call Center',
      assignedAt: new Date().toISOString(),
    },
    { isTest: true }
  );
}

/**
 * Reads the list of lead IDs that have already triggered a notification for this staff user
 */
function getNotifiedLeadIds(userId: number | string): Set<string> {
  if (typeof window === 'undefined' || !window.localStorage) return new Set();
  try {
    const raw = window.localStorage.getItem(NOTIFIED_CACHE_KEY_PREFIX + userId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves the set of notified lead IDs in localStorage (capped at 200 items to conserve storage)
 */
function saveNotifiedLeadIds(userId: number | string, ids: Set<string>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const arr = Array.from(ids).slice(-200);
    window.localStorage.setItem(NOTIFIED_CACHE_KEY_PREFIX + userId, JSON.stringify(arr));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Detects newly assigned leads that have not yet alerted this staff user, and triggers notifications.
 * Automatically initializes cache on first load to prevent historical alert spam.
 */
export function syncAndNotifyAssignedLeads(
  userId: number | string,
  leads: Array<{
    id: number | string;
    customerName?: string;
    name?: string;
    serial?: string | null;
    requirements?: string | null;
    message?: string | null;
    propertyName?: string | null;
    property_name?: string | null;
    projectName?: string | null;
    project_name?: string | null;
    assigneeId?: number | null;
    assignedBy?: string | null;
    status?: string | null;
    created_at?: string | null;
  }>,
  isSalesRole: boolean
): number {
  if (!userId || !Array.isArray(leads) || leads.length === 0) return 0;
  if (getNotificationPermission() !== 'granted') return 0;

  const notifiedIds = getNotifiedLeadIds(userId);
  const isColdStart = notifiedIds.size === 0;

  // Filter leads assigned to this user (or unassigned/new inquiries if in sales agent role)
  const candidateLeads = leads.filter((l) => {
    const isAssignedToUser = l.assigneeId === Number(userId) || (l.assigneeId === undefined && isSalesRole);
    return isAssignedToUser;
  });

  if (isColdStart) {
    // Cold start: record existing leads without blasting alerts
    candidateLeads.forEach((l) => notifiedIds.add(String(l.id)));
    saveNotifiedLeadIds(userId, notifiedIds);
    return 0;
  }

  let newlyNotifiedCount = 0;

  for (const lead of candidateLeads) {
    const leadIdStr = String(lead.id);
    if (!notifiedIds.has(leadIdStr)) {
      notifiedIds.add(leadIdStr);
      newlyNotifiedCount++;

      void notifyLeadAssigned({
        id: lead.id,
        serial: lead.serial,
        customerName: lead.customerName || lead.name || 'New Customer Inquiry',
        requirements: lead.requirements || lead.message || null,
        propertyName: lead.propertyName || lead.property_name || null,
        projectName: lead.projectName || lead.project_name || null,
        assignedBy: lead.assignedBy || 'Attaie CRM',
        assignedAt: lead.created_at || new Date().toISOString(),
      });
    }
  }

  if (newlyNotifiedCount > 0) {
    saveNotifiedLeadIds(userId, notifiedIds);
  }

  return newlyNotifiedCount;
}
