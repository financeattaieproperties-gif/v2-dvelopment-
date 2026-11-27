export const STAFF_OFFLINE_SNAPSHOT_KEY_PREFIX = "attaie_staff_offline_v1_";

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getOfflineSnapshotKey(panelId = "sales") {
  const safeId = String(panelId || "sales")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "_");
  return `${STAFF_OFFLINE_SNAPSHOT_KEY_PREFIX}${safeId}`;
}

/**
 * Distinguishes transport/connectivity failures from HTTP 4xx/5xx server rejections.
 * @param {any} error
 * @param {boolean} [isOnline]
 */
export function isNetworkOfflineError(error, isOnline = undefined) {
  const onlineFlag =
    typeof isOnline === "boolean"
      ? isOnline
      : typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
        ? navigator.onLine
        : true;
  if (!onlineFlag) return true;
  if (!error) return false;
  if (error.isNetworkError === true) return true;
  if (typeof error.status === "number" && error.status > 0 && error.status < 500) {
    return false;
  }
  const msg = String(error?.message || error || "");
  return /failed to fetch|networkerror|load failed|err_internet_disconnected|err_network|you are offline|unable to reach the staff server/i.test(
    msg,
  );
}

/**
 * Reads the persisted offline workspace snapshot for a given panel (e.g. "sales").
 * @param {string} panelId
 * @param {any} [storage]
 */
export function readOfflineSnapshot(panelId = "sales", storage = undefined) {
  const store = resolveStorage(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(getOfflineSnapshotKey(panelId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !parsed.user || !parsed.user.role) {
      return null;
    }
    return {
      version: 1,
      panelId: parsed.panelId || panelId,
      user: parsed.user,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      views: parsed.views && typeof parsed.views === "object" ? parsed.views : {},
    };
  } catch {
    return null;
  }
}

function saveSnapshot(panelId, snapshot, storage = undefined) {
  const store = resolveStorage(storage);
  if (!store) return false;
  try {
    store.setItem(getOfflineSnapshotKey(panelId), JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

/**
 * Persists the verified signed-in user identity for offline launches.
 * Resets cached views if a different user signs in on the same device.
 * @param {string} panelId
 * @param {any} user
 * @param {any} [storage]
 */
export function writeOfflineSessionUser(panelId = "sales", user, storage = undefined) {
  if (!user || !user.role) return false;
  const existing = readOfflineSnapshot(panelId, storage);
  const sameUser =
    existing &&
    existing.user &&
    ((existing.user.id && user.id && existing.user.id === user.id) ||
      (existing.user.username && user.username && existing.user.username === user.username));
  const next = {
    version: 1,
    panelId,
    user,
    savedAt: new Date().toISOString(),
    views: sameUser ? existing.views : {},
  };
  return saveSnapshot(panelId, next, storage);
}

/**
 * Stores a clean view payload (empty search, page 0) in the offline cache.
 * Preserves existing cached views on the same user snapshot.
 * @param {string} panelId
 * @param {string} view
 * @param {any} data
 * @param {{ query?: string; page?: number; storage?: any }} [options]
 */
export function writeOfflineViewData(
  panelId = "sales",
  view = "leads",
  data,
  { query = "", page = 0, storage = undefined } = {},
) {
  if (!data || typeof data !== "object") return false;
  if (String(query || "").trim() !== "" || Number(page) !== 0) {
    return false;
  }
  const existing = readOfflineSnapshot(panelId, storage);
  if (!existing) return false;

  const cleanView = String(view || "overview");
  const nextViews = {
    ...existing.views,
    [cleanView]: data,
  };
  const next = {
    ...existing,
    savedAt: new Date().toISOString(),
    views: nextViews,
  };
  return saveSnapshot(panelId, next, storage);
}

function matchesOfflineQuery(haystackParts, term) {
  if (!term) return true;
  return haystackParts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(term);
}

/**
 * Reads cached view data (with cross-view fallback between leads and overview)
 * and applies in-memory search filtering when the agent searches offline.
 * @param {string} panelId
 * @param {string} [view]
 * @param {string} [query]
 * @param {any} [storage]
 */
export function readOfflineViewData(
  panelId = "sales",
  view = "leads",
  query = "",
  storage = undefined,
) {
  const snapshot = readOfflineSnapshot(panelId, storage);
  if (!snapshot) return null;

  const cleanView = String(view || "overview");
  const views = snapshot.views || {};
  const fallbackOrder = [
    cleanView,
    "leads",
    "overview",
    "followups",
    "customers",
    "projects",
  ];
  let baseData = null;
  for (const key of fallbackOrder) {
    if (views[key] && typeof views[key] === "object") {
      baseData = views[key];
      break;
    }
  }
  if (!baseData) return null;

  const term = String(query || "").trim().toLowerCase();
  const cloned = JSON.parse(JSON.stringify(baseData));

  if (term) {
    if (Array.isArray(cloned.leads)) {
      cloned.leads = cloned.leads.filter((l) =>
        matchesOfflineQuery(
          [l.serial, l.customerName, l.phone, l.projectName, l.requirements],
          term,
        ),
      );
    }
    if (Array.isArray(cloned.followups)) {
      cloned.followups = cloned.followups.filter((f) =>
        matchesOfflineQuery([f.serial, f.customerName, f.phone, f.requirements], term),
      );
    }
    if (Array.isArray(cloned.customers)) {
      cloned.customers = cloned.customers.filter((c) =>
        matchesOfflineQuery([c.serial, c.name, c.phone, c.requirements], term),
      );
    }
    if (Array.isArray(cloned.projects)) {
      cloned.projects = cloned.projects.filter((p) =>
        matchesOfflineQuery([p.name, p.location, p.constructionCompany], term),
      );
    }
    if (Array.isArray(cloned.tasks)) {
      cloned.tasks = cloned.tasks.filter((t) =>
        matchesOfflineQuery([t.title, t.assignedBy, t.projectName], term),
      );
    }
  }

  return {
    data: cloned,
    savedAt: snapshot.savedAt,
  };
}

/**
 * Clears the cached offline session and leads snapshot on explicit sign-out or 401 expiry.
 * @param {string} panelId
 * @param {any} [storage]
 */
export function clearOfflineSnapshot(panelId = "sales", storage = undefined) {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem?.(getOfflineSnapshotKey(panelId));
  } catch {
    // Ignore storage removal errors
  }
}

export const STAFF_OFFLINE_OUTBOX_KEY_PREFIX = "attaie_staff_outbox_v1_";

export function getOfflineOutboxKey(panelId = "sales") {
  const safeId = String(panelId || "sales")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "_");
  return `${STAFF_OFFLINE_OUTBOX_KEY_PREFIX}${safeId}`;
}

function readRawOutbox(panelId = "sales", storage = undefined) {
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(getOfflineOutboxKey(panelId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.kind === "string" &&
        item.payload &&
        typeof item.payload === "object",
    );
  } catch {
    return [];
  }
}

function writeRawOutbox(panelId = "sales", items = [], storage = undefined) {
  const store = resolveStorage(storage);
  if (!store) return false;
  try {
    if (!items.length) {
      store.removeItem?.(getOfflineOutboxKey(panelId));
    } else {
      store.setItem(getOfflineOutboxKey(panelId), JSON.stringify(items));
    }
    return true;
  } catch {
    return false;
  }
}

function matchesOutboxUser(item, userId) {
  if (userId === undefined || userId === null || userId === "") return true;
  return String(item.userId ?? "") === String(userId);
}

/**
 * Reads locally stored offline entries for a panel (optionally scoped to one user).
 * Sorted oldest-first so mutations replay in exact chronological order.
 * @param {string} [panelId]
 * @param {string | number} [userId]
 * @param {any} [storage]
 */
export function readOfflineOutbox(panelId = "sales", userId = undefined, storage = undefined) {
  return readRawOutbox(panelId, storage)
    .filter((item) => matchesOutboxUser(item, userId))
    .sort((a, b) => Date.parse(a.createdAt || "") - Date.parse(b.createdAt || ""));
}

/**
 * Summarizes pending, syncing, and failed offline entries for the active user.
 * @param {string} [panelId]
 * @param {string | number} [userId]
 * @param {any} [storage]
 */
export function getOfflineOutboxCounts(panelId = "sales", userId = undefined, storage = undefined) {
  const items = readOfflineOutbox(panelId, userId, storage);
  let pending = 0;
  let syncing = 0;
  let failed = 0;
  for (const item of items) {
    if (item.status === "syncing") syncing++;
    else if (item.status === "failed") failed++;
    else pending++;
  }
  return { pending, syncing, failed, total: items.length };
}

/**
 * Stores a locally queued offline mutation (lead entry, followup feedback, task creation, or task status update).
 * @param {string} panelId
 * @param {string | number} userId
 * @param {{ kind: "lead_entry" | "followup_feedback" | "task_create" | "task_status"; payload: Record<string, any>; idempotencyKey?: string; id?: string }} entry
 * @param {any} [storage]
 */
export function enqueueOfflineEntry(panelId = "sales", userId, entry, storage = undefined) {
  if (!entry || !entry.kind || !entry.payload || typeof entry.payload !== "object") {
    return null;
  }
  const idempotencyKey =
    entry.idempotencyKey ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const id = entry.id || idempotencyKey;
  const now = new Date().toISOString();
  const nextItem = {
    id,
    userId: userId ?? "",
    kind: entry.kind,
    payload: entry.payload,
    idempotencyKey,
    attempts: 0,
    status: "pending",
    lastError: "",
    createdAt: now,
    updatedAt: now,
  };
  const items = readRawOutbox(panelId, storage);
  const existingIdx = items.findIndex((item) => item.id === id);
  if (existingIdx >= 0) {
    items[existingIdx] = nextItem;
  } else {
    items.push(nextItem);
  }
  return writeRawOutbox(panelId, items, storage) ? nextItem : null;
}

/**
 * Updates or deletes (when updater returns null/undefined) an outbox entry by id.
 * @param {string} panelId
 * @param {string} id
 * @param {(current: any) => any} updater
 * @param {any} [storage]
 */
export function updateOfflineOutboxItem(panelId = "sales", id, updater, storage = undefined) {
  const items = readRawOutbox(panelId, storage);
  const idx = items.findIndex((item) => item.id === id);
  if (idx < 0) return false;
  const next = updater(items[idx]);
  if (!next) {
    items.splice(idx, 1);
  } else {
    items[idx] = { ...next, updatedAt: new Date().toISOString() };
  }
  return writeRawOutbox(panelId, items, storage);
}

export function removeOfflineOutboxItem(panelId = "sales", id, storage = undefined) {
  return updateOfflineOutboxItem(panelId, id, () => null, storage);
}

/**
 * Resets any previously failed outbox items back to pending so the next sync retries them.
 * @param {string} [panelId]
 * @param {string | number} [userId]
 * @param {any} [storage]
 */
export function retryFailedOfflineOutboxItems(panelId = "sales", userId = undefined, storage = undefined) {
  const items = readRawOutbox(panelId, storage);
  let changed = 0;
  const now = new Date().toISOString();
  const updated = items.map((item) => {
    if (matchesOutboxUser(item, userId) && (item.status === "failed" || item.status === "syncing")) {
      changed++;
      return { ...item, status: "pending", lastError: "", updatedAt: now };
    }
    return item;
  });
  if (changed > 0) writeRawOutbox(panelId, updated, storage);
  return changed;
}

/**
 * Clears the entire offline outbox for a panel (or a specific user).
 * @param {string} [panelId]
 * @param {string | number} [userId]
 * @param {any} [storage]
 */
export function clearOfflineOutbox(panelId = "sales", userId = undefined, storage = undefined) {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    if (userId === undefined || userId === null || userId === "") {
      store.removeItem?.(getOfflineOutboxKey(panelId));
    } else {
      const remaining = readRawOutbox(panelId, storage).filter(
        (item) => !matchesOutboxUser(item, userId),
      );
      writeRawOutbox(panelId, remaining, storage);
    }
  } catch {
    // Ignore storage removal errors
  }
}

/**
 * Flushes pending offline entries in chronological order when online.
 * Re-queues items cleanly on transient network failures and marks permanent 4xx rejections as failed.
 * @param {{
 *   panelId?: string;
 *   userId?: string | number;
 *   storage?: any;
 *   isOnline?: boolean;
 *   executor: (item: any, updateItem: (patch: Record<string, any>) => void) => Promise<void>;
 * }} options
 */
export async function flushOfflineOutbox({
  panelId = "sales",
  userId = undefined,
  storage = undefined,
  isOnline = undefined,
  executor,
}) {
  const pendingItems = readOfflineOutbox(panelId, userId, storage).filter(
    (item) => item.status === "pending" || item.status === "syncing",
  );
  if (!pendingItems.length) {
    const counts = getOfflineOutboxCounts(panelId, userId, storage);
    return {
      syncedCount: 0,
      failedCount: counts.failed,
      remainingCount: counts.pending,
      stoppedOffline: false,
      authExpired: false,
    };
  }
  if (isNetworkOfflineError(null, isOnline)) {
    const counts = getOfflineOutboxCounts(panelId, userId, storage);
    return {
      syncedCount: 0,
      failedCount: counts.failed,
      remainingCount: counts.pending,
      stoppedOffline: true,
      authExpired: false,
    };
  }

  let syncedCount = 0;
  let stoppedOffline = false;
  let authExpired = false;

  for (const entry of pendingItems) {
    updateOfflineOutboxItem(
      panelId,
      entry.id,
      (cur) => (cur ? { ...cur, status: "syncing", attempts: (cur.attempts || 0) + 1 } : null),
      storage,
    );
    const updateCurrentItem = (patch) => {
      updateOfflineOutboxItem(
        panelId,
        entry.id,
        (cur) => (cur ? { ...cur, ...patch } : null),
        storage,
      );
    };

    try {
      await executor(entry, updateCurrentItem);
      removeOfflineOutboxItem(panelId, entry.id, storage);
      syncedCount++;
    } catch (err) {
      const msg = String(err?.message || "Sync failed");
      if (err && typeof err === "object" && err.status === 401) {
        updateOfflineOutboxItem(
          panelId,
          entry.id,
          (cur) => (cur ? { ...cur, status: "pending", lastError: msg } : null),
          storage,
        );
        authExpired = true;
        break;
      }
      if (isNetworkOfflineError(err, isOnline)) {
        updateOfflineOutboxItem(
          panelId,
          entry.id,
          (cur) => (cur ? { ...cur, status: "pending", lastError: msg } : null),
          storage,
        );
        stoppedOffline = true;
        break;
      }
      updateOfflineOutboxItem(
        panelId,
        entry.id,
        (cur) => (cur ? { ...cur, status: "failed", lastError: msg } : null),
        storage,
      );
    }
  }

  const after = getOfflineOutboxCounts(panelId, userId, storage);
  return {
    syncedCount,
    failedCount: after.failed,
    remainingCount: after.pending,
    stoppedOffline,
    authExpired,
  };
}


/**
 * Normalizes a battery telemetry snapshot from Android's DeviceBatteryBridge or Web Battery API.
 * @param {string | { available?: boolean; level?: number; charging?: boolean } | null | undefined} input
 */
export function parseBatteryBridgePayload(input) {
  const unavailable = {
    available: false,
    level: 1,
    charging: false,
  };
  if (!input) return unavailable;
  let obj = input;
  if (typeof input === "string") {
    try {
      obj = JSON.parse(input);
    } catch {
      return unavailable;
    }
  }
  if (!obj || typeof obj !== "object") return unavailable;
  const available = obj.available !== false && typeof obj.level === "number" && Number.isFinite(obj.level);
  if (!available) return unavailable;
  const level = Math.min(1, Math.max(0, Number(obj.level)));
  return {
    available: true,
    level,
    charging: Boolean(obj.charging),
  };
}

/**
 * Formats normalized battery state for the Android Sales header indicator.
 * @param {{ available?: boolean; level?: number; charging?: boolean }} status
 */
export function formatBatteryStatus(status = {}) {
  const available = Boolean(status?.available);
  if (!available) {
    return {
      visible: false,
      percent: 100,
      text: "",
      tone: /** @type {"normal" | "low" | "critical" | "charging"} */ ("normal"),
      charging: false,
      accessibleLabel: "",
    };
  }
  const rawLevel = typeof status.level === "number" && Number.isFinite(status.level) ? status.level : 1;
  const percent = Math.round(Math.min(1, Math.max(0, rawLevel)) * 100);
  const charging = Boolean(status.charging);
  const tone = charging
    ? "charging"
    : percent <= 15
      ? "critical"
      : percent <= 25
        ? "low"
        : "normal";

  const accessibleLabel = charging
    ? `Battery ${percent}%, charging`
    : tone === "critical" || tone === "low"
      ? `Low battery ${percent}%`
      : `Battery ${percent}%`;

  return {
    visible: true,
    percent,
    text: `${percent}%`,
    tone,
    charging,
    accessibleLabel,
  };
}

export const LOW_BATTERY_WARNING_THRESHOLD = 15;

/**
 * Returns true when device battery telemetry is available, unplugged,
 * and strictly below the warning threshold (default: < 15%).
 * @param {{ visible?: boolean; percent?: number; charging?: boolean } | null | undefined} formattedStatus
 * @param {number} [thresholdPercent]
 */
export function shouldWarnLowBattery(
  formattedStatus,
  thresholdPercent = LOW_BATTERY_WARNING_THRESHOLD,
) {
  if (!formattedStatus || !formattedStatus.visible) return false;
  if (formattedStatus.charging) return false;
  if (typeof formattedStatus.percent !== "number" || !Number.isFinite(formattedStatus.percent)) {
    return false;
  }
  return formattedStatus.percent < thresholdPercent;
}


