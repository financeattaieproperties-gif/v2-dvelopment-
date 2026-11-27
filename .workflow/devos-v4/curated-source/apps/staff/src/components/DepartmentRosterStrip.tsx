import React, { useState } from "react";
import { Building2, ChevronDown, ChevronUp, Users } from "lucide-react";
import type { Branch, StaffUser } from "../../../../packages/staff-contracts/types";

export const STAFF_ROLE_LABELS: Record<string, string> = {
  ceo: "CEO",
  manager: "Manager",
  sales_leader: "Sales Team Leader",
  sales: "Sales Agent",
  callcenter: "Call Center Agent",
  marketing_manager: "Marketing Manager",
  editor: "Editor",
  videographer: "Videographer",
  finance_manager: "Finance Manager",
  architect: "Architect",
  graphic_designer: "Graphic Designer",
  visual_designer_3d: "3D Visualization Engineer",
};

export function resolveUserDepartmentLabel(user: StaffUser): string {
  const dept = (user.departmentCode || "").toLowerCase();
  if (
    dept === "engineering" ||
    ["architect", "graphic_designer", "visual_designer_3d"].includes(user.role)
  ) {
    return "Engineering & 3D";
  }
  if (
    dept === "marketing" ||
    dept === "production" ||
    ["marketing_manager", "videographer", "editor"].includes(user.role)
  ) {
    return "Marketing & Media";
  }
  if (dept === "finance" || user.role === "finance_manager") {
    return "Finance";
  }
  if (dept === "callcenter" || user.role === "callcenter") {
    return "Call Center";
  }
  if (dept === "sales" || ["sales_leader", "sales"].includes(user.role)) {
    return "Sales";
  }
  if (dept === "hr") {
    return "HR & Contracts";
  }
  if (
    dept === "management" ||
    dept === "administration" ||
    ["ceo", "manager"].includes(user.role)
  ) {
    return "Management & Operations";
  }
  return user.departmentCode || "Operations";
}

export function resolveUserBranchLabel(
  user: StaffUser,
  branches?: Branch[],
): string {
  if (user.role === "ceo" || user.branchId === null || user.branchId === undefined) {
    return "Global Authority";
  }
  if (branches && branches.length > 0) {
    const matched = branches.find((b) => Number(b.id) === Number(user.branchId));
    if (matched?.name) {
      return matched.name;
    }
  }
  if (user.branchName && user.branchName.trim() !== "") {
    return user.branchName;
  }
  if (Number(user.branchId) === 1) {
    return "Main Branch (Kabul)";
  }
  return `Branch #${user.branchId}`;
}

export function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export interface DepartmentStaffResolution {
  page: string;
  title: string;
  subtitle: string;
  staff: StaffUser[];
  count: number;
  branchCounts: Array<{ branchLabel: string; count: number }>;
}

export function getDepartmentStaffForPage(
  page: string,
  users: StaffUser[],
  branches?: Branch[],
): DepartmentStaffResolution {
  const activeUsers = (users || []).filter((u) => u && u.active !== false);

  let title = "All Departments & Branches";
  let subtitle = "Active internal staff across all departments and branches";
  let filtered: StaffUser[] = activeUsers;

  switch (page) {
    case "deliverables":
      title = "Engineering & 3D Department";
      subtitle = "2D Floor Plans, Graphic Design & 3D Visualization Staff";
      filtered = activeUsers.filter(
        (u) =>
          ["architect", "graphic_designer", "visual_designer_3d"].includes(u.role) ||
          (u.departmentCode || "").toLowerCase() === "engineering",
      );
      break;

    case "marketing":
      title = "Marketing & Media Department";
      subtitle = "Property Filming, Video Production & Editing Staff";
      filtered = activeUsers.filter(
        (u) =>
          ["marketing_manager", "videographer", "editor"].includes(u.role) ||
          ["marketing", "production"].includes((u.departmentCode || "").toLowerCase()),
      );
      break;

    case "submissions":
      title = "Submissions & Publishing Department";
      subtitle = "Social Media & Website Publishing Queue Staff";
      filtered = activeUsers.filter(
        (u) =>
          ["marketing_manager", "editor", "videographer"].includes(u.role) ||
          ["marketing", "production"].includes((u.departmentCode || "").toLowerCase()),
      );
      break;

    case "finance":
      title = "Finance Ledger Department";
      subtitle = "Installment Receipts, Vouchers & Treasury Approval Staff";
      filtered = activeUsers.filter(
        (u) =>
          ["finance_manager"].includes(u.role) ||
          (u.departmentCode || "").toLowerCase() === "finance",
      );
      break;

    case "leaderboard":
    case "leads":
    case "followups":
    case "customers":
      title = "Sales & Call Center Department";
      subtitle = "Lead Capture, Customer Follow-Up & Deal Closure Staff";
      filtered = activeUsers.filter(
        (u) =>
          ["sales_leader", "sales", "callcenter"].includes(u.role) ||
          ["sales", "callcenter"].includes((u.departmentCode || "").toLowerCase()),
      );
      break;

    case "contracts":
      title = "HR Contracts & Branch Operations";
      subtitle = "Bilingual Agreement Issuance, Verification & Branch Oversight";
      filtered = activeUsers.filter(
        (u) =>
          ["manager", "ceo", "sales_leader"].includes(u.role) ||
          ["management", "hr"].includes((u.departmentCode || "").toLowerCase()),
      );
      break;

    case "projects":
      title = "Pre-Sale Projects & Branch Operations";
      subtitle = "Inventory Commissioning, Floor Layouts & Sales Team Assignment";
      filtered = activeUsers.filter(
        (u) =>
          ["manager", "ceo", "sales_leader"].includes(u.role) ||
          ["management", "hr"].includes((u.departmentCode || "").toLowerCase()),
      );
      break;

    case "team":
    case "overview":
    case "tasks":
    default:
      title = "All Departments & Branches Roster";
      subtitle = "Complete internal organization directory across branches and departments";
      filtered = activeUsers;
      break;
  }

  const branchMap = new Map<string, number>();
  for (const member of filtered) {
    const label = resolveUserBranchLabel(member, branches);
    branchMap.set(label, (branchMap.get(label) || 0) + 1);
  }

  const branchCounts = Array.from(branchMap.entries()).map(([branchLabel, count]) => ({
    branchLabel,
    count,
  }));

  return {
    page,
    title,
    subtitle,
    staff: filtered,
    count: filtered.length,
    branchCounts,
  };
}

interface DepartmentBreakdownGroup {
  key: string;
  title: string;
  badgeLabel: string;
  members: StaffUser[];
}

export function buildDepartmentBreakdownGroups(
  users: StaffUser[],
): DepartmentBreakdownGroup[] {
  const activeUsers = (users || []).filter((u) => u && u.active !== false);

  return [
    {
      key: "engineering",
      title: "Engineering",
      badgeLabel: "2D / 3D / Graphic",
      members: activeUsers.filter(
        (u) =>
          ["architect", "graphic_designer", "visual_designer_3d"].includes(u.role) ||
          (u.departmentCode || "").toLowerCase() === "engineering",
      ),
    },
    {
      key: "finance",
      title: "Finance",
      badgeLabel: "Ledger & Treasury",
      members: activeUsers.filter(
        (u) =>
          ["finance_manager"].includes(u.role) ||
          (u.departmentCode || "").toLowerCase() === "finance",
      ),
    },
    {
      key: "sales_callcenter",
      title: "Sales & Call Center",
      badgeLabel: "Pipeline & Intake",
      members: activeUsers.filter(
        (u) =>
          ["sales_leader", "sales", "callcenter"].includes(u.role) ||
          ["sales", "callcenter"].includes((u.departmentCode || "").toLowerCase()),
      ),
    },
    {
      key: "marketing_submissions",
      title: "Marketing & Submissions",
      badgeLabel: "Media & Publishing",
      members: activeUsers.filter(
        (u) =>
          ["marketing_manager", "videographer", "editor"].includes(u.role) ||
          ["marketing", "production"].includes((u.departmentCode || "").toLowerCase()),
      ),
    },
    {
      key: "management_branches",
      title: "Management & Branches",
      badgeLabel: "Executive & HR Contracts",
      members: activeUsers.filter(
        (u) =>
          ["ceo", "manager", "sales_leader"].includes(u.role) ||
          ["management", "hr", "branches", "administration"].includes(
            (u.departmentCode || "").toLowerCase(),
          ),
      ),
    },
  ];
}

export function DepartmentRosterStrip({
  page,
  users,
  branches = [],
  t = (s: string) => s,
}: {
  page: string;
  users: StaffUser[];
  branches?: Branch[];
  t?: (s: string) => string;
}) {
  const showFullBreakdownByDefault = page === "team";
  const [showBreakdown, setShowBreakdown] = useState<boolean>(showFullBreakdownByDefault);

  const resolution = getDepartmentStaffForPage(page, users, branches);
  const canToggleBreakdown = page === "team" || page === "overview";
  const breakdownGroups = canToggleBreakdown ? buildDepartmentBreakdownGroups(users) : [];

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t(resolution.title)}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 16,
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
      }}
    >
      {/* Top Header Row: Department Title + Employee Count Badge + Branch Count Pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: resolution.staff.length > 0 ? 10 : 0,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "#E6F2FA",
              color: "#0072BC",
              flexShrink: 0,
            }}
          >
            <Users size={15} />
          </span>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#1E293B",
                  letterSpacing: "-0.01em",
                }}
              >
                {t(resolution.title)}
              </span>

              {/* Primary Logo Blue Employee Count Pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: "#E6F2FA",
                  color: "#0072BC",
                  border: "1px solid rgba(0, 114, 188, 0.22)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {resolution.count}{" "}
                {resolution.count === 1
                  ? t("Employee in Department")
                  : t("Employees in Department")}
              </span>

              {/* Secondary Logo Green Branch Count Pills */}
              {resolution.branchCounts.map((bc) => (
                <span
                  key={bc.branchLabel}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 9px",
                    borderRadius: 999,
                    background: "#E8F7EE",
                    color: "#14A850",
                    border: "1px solid rgba(20, 168, 80, 0.22)",
                    fontSize: 11,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Building2 size={11} />
                  {t(bc.branchLabel)}: {bc.count}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "#818285", marginTop: 2 }}>
              {t(resolution.subtitle)}
            </div>
          </div>
        </div>

        {canToggleBreakdown && (
          <button
            type="button"
            onClick={() => setShowBreakdown((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 11px",
              borderRadius: 7,
              border: "1px solid #E2E8F0",
              background: showBreakdown ? "#E6F2FA" : "#F8FAFC",
              color: showBreakdown ? "#0072BC" : "#1E293B",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showBreakdown
              ? t("Hide Department & Branch Breakdown")
              : t("Department & Branch Breakdown")}
            {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {/* Roster Member Chips */}
      {resolution.staff.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px solid #F1F5F9",
          }}
        >
          {resolution.staff.map((member) => {
            const roleLabel = STAFF_ROLE_LABELS[member.role] || member.role;
            const deptLabel = resolveUserDepartmentLabel(member);
            const branchLabel = resolveUserBranchLabel(member, branches);
            const isGlobal = branchLabel === "Global Authority";

            return (
              <div
                key={member.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px 5px 6px",
                  borderRadius: 8,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  fontSize: 11.5,
                  color: "#1E293B",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: "#0072BC",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(member.name)}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
                  <span style={{ fontWeight: 700, color: "#1E293B" }}>{member.name}</span>
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: 5,
                      background: "#E6F2FA",
                      color: "#0072BC",
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    {t(roleLabel)}
                  </span>
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: 5,
                      background: "#F1F5F9",
                      color: "#64748B",
                      fontSize: 10.5,
                      fontWeight: 500,
                    }}
                  >
                    {t(deptLabel)}
                  </span>
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: 5,
                      background: isGlobal ? "#E6F2FA" : "#E8F7EE",
                      color: isGlobal ? "#0072BC" : "#14A850",
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    {t(branchLabel)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Department & Branch Breakdown Grid (on team / overview) */}
      {canToggleBreakdown && showBreakdown && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #E2E8F0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {breakdownGroups.map((group) => (
            <div
              key={group.key}
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>
                    {t(group.title)}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#818285" }}>{t(group.badgeLabel)}</div>
                </div>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#E6F2FA",
                    color: "#0072BC",
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {group.members.length} {group.members.length === 1 ? t("Staff") : t("Staff")}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {group.members.map((m) => (
                  <div
                    key={`${group.key}-${m.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                      fontSize: 11,
                      padding: "3px 6px",
                      borderRadius: 5,
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#1E293B" }}>{m.name}</span>
                    <span style={{ color: "#0072BC", fontWeight: 500, fontSize: 10.5 }}>
                      {t(STAFF_ROLE_LABELS[m.role] || m.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
