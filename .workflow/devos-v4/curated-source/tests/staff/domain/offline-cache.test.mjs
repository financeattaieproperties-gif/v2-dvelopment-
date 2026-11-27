import test from "node:test";
import assert from "node:assert/strict";
import {
  clearOfflineOutbox,
  clearOfflineSnapshot,
  enqueueOfflineEntry,
  flushOfflineOutbox,
  formatBatteryStatus,
  getOfflineOutboxCounts,
  getOfflineSnapshotKey,
  isNetworkOfflineError,
  LOW_BATTERY_WARNING_THRESHOLD,
  parseBatteryBridgePayload,
  readOfflineOutbox,
  readOfflineSnapshot,
  readOfflineViewData,
  retryFailedOfflineOutboxItems,
  shouldWarnLowBattery,
  writeOfflineSessionUser,
  writeOfflineViewData,
} from "../../../packages/staff-contracts/offline-cache.mjs";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("isNetworkOfflineError separates network dropouts from HTTP 401/403/400 errors", () => {
  const netErr = Object.assign(new Error("Failed to fetch"), {
    isNetworkError: true,
  });
  assert.equal(isNetworkOfflineError(netErr, true), true);
  assert.equal(isNetworkOfflineError(new Error("TypeError: Load failed"), true), true);
  assert.equal(isNetworkOfflineError(null, false), true);

  const authErr = Object.assign(new Error("Session expired"), { status: 401 });
  assert.equal(isNetworkOfflineError(authErr, true), false);

  const validationErr = Object.assign(new Error("Invalid input"), { status: 400 });
  assert.equal(isNetworkOfflineError(validationErr, true), false);
});

test("offline cache persists Sales Agent session and leads, supports offline search, isolates users, and clears on sign-out", () => {
  const storage = createMemoryStorage();
  const salesUser = {
    id: 9,
    name: "Fictional Sales Agent",
    username: "sales9@example.invalid",
    role: "sales",
  };

  assert.equal(writeOfflineSessionUser("sales", salesUser, storage), true);
  const sampleLeadsPayload = {
    leads: [
      {
        id: 101,
        serial: "CA09-L1-141126",
        customerName: "Fictional Buyer Alpha",
        phone: "+93700112233",
        projectName: "Sample Residence",
        requirements: "3-bedroom apartment with parking",
        status: "active",
      },
      {
        id: 102,
        serial: "CA09-L2-141126",
        customerName: "Fictional Buyer Beta",
        phone: "+93788990011",
        projectName: "Sample Villa",
        requirements: "Commercial space ground floor",
        status: "draft",
      },
    ],
    followups: [],
    customers: [],
    tasks: [],
    counts: { newLeads: 1 },
    page: 0,
    serverTime: "2026-11-14T10:00:00.000Z",
  };

  // Should ignore searched/paginated responses so partial search never overwrites full lead list
  assert.equal(
    writeOfflineViewData("sales", "leads", sampleLeadsPayload, {
      query: "Alpha",
      page: 0,
      storage,
    }),
    false,
  );

  // Store clean full leads list
  assert.equal(
    writeOfflineViewData("sales", "leads", sampleLeadsPayload, {
      query: "",
      page: 0,
      storage,
    }),
    true,
  );

  // Reloading offline returns session user and full leads list
  const restored = readOfflineSnapshot("sales", storage);
  assert.equal(restored?.user?.username, "sales9@example.invalid");

  const fullOfflineLeads = readOfflineViewData("sales", "leads", "", storage);
  assert.equal(fullOfflineLeads?.data?.leads.length, 2);

  // Offline search filters cached leads accurately by name or phone
  const filteredByPhone = readOfflineViewData("sales", "leads", "788990011", storage);
  assert.equal(filteredByPhone?.data?.leads.length, 1);
  assert.equal(filteredByPhone?.data?.leads[0].customerName, "Fictional Buyer Beta");

  // Switching to a different user resets prior user's cached leads
  assert.equal(
    writeOfflineSessionUser(
      "sales",
      { id: 14, name: "Other Agent", username: "sales14@example.invalid", role: "sales" },
      storage,
    ),
    true,
  );
  assert.equal(readOfflineViewData("sales", "leads", "", storage), null);

  // Clear on sign out removes storage entry completely
  clearOfflineSnapshot("sales", storage);
  assert.equal(storage.getItem(getOfflineSnapshotKey("sales")), null);
  assert.equal(readOfflineSnapshot("sales", storage), null);
});

test("parseBatteryBridgePayload and formatBatteryStatus handle normal, low, critical, charging, and unavailable states", () => {
  assert.equal(parseBatteryBridgePayload(null).available, false);
  assert.equal(parseBatteryBridgePayload("{broken").available, false);

  const parsed = parseBatteryBridgePayload(
    JSON.stringify({ available: true, level: 0.724, charging: false }),
  );
  assert.equal(parsed.available, true);
  assert.equal(parsed.charging, false);

  const normal = formatBatteryStatus(parsed);
  assert.equal(normal.visible, true);
  assert.equal(normal.percent, 72);
  assert.equal(normal.text, "72%");
  assert.equal(normal.tone, "normal");

  const low = formatBatteryStatus({ available: true, level: 0.22, charging: false });
  assert.equal(low.tone, "low");
  assert.equal(low.text, "22%");

  const critical = formatBatteryStatus({ available: true, level: 0.12, charging: false });
  assert.equal(critical.tone, "critical");
  assert.equal(critical.text, "12%");

  const charging = formatBatteryStatus({ available: true, level: 0.14, charging: true });
  assert.equal(charging.tone, "charging");
  assert.equal(charging.accessibleLabel, "Battery 14%, charging");

  const unavailable = formatBatteryStatus({ available: false });
  assert.equal(unavailable.visible, false);
});

test("shouldWarnLowBattery warns strictly below 15% when unplugged and clears on charge or recovery", () => {
  assert.equal(LOW_BATTERY_WARNING_THRESHOLD, 15);
  assert.equal(
    shouldWarnLowBattery(formatBatteryStatus({ available: true, level: 0.14, charging: false })),
    true,
  );
  assert.equal(
    shouldWarnLowBattery(formatBatteryStatus({ available: true, level: 0.05, charging: false })),
    true,
  );
  assert.equal(
    shouldWarnLowBattery(formatBatteryStatus({ available: true, level: 0.15, charging: false })),
    false,
  );
  assert.equal(
    shouldWarnLowBattery(formatBatteryStatus({ available: true, level: 0.1, charging: true })),
    false,
  );
  assert.equal(
    shouldWarnLowBattery(formatBatteryStatus({ available: false, level: 0.05, charging: false })),
    false,
  );
});

test("offline outbox queues entries per user and flushes them in order when online is restored", async () => {
  const storage = createMemoryStorage();

  const item1 = enqueueOfflineEntry(
    "sales",
    9,
    {
      kind: "lead_entry",
      idempotencyKey: "key-lead-1",
      payload: {
        draft: { phone: "0700112233", callAt: "2026-11-16T08:00:00.000Z", source: "manual" },
        entry: { customerName: "Fictional Prospect One", requirements: "2BR", nextScheduledAt: "2026-11-17T08:00:00.000Z", nextAssigneeId: 9 },
        draftKey: "draft-key-1",
        entryKey: "key-lead-1",
      },
    },
    storage,
  );
  const item2 = enqueueOfflineEntry(
    "sales",
    9,
    {
      kind: "followup_feedback",
      idempotencyKey: "key-feedback-2",
      payload: { taskId: 44, body: { outcome: "followup", version: 2, notes: "Called while offline" } },
    },
    storage,
  );
  // Separate user entry must remain isolated
  enqueueOfflineEntry(
    "sales",
    14,
    {
      kind: "task_status",
      idempotencyKey: "key-other-user",
      payload: { taskId: 5, status: "completed", version: 1 },
    },
    storage,
  );

  assert.ok(item1 && item2);
  assert.deepEqual(getOfflineOutboxCounts("sales", 9, storage), {
    pending: 2,
    syncing: 0,
    failed: 0,
    total: 2,
  });

  // Still offline -> does not invoke executor and leaves entries pending
  let calls = [];
  const offlineResult = await flushOfflineOutbox({
    panelId: "sales",
    userId: 9,
    storage,
    isOnline: false,
    executor: async (entry) => {
      calls.push(entry.id);
    },
  });
  assert.equal(offlineResult.stoppedOffline, true);
  assert.equal(offlineResult.remainingCount, 2);
  assert.equal(calls.length, 0);

  // Simulate online restored, transient failure on item2 after item1 succeeds & records draft id
  calls = [];
  const firstOnlinePass = await flushOfflineOutbox({
    panelId: "sales",
    userId: 9,
    storage,
    isOnline: true,
    executor: async (entry, updateItem) => {
      calls.push(entry.kind);
      if (entry.kind === "lead_entry") {
        updateItem({ payload: { ...entry.payload, existingLeadId: 501, existingLeadVersion: 1 } });
        return;
      }
      throw Object.assign(new Error("Failed to fetch"), { isNetworkError: true });
    },
  });
  assert.equal(firstOnlinePass.syncedCount, 1);
  assert.equal(firstOnlinePass.stoppedOffline, true);
  assert.equal(firstOnlinePass.remainingCount, 1);
  assert.deepEqual(calls, ["lead_entry", "followup_feedback"]);

  // Next periodic sync succeeds cleanly for item2
  const secondOnlinePass = await flushOfflineOutbox({
    panelId: "sales",
    userId: 9,
    storage,
    isOnline: true,
    executor: async (entry) => {
      assert.equal(entry.idempotencyKey, "key-feedback-2");
    },
  });
  assert.equal(secondOnlinePass.syncedCount, 1);
  assert.equal(secondOnlinePass.remainingCount, 0);
  assert.equal(readOfflineOutbox("sales", 9, storage).length, 0);

  // Other user's entry was untouched
  assert.equal(readOfflineOutbox("sales", 14, storage).length, 1);
  clearOfflineOutbox("sales", 14, storage);
  assert.equal(readOfflineOutbox("sales", 14, storage).length, 0);
});

test("flushOfflineOutbox marks permanent 4xx errors as failed for manual retry and preserves pending items on 401", async () => {
  const storage = createMemoryStorage();
  enqueueOfflineEntry(
    "sales",
    9,
    {
      kind: "task_status",
      idempotencyKey: "key-task-1",
      payload: { taskId: 10, status: "completed", version: 1 },
    },
    storage,
  );
  enqueueOfflineEntry(
    "sales",
    9,
    {
      kind: "task_create",
      idempotencyKey: "key-task-2",
      payload: { body: { title: "Follow up" } },
    },
    storage,
  );

  // 422 on first item marks it failed, 401 on second halts with authExpired while preserving pending
  const res1 = await flushOfflineOutbox({
    panelId: "sales",
    userId: 9,
    storage,
    isOnline: true,
    executor: async (entry) => {
      if (entry.id === "key-task-1") {
        throw Object.assign(new Error("Task version conflict"), { status: 422 });
      }
      throw Object.assign(new Error("Please sign in."), { status: 401 });
    },
  });
  assert.equal(res1.authExpired, true);
  assert.equal(res1.failedCount, 1);
  assert.equal(res1.remainingCount, 1);

  // Re-enabling failed entries resets failed -> pending
  assert.equal(retryFailedOfflineOutboxItems("sales", 9, storage), 1);
  assert.deepEqual(getOfflineOutboxCounts("sales", 9, storage), {
    pending: 2,
    syncing: 0,
    failed: 0,
    total: 2,
  });

  const res2 = await flushOfflineOutbox({
    panelId: "sales",
    userId: 9,
    storage,
    isOnline: true,
    executor: async () => {},
  });
  assert.equal(res2.syncedCount, 2);
  assert.equal(res2.remainingCount, 0);
});



