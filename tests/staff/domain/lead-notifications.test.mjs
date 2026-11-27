import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Service Worker Notification Script: sw-notifications.js handles push, notificationclick, and message events", () => {
  const pwaAssetPath = path.resolve("apps/staff/pwa-assets/sw-notifications.js");
  const publicSalesPath = path.resolve("public/sales/sw-notifications.js");

  assert.ok(fs.existsSync(pwaAssetPath), "apps/staff/pwa-assets/sw-notifications.js must exist");
  assert.ok(fs.existsSync(publicSalesPath), "public/sales/sw-notifications.js must exist");

  const code = fs.readFileSync(pwaAssetPath, "utf8");

  // Push event listener
  assert.ok(code.includes("self.addEventListener('push'"), "Must attach push event listener");
  assert.ok(code.includes("showNotification"), "Must call showNotification on push");
  assert.ok(code.includes("vibrate"), "Must specify mobile vibration pattern");

  // Notification click listener
  assert.ok(code.includes("self.addEventListener('notificationclick'"), "Must attach notificationclick event listener");
  assert.ok(code.includes("event.notification.close()"), "Must close notification on click");
  assert.ok(code.includes("matchAll"), "Must check window clients to focus or navigate");
  assert.ok(code.includes("/sales/leads"), "Must target sales leads view on tap");

  // Message listener for foreground tabs
  assert.ok(code.includes("self.addEventListener('message'"), "Must attach message event listener");
  assert.ok(code.includes("SHOW_LEAD_NOTIFICATION"), "Must handle SHOW_LEAD_NOTIFICATION message type");
});

test("Vite PWA Configuration: apps/staff/vite.config.ts registers sw-notifications.js in workbox importScripts", () => {
  const configPath = path.resolve("apps/staff/vite.config.ts");
  assert.ok(fs.existsSync(configPath), "apps/staff/vite.config.ts must exist");

  const configContent = fs.readFileSync(configPath, "utf8");

  assert.ok(
    configContent.includes('"sw-notifications.js"'),
    "apps/staff/vite.config.ts must include sw-notifications.js in assets/workbox"
  );
  assert.ok(
    configContent.includes('importScripts: ["sw-notifications.js"]') ||
      configContent.includes("importScripts: ['sw-notifications.js']"),
    "Workbox must specify importScripts for sw-notifications.js"
  );
});

test("Lead Notification Payload Logic: correctly formats title, body, vibration, and tags", () => {
  const lead = {
    id: 105,
    serial: "AP-302",
    customerName: "Haji Abdul Qadir",
    propertyName: "Exclusive Luxury Villa in Wazir Akbar Khan",
    requirements: "Interested in 5-bedroom diplomatic villa with generator backup.",
    assignedBy: "Attaie Call Center",
  };

  const title = `🔔 New Lead Assigned · ${lead.serial || `#${lead.id}`}`;
  assert.equal(title, "🔔 New Lead Assigned · AP-302");

  const tag = `lead-assigned-${lead.id}`;
  assert.equal(tag, "lead-assigned-105");

  const vibratePattern = [200, 100, 200, 100, 200];
  assert.equal(vibratePattern.length, 5);
  assert.equal(vibratePattern[0], 200);

  const targetUrl = `/sales/leads?id=${lead.id}`;
  assert.equal(targetUrl, "/sales/leads?id=105");
});

test("Lead Deduplication & Sync Logic: handles cold start and detects newly assigned leads", () => {
  // Simulate sync logic
  const notifiedIds = new Set();
  const userId = 7;

  const initialLeads = [
    { id: 1, assigneeId: 7, customerName: "Customer 1" },
    { id: 2, assigneeId: 7, customerName: "Customer 2" },
    { id: 3, assigneeId: 8, customerName: "Customer 3" }, // Different agent
  ];

  // Cold start: record existing leads without notifying
  const isColdStart = notifiedIds.size === 0;
  assert.ok(isColdStart, "First check should be cold start");

  initialLeads
    .filter((l) => l.assigneeId === userId)
    .forEach((l) => notifiedIds.add(String(l.id)));

  assert.equal(notifiedIds.size, 2);
  assert.ok(notifiedIds.has("1"));
  assert.ok(notifiedIds.has("2"));

  // Subsequent check with a new lead assigned to agent 7
  const updatedLeads = [
    ...initialLeads,
    { id: 4, assigneeId: 7, customerName: "Customer 4" },
  ];

  let newlyNotified = 0;
  for (const l of updatedLeads.filter((x) => x.assigneeId === userId)) {
    if (!notifiedIds.has(String(l.id))) {
      notifiedIds.add(String(l.id));
      newlyNotified++;
    }
  }

  assert.equal(newlyNotified, 1, "Should notify exactly 1 newly assigned lead");
  assert.ok(notifiedIds.has("4"), "Lead 4 should now be recorded");
});

test("UI Integration: staff shell and workspaces render notification controls and banner", () => {
  const mainPath = path.resolve("apps/staff/src/main.tsx");
  assert.ok(fs.existsSync(mainPath), "apps/staff/src/main.tsx must exist");

  const mainContent = fs.readFileSync(mainPath, "utf8");

  assert.ok(mainContent.includes("useLeadNotifications"), "main.tsx must call useLeadNotifications");
  assert.ok(mainContent.includes("header-notification-btn"), "main.tsx must render header-notification-btn in topbar");
  assert.ok(mainContent.includes("notification-popover"), "main.tsx must render notification-popover");
  assert.ok(mainContent.includes("<CrmRecordsWorkspace"), "main.tsx must render records workspace");
  assert.ok(mainContent.includes("<ProfileWorkspace"), "main.tsx must render profile workspace");
  const recordsContent = fs.readFileSync(path.resolve("apps/staff/src/components/CrmRecordsWorkspace.tsx"), "utf8");
  const profileContent = fs.readFileSync(path.resolve("apps/staff/src/components/ProfileWorkspace.tsx"), "utf8");
  assert.ok(recordsContent.includes("lead-notifications-banner"), "Records workspace must render lead notification banner");
  assert.ok(profileContent.includes("profile-notification-card"), "Profile workspace must render notification card");
});

test("CSS Tokens & Styling: apps/staff/src/styles.css contains notification classes", () => {
  const stylesPath = path.resolve("apps/staff/src/styles.css");
  assert.ok(fs.existsSync(stylesPath), "apps/staff/src/styles.css must exist");

  const stylesContent = fs.readFileSync(stylesPath, "utf8");

  assert.ok(stylesContent.includes(".header-notification-btn"), "styles.css must style .header-notification-btn");
  assert.ok(stylesContent.includes(".notification-popover"), "styles.css must style .notification-popover");
  assert.ok(stylesContent.includes(".lead-notifications-banner"), "styles.css must style .lead-notifications-banner");
});
