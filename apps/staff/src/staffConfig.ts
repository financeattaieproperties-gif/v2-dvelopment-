import type {
  Followup,
  Lead,
  ManagementTask,
  Role,
} from "../../../packages/staff-contracts/types";
import {
  resolvePanelSpec,
  resolveWorkspaceRoleOnSignIn,
} from "../../../packages/staff-contracts/role-preference.mjs";
import { api } from "./api";
import { registerSalesServiceWorker } from "./pwa/register";

export type Client = typeof api;
export type Translate = (s: string) => string;

export type Page =
  | "overview"
  | "leaderboard"
  | "followups"
  | "customers"
  | "leads"
  | "tasks"
  | "team"
  | "projects"
  | "contracts"
  | "finance"
  | "marketing"
  | "submissions"
  | "deliverables"
  | "vault"
  | "profile";

export type ModalState = {
  kind:
    | "entry"
    | "feedback"
    | "task"
    | "detail"
    | "assign"
    | "staff"
    | "department";
  item?: Lead | Followup | ManagementTask;
} | null;

export const searchParams = new URLSearchParams(location.search);
export const panelSpec = resolvePanelSpec(
  location.pathname,
  location.hostname,
  __STAFF_ROLE__,
);
export const isDashboardPath = panelSpec.panelId === "dashboard";
export const isPreview =
  (__STAFF_PREVIEW_ALLOWED__ && searchParams.get("preview") === "1") ||
  (__STAFF_PREVIEW_ALLOWED__ && isDashboardPath);
export const management = panelSpec.panelId !== "callcenter";

export const initialRoleParam = searchParams.get("role") as Role | null;
export const initialPreferredRole = (
  initialRoleParam ||
  (panelSpec.panelId !== "dashboard"
    ? panelSpec.defaultRole
    : resolveWorkspaceRoleOnSignIn({
        urlRoleParam: initialRoleParam,
        management,
      }))
) as Role;

document.documentElement.dataset.staffRole =
  panelSpec.panelId === "callcenter"
    ? "callcenter"
    : panelSpec.panelId === "management" || panelSpec.panelId === "ceo"
      ? "management"
      : "dashboard";

export const base = panelSpec.basePath;
registerSalesServiceWorker(panelSpec.panelId);

export const client: Client = isPreview
  ? await import("./preview").then((m) =>
      m.previewClient(management, initialPreferredRole || undefined),
    )
  : api;

export const labels: Record<string, string> = {
  upcoming: "Upcoming",
  due: "Due now",
  overtime: "Overtime",
  completed: "Completed",
  completed_late: "Completed late",
  todo: "To do",
  in_progress: "In progress",
  overdue: "Overdue",
  cancelled: "Cancelled",
  draft: "Needs details",
  active: "Active",
  closed: "Deal closed",
  lost: "Deal lost",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  ceo: "CEO",
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

export const SWITCHABLE_ROLES: { role: Role; label: string }[] = [
  { role: "ceo", label: "CEO (Global Internal CRM Authority)" },
  { role: "manager", label: "Manager (Branch Contracts & Operations)" },
  { role: "sales_leader", label: "Sales Team Leader" },
  { role: "sales", label: "Sales Agent (Pipeline & Deal Closure)" },
  { role: "callcenter", label: "Call Center Agent" },
  { role: "marketing_manager", label: "Marketing Manager (Filming Schedule)" },
  { role: "videographer", label: "Videographer (Filming Completion)" },
  { role: "editor", label: "Editor (Editing & Mark Posted -> Submissions DB)" },
  { role: "finance_manager", label: "Finance Manager (Approve/Post/Reverse)" },
  { role: "architect", label: "Architect (2D Floor Plans)" },
  { role: "graphic_designer", label: "Graphic Designer (Brochures & Print)" },
  { role: "visual_designer_3d", label: "3D Visualization Engineer (3D Renders)" },
];

export const fa: Record<string, string> = management
  ? (await import("./i18n/fa.json")).default
  : {};

export const STAFF_SIDEBAR_COMPACT_KEY = "attaie_staff_sidebar_compact";

export function readStaffSidebarCompact(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.localStorage?.getItem(STAFF_SIDEBAR_COMPACT_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function pageFromPath(): Page {
  const validPages = [
    "overview",
    "followups",
    "customers",
    "leads",
    "tasks",
    "team",
    "projects",
    "contracts",
    "finance",
    "marketing",
    "submissions",
    "deliverables",
    "profile",
  ];
  const queryPage = new URLSearchParams(location.search).get("page");
  if (queryPage && validPages.includes(queryPage)) {
    return queryPage as Page;
  }
  const part = location.pathname.replace(/\/$/, "").split("/").pop();
  return validPages.includes(part || "") && part !== "overview"
    ? (part as Page)
    : "overview";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function toUtc(value: FormDataEntryValue | null): string {
  if (!value) throw new Error("Choose a date and time.");
  return new Date(`${value}:00+04:30`).toISOString();
}

export function localInputNow(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(" ", "T");
}
