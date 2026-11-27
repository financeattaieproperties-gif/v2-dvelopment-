import { describe, expect, it } from 'vitest';
import {
  ACTIVE_INTERNAL_ROLES,
  RETIRED_INTERNAL_ROLES,
  canProvisionRole,
  canReadBranch,
  isGlobalRole,
  requiresBranch,
  validateBranchAssignment,
} from '../branch-policy.mjs';
import {
  PANEL_SPECS,
  ROLE_DASHBOARD_LAYOUT_MAP,
  getRoleDashboardLayout,
  isValidWorkspaceRole,
  resolvePageForRole,
  resolvePanelSpec,
} from '../role-preference.mjs';
import {
  canAccessDatabase,
  canAssignTask,
  canViewLead,
  isManagerRole,
} from '../workflow.mjs';

const EXPECTED_PANEL_PATHS = [
  '/ceo',
  '/management',
  '/sales-leader',
  '/sales',
  '/callcenter',
  '/finance',
  '/marketing',
  '/engineering',
] as const;

describe('All Panels & All Roles — Dedicated Panel Specs & Role Contracts', () => {
  it('defines all 12 active internal roles and maps every active role to a dedicated panel', () => {
    expect(ACTIVE_INTERNAL_ROLES).toHaveLength(12);

    for (const role of ACTIVE_INTERNAL_ROLES) {
      expect(isValidWorkspaceRole(role)).toBe(true);
      const layout = getRoleDashboardLayout(role);
      expect(layout.role).toBe(role);
      expect(EXPECTED_PANEL_PATHS).toContain(layout.workspacePath);
      expect(layout.allowedPages).toContain('overview');
      expect(layout.allowedPages).toContain('tasks');
      expect(layout.allowedPages).toContain('profile');
      expect(layout.allowedPages).toContain(layout.defaultPage);

      const panelSpec = resolvePanelSpec(layout.workspacePath);
      expect(panelSpec.basePath).toBe(layout.workspacePath);
      expect(panelSpec.allowedRoles).toContain(role);
    }
  });

  it('resolves all 8 dedicated staff panels by pathname and subdomain without any unified dashboard URL', () => {
    const specs = Object.values(PANEL_SPECS);
    expect(specs).toHaveLength(8);
    expect(specs.map((s) => s.basePath).sort()).toEqual(
      [...EXPECTED_PANEL_PATHS].sort(),
    );

    for (const spec of specs) {
      // Pathname resolution (root & nested routes)
      expect(resolvePanelSpec(`${spec.basePath}/`).panelId).toBe(spec.panelId);
      expect(resolvePanelSpec(`${spec.basePath}/tasks`).panelId).toBe(spec.panelId);

      // Subdomain resolution
      expect(resolvePanelSpec('/', `${spec.panelId}.attaieproperties.com`).panelId).toBe(
        spec.panelId,
      );

      // Dedicated login copy & allowedRoles non-empty
      expect(spec.loginTitle.length).toBeGreaterThan(3);
      expect(spec.fixedRoleLabel.length).toBeGreaterThan(3);
      expect(spec.allowedRoles.length).toBeGreaterThanOrEqual(1);
    }

    // Legacy /dashboard path is NOT a panel spec
    expect((PANEL_SPECS as Record<string, unknown>).dashboard).toBeUndefined();
    expect(resolvePanelSpec('/dashboard', '', 'sales').panelId).toBe('sales');
  });

  it('rejects all retired roles from workspace access and branch provisioning', () => {
    for (const retiredRole of RETIRED_INTERNAL_ROLES) {
      expect(isValidWorkspaceRole(retiredRole)).toBe(false);
      expect(requiresBranch(retiredRole)).toBe(false);
      expect(canProvisionRole('ceo', retiredRole)).toBe(false);
      expect(() =>
        validateBranchAssignment({
          role: retiredRole,
          branchId: 1,
          branchActive: true,
        }),
      ).toThrowError('Select an active internal role.');
    }
  });

  it('enforces CEO global scope vs mandatory active branch assignment for all non-CEO roles', () => {
    expect(isGlobalRole('ceo')).toBe(true);
    expect(isManagerRole('ceo')).toBe(true);
    expect(requiresBranch('ceo')).toBe(false);
    expect(validateBranchAssignment({ role: 'ceo', branchId: null, branchActive: false })).toEqual({
      role: 'ceo',
      branchId: null,
    });
    expect(() =>
      validateBranchAssignment({ role: 'ceo', branchId: 1, branchActive: true }),
    ).toThrowError('CEO cannot belong to a branch.');

    for (const role of ACTIVE_INTERNAL_ROLES.filter((r) => r !== 'ceo')) {
      expect(isGlobalRole(role)).toBe(false);
      expect(requiresBranch(role)).toBe(true);
      expect(canProvisionRole('ceo', role)).toBe(true);
      expect(
        validateBranchAssignment({ role, branchId: 2, branchActive: true }),
      ).toEqual({ role, branchId: 2 });
      expect(() =>
        validateBranchAssignment({ role, branchId: null, branchActive: true }),
      ).toThrowError('Every active staff account requires one active branch.');
      expect(canReadBranch({ role, active: true, branchId: 2 }, 2)).toBe(true);
      expect(canReadBranch({ role, active: true, branchId: 2 }, 3)).toBe(false);
    }
  });

  it('enforces three-database isolation and department-specific allowed pages across all 12 roles', () => {
    // Admin is strictly isolated to website & submissions, never CRM
    expect(canAccessDatabase('admin', 'website')).toBe(true);
    expect(canAccessDatabase('admin', 'submissions')).toBe('review_and_publish');
    expect(canAccessDatabase('admin', 'crm')).toBe(false);

    for (const role of ACTIVE_INTERNAL_ROLES) {
      expect(canAccessDatabase(role, 'crm')).toBe(true);
      expect(canAccessDatabase(role, 'website')).toBe(false);
    }

    // Submissions DB rules
    for (const mktRole of ['marketing_manager', 'videographer', 'editor']) {
      expect(canAccessDatabase(mktRole, 'submissions')).toBe('submit_and_read');
    }
    for (const engRole of ['architect', 'graphic_designer', 'visual_designer_3d']) {
      expect(canAccessDatabase(engRole, 'submissions')).toBe(false);
    }
    for (const salesRole of ['ceo', 'manager', 'sales_leader', 'sales', 'callcenter', 'finance_manager']) {
      expect(canAccessDatabase(salesRole, 'submissions')).toBe('read_only');
    }

    // Default/requested page resolution never navigates to a disallowed module
    expect(resolvePageForRole('finance_manager', 'leads', false)).toBe('overview');
    expect(resolvePageForRole('finance_manager', 'finance', true)).toBe('finance');
    expect(resolvePageForRole('marketing_manager', 'contracts', false)).toBe('overview');
    expect(resolvePageForRole('architect', 'deliverables', true)).toBe('deliverables');
    expect(resolvePageForRole('callcenter', 'overview', true)).toBe('followups');
    expect(resolvePageForRole('sales', 'overview', true)).toBe('leads');
    expect(resolvePageForRole('sales_leader', 'overview', true)).toBe('leads');
    expect(resolvePageForRole('ceo', 'overview', true)).toBe('overview');
    expect(resolvePageForRole('manager', 'overview', true)).toBe('overview');

    // Sanity check layout map covers exact active role set
    expect(Object.keys(ROLE_DASHBOARD_LAYOUT_MAP).sort()).toEqual(
      [...ACTIVE_INTERNAL_ROLES].sort(),
    );
  });

  it('verifies task delegation and lead visibility boundaries across management, leaders, and specialists', () => {
    const ceo = { id: 1, role: 'ceo', active: true, branchId: null };
    const manager = { id: 2, role: 'manager', active: true, branchId: 1 };
    const salesLeader = { id: 3, role: 'sales_leader', active: true, branchId: 1 };
    const salesAgent = { id: 4, role: 'sales', teamLeaderId: 3, active: true, branchId: 1 };
    const callCenter = { id: 5, role: 'callcenter', active: true, branchId: 1 };
    const mktManager = { id: 6, role: 'marketing_manager', active: true, branchId: 1 };
    const editor = { id: 7, role: 'editor', active: true, branchId: 1 };
    const financeManager = { id: 8, role: 'finance_manager', active: true, branchId: 1 };
    const architect = { id: 9, role: 'architect', active: true, branchId: 1 };

    // Task delegation rules
    expect(canAssignTask(ceo, architect)).toBe(true);
    expect(canAssignTask(manager, salesAgent)).toBe(true);
    expect(canAssignTask(salesLeader, salesAgent)).toBe(true);
    expect(canAssignTask(salesLeader, editor)).toBe(false);
    expect(canAssignTask(mktManager, editor)).toBe(true);
    expect(canAssignTask(mktManager, financeManager)).toBe(false);
    expect(canAssignTask(financeManager, financeManager)).toBe(true);
    expect(canAssignTask(financeManager, salesAgent)).toBe(false);
    expect(canAssignTask(salesAgent, callCenter)).toBe(false);

    // Lead visibility rules
    const lead = { id: 50, originAgentId: 5, assigneeId: 4, sharedAgentIds: [] };
    expect(canViewLead(ceo, lead)).toBe(true);
    expect(canViewLead(salesLeader, lead, [4])).toBe(true);
    expect(canViewLead(salesAgent, lead)).toBe(true);
    expect(canViewLead(callCenter, lead)).toBe(true);
    expect(canViewLead({ id: 99, role: 'sales' }, lead)).toBe(false);
    expect(canViewLead({ id: 99, role: 'sales' }, { ...lead, sharedAgentIds: [99] })).toBe(true);
  });
});
