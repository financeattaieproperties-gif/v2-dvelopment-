import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROLE_DASHBOARD_LAYOUT_MAP } from '../../../packages/staff-contracts/role-preference.mjs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const CHROMIUM_EXECUTABLE =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell';

const TAB_LABELS = {
  overview: 'Overview',
  leaderboard: 'Weekly Leaderboard',
  followups: 'Follow-ups',
  customers: 'Customers',
  leads: 'Leads',
  projects: 'Pre-Sale Projects',
  contracts: 'HR Contracts',
  finance: 'Finance Ledger',
  marketing: 'Marketing & Media',
  deliverables: 'Engineering',
  submissions: 'Submissions',
  tasks: 'My Tasks',
  team: 'Team tasks',
};

const STAFF_LOGIN_PANELS = [
  {
    panelId: 'ceo',
    path: '/ceo/',
    expectedHeading: 'CEO Executive Workspace',
    expectedRoleText: 'CEO (Global Authority)',
  },
  {
    panelId: 'management',
    path: '/management/',
    expectedHeading: 'Branch Manager Workspace',
    expectedRoleText: 'Branch & Operations Manager',
  },
  {
    panelId: 'sales-leader',
    path: '/sales-leader/',
    expectedHeading: 'Sales Team Leader Workspace',
    expectedRoleText: 'Sales Team Leader',
  },
  {
    panelId: 'sales',
    path: '/sales/',
    expectedHeading: 'Sales Agent Workspace',
    expectedRoleText: 'Sales Agent',
  },
  {
    panelId: 'callcenter',
    path: '/callcenter/',
    expectedHeading: 'Call Center Workspace',
    expectedRoleText: 'Call Center Agent',
  },
  {
    panelId: 'finance',
    path: '/finance/',
    expectedHeading: 'Finance Manager Workspace',
    expectedRoleText: 'Finance Manager',
  },
  {
    panelId: 'marketing',
    path: '/marketing/',
    expectedHeading: 'Marketing & Media Workspace',
    expectedRoleText: 'Marketing',
  },
  {
    panelId: 'engineering',
    path: '/engineering/',
    expectedHeading: 'Engineering & 3D Workspace',
    expectedRoleText: 'Architect',
  },
];

const ROLE_WORKSPACES = [
  { role: 'ceo', panelPath: '/ceo/', expectedDefaultHeading: 'Overview' },
  { role: 'manager', panelPath: '/management/', expectedDefaultHeading: 'Overview' },
  { role: 'ceo', panelPath: '/management/', expectedDefaultHeading: 'Overview' },
  { role: 'sales_leader', panelPath: '/sales-leader/', expectedDefaultHeading: 'Leads' },
  { role: 'sales', panelPath: '/sales/', expectedDefaultHeading: 'Leads' },
  { role: 'callcenter', panelPath: '/callcenter/', expectedDefaultHeading: 'Follow-ups' },
  { role: 'finance_manager', panelPath: '/finance/', expectedDefaultHeading: 'Finance Ledger' },
  { role: 'marketing_manager', panelPath: '/marketing/', expectedDefaultHeading: 'Marketing & Media' },
  { role: 'videographer', panelPath: '/marketing/', expectedDefaultHeading: 'Marketing & Media' },
  { role: 'editor', panelPath: '/marketing/', expectedDefaultHeading: 'Marketing & Media' },
  { role: 'architect', panelPath: '/engineering/', expectedDefaultHeading: 'Engineering' },
  { role: 'graphic_designer', panelPath: '/engineering/', expectedDefaultHeading: 'Engineering' },
  { role: 'visual_designer_3d', panelPath: '/engineering/', expectedDefaultHeading: 'Engineering' },
];

function createErrorCollectors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  const httpErrors = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('WebSocket') && !text.includes('ws://')) {
        consoleErrors.push(text);
      }
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      httpErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  return {
    reset() {
      pageErrors.length = 0;
      consoleErrors.length = 0;
      httpErrors.length = 0;
    },
    assertClean(label) {
      assert.deepEqual(pageErrors, [], `[${label}] Unexpected pageerror: ${pageErrors.join(' | ')}`);
      assert.deepEqual(consoleErrors, [], `[${label}] Unexpected console.error: ${consoleErrors.join(' | ')}`);
      assert.deepEqual(httpErrors, [], `[${label}] Unexpected HTTP >=400: ${httpErrors.join(' | ')}`);
    },
  };
}

async function assertNoHorizontalOverflow(page, label) {
  const dims = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    dims.scrollWidth <= dims.clientWidth + 2,
    `[${label}] Horizontal overflow detected: scrollWidth=${dims.scrollWidth} > clientWidth=${dims.clientWidth}`,
  );
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_EXECUTABLE,
  });

  const report = {
    baseUrl: BASE_URL,
    adminRoutesTested: [],
    loginPanelsTested: [],
    roleWorkspacesTested: [],
  };

  try {
    // -----------------------------------------------------------------------
    // 1. Admin CRM Panel (/admin/) — Login & All 11 Routes
    // -----------------------------------------------------------------------
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = createErrorCollectors(page);

      await page.goto(`${BASE_URL}/admin/`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Website Admin CRM' }).waitFor();
      assert.equal(await page.locator('[data-panel-id="admin"]').count(), 1);
      errors.assertClean('admin:login');

      await page.locator('#admin-login-username').fill('admin@example.test');
      await page.locator('#admin-login-password').fill('fictional-preview-pass');
      await page.getByRole('button', { name: /Sign in/i }).click();
      await page.waitForURL(/\/admin\/properties/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      errors.assertClean('admin:post-login');

      const adminRoutes = [
        '/admin/properties',
        '/admin/projects',
        '/admin/tasks',
        '/admin/leads',
        '/admin/chat',
        '/admin/visits',
        '/admin/agents',
        '/admin/branches',
        '/admin/careers',
        '/admin/seo',
        '/admin/settings',
      ];

      for (const route of adminRoutes) {
        errors.reset();
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
        await assertNoHorizontalOverflow(page, `admin:${route}:1440`);
        errors.assertClean(`admin:${route}`);
        report.adminRoutesTested.push(route);
      }

      // Responsive mobile check on /admin/leads
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE_URL}/admin/leads`, { waitUntil: 'networkidle' });
      await assertNoHorizontalOverflow(page, 'admin:/admin/leads:375');
      errors.assertClean('admin:mobile');

      await context.close();
      console.log(`PASS Admin CRM panel (/admin/): login + all ${adminRoutes.length} routes clean`);
    }

    // -----------------------------------------------------------------------
    // 2. All 8 Staff Login Screens (without ?preview=1)
    // -----------------------------------------------------------------------
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = createErrorCollectors(page);

      for (const panel of STAFF_LOGIN_PANELS) {
        errors.reset();
        await page.route('**/staff-api/v1/session', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { user: null, csrfToken: 'test-csrf', serverTime: new Date().toISOString() },
            }),
          });
        });

        await page.goto(`${BASE_URL}${panel.path}`, { waitUntil: 'networkidle' });
        await page.locator(`[data-panel-id="${panel.panelId}"]`).waitFor();
        await page.getByRole('heading', { name: panel.expectedHeading, exact: true }).waitFor();
        const roleBoxText = await page.locator('.login-card').innerText();
        assert.ok(
          roleBoxText.includes(panel.expectedRoleText),
          `[${panel.path}] Expected login role badge "${panel.expectedRoleText}", got: ${roleBoxText}`,
        );
        await assertNoHorizontalOverflow(page, `login:${panel.path}`);
        errors.assertClean(`login:${panel.path}`);
        report.loginPanelsTested.push(panel.panelId);
        await page.unroute('**/staff-api/v1/session');
      }

      await context.close();
      console.log(`PASS All ${STAFF_LOGIN_PANELS.length} dedicated staff login screens rendered cleanly`);
    }

    // -----------------------------------------------------------------------
    // 3. All 12 Active Roles Across Their Dedicated Panels (?preview=1)
    // -----------------------------------------------------------------------
    for (const target of ROLE_WORKSPACES) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = createErrorCollectors(page);

      const layout = ROLE_DASHBOARD_LAYOUT_MAP[target.role];
      assert.ok(layout, `Missing layout spec for role ${target.role}`);

      const url = `${BASE_URL}${target.panelPath}?preview=1&role=${target.role}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait for main heading & shell to load
      await page.locator('.staff-shell').waitFor();
      const h1 = await page.locator('main.content .page-heading h1').innerText();
      assert.equal(
        h1.trim(),
        target.expectedDefaultHeading,
        `[${target.panelPath} role=${target.role}] Expected default heading "${target.expectedDefaultHeading}", got "${h1}"`,
      );

      // Verify exact nav tabs match allowedPages (excluding 'profile', which lives in pillar footer & account button)
      const expectedTabs = layout.allowedPages.filter((p) => p !== 'profile');
      const renderedTabIds = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid^="nav-tab-"]')).map((el) =>
          el.getAttribute('data-testid')?.replace('nav-tab-', ''),
        ),
      );
      assert.deepEqual(
        [...renderedTabIds].sort(),
        [...expectedTabs].sort(),
        `[${target.panelPath} role=${target.role}] Rendered tabs mismatch allowedPages`,
      );

      // Verify unauthorized tabs are strictly absent
      const allModuleTabs = Object.keys(TAB_LABELS);
      for (const tabId of allModuleTabs) {
        if (!expectedTabs.includes(tabId)) {
          const count = await page.getByTestId(`nav-tab-${tabId}`).count();
          assert.equal(
            count,
            0,
            `[${target.panelPath} role=${target.role}] Unauthorized tab "${tabId}" should NOT be rendered`,
          );
        }
      }

      // Click through EVERY allowed module tab + Profile
      for (const tabId of expectedTabs) {
        await page.getByTestId(`nav-tab-${tabId}`).click();
        await page.getByRole('heading', { level: 1, name: TAB_LABELS[tabId], exact: true }).waitFor();
        await assertNoHorizontalOverflow(page, `${target.role}:${tabId}:1440`);
      }

      // Visit Profile view
      await page.locator('.pillar-rail-foot button[aria-label="Profile"]').click();
      await page.getByRole('heading', { level: 1, name: 'Profile', exact: true }).waitFor();
      await assertNoHorizontalOverflow(page, `${target.role}:profile:1440`);

      // Test sidebar compact toggle
      const compactBtn = page.getByTestId('staff-sidebar-compact-toggle');
      await compactBtn.click();
      assert.equal(await page.locator('.staff-shell').getAttribute('data-sidebar-mode'), 'compact');
      await compactBtn.click();
      assert.equal(await page.locator('.staff-shell').getAttribute('data-sidebar-mode'), 'expanded');

      // Test role-specific core workflow UI controls
      if (target.role === 'callcenter' || target.role === 'sales') {
        await page.getByTestId('nav-tab-leads').click();
        await page.getByTestId('new-entry-btn').click();
        await page.locator('.modal').waitFor();
        await page.locator('.modal button[aria-label="Close"]').click();
      } else if (target.role === 'manager') {
        await page.getByTestId('nav-tab-projects').click();
        await page.getByTestId('open-project-wizard-btn').click();
        await page.getByTestId('wizard-step-1').waitFor();
      } else if (target.role === 'ceo') {
        await page.getByTestId('nav-tab-projects').click();
        await page.getByTestId('inventory-projects-section').waitFor();
        assert.equal(await page.getByTestId('open-project-wizard-btn').count(), 0);
      } else if (target.role === 'finance_manager') {
        await page.getByTestId('nav-tab-finance').click();
        await page.locator('h1', { hasText: 'Finance Ledger' }).waitFor();
      } else if (target.role === 'marketing_manager' || target.role === 'videographer' || target.role === 'editor') {
        await page.getByTestId('nav-tab-marketing').click();
        await page.locator('h1', { hasText: 'Marketing & Media' }).waitFor();
      } else if (
        target.role === 'architect' ||
        target.role === 'graphic_designer' ||
        target.role === 'visual_designer_3d'
      ) {
        await page.getByTestId('nav-tab-deliverables').click();
        await page.locator('h1', { hasText: 'Engineering' }).waitFor();
      }

      // Test Dari/RTL language toggle on non-callcenter roles
      if (target.role !== 'callcenter') {
        await page.getByTestId('staff-language-toggle').click();
        assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
        await assertNoHorizontalOverflow(page, `${target.role}:rtl:1440`);
        await page.getByTestId('staff-language-toggle').click();
        assert.equal(await page.evaluate(() => document.documentElement.dir), 'ltr');
      }

      // Test Mobile Viewport (375x812) and mobile drawer navigation
      await page.setViewportSize({ width: 375, height: 812 });
      const mobileMenuBtn = page.locator('button.mobile-menu');
      if (await mobileMenuBtn.isVisible()) {
        await mobileMenuBtn.click();
        await page.getByTestId(`nav-tab-${layout.defaultPage}`).click();
      }
      await assertNoHorizontalOverflow(page, `${target.role}:${layout.defaultPage}:375`);

      errors.assertClean(`${target.panelPath} role=${target.role}`);
      report.roleWorkspacesTested.push({
        panelPath: target.panelPath,
        role: target.role,
        defaultHeading: h1,
        tabsVerified: expectedTabs,
      });

      await context.close();
      console.log(
        `PASS ${target.panelPath} (role=${target.role}): default="${h1}", ${expectedTabs.length} tabs + Profile + responsive RTL/mobile OK`,
      );
    }

    await fs.mkdir(path.join(process.cwd(), 'test-results/staff'), { recursive: true });
    await fs.writeFile(
      path.join(process.cwd(), 'test-results/staff/all-panels-roles-report.json'),
      JSON.stringify({ passed: true, timestamp: new Date().toISOString(), ...report }, null, 2),
      'utf8',
    );
    console.log('\nALL PANELS & ALL ROLES VERIFIED SUCCESSFULLY.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('ALL-PANELS-ROLES TEST FAILED:', err);
  process.exit(1);
});
