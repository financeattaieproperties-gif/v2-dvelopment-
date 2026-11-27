import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  ClipboardList,
  PhoneIncoming,
  Plus,
  ArrowUpRight,
  X,
  Menu,
  LogOut,
  Check,
  ChevronDown,
  Clock3,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Headphones,
  Building2,
  Globe,
  FileText,
  DollarSign,
  Film,
  Send,
  Compass,
  Download,
  LayoutGrid,
  Briefcase,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  WifiOff,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Bell,
  BellRing,
  BellOff,
  Trophy,
} from "lucide-react";
import type {
  DashboardData,
  Followup,
  Lead,
  ManagementTask,
  Role,
  Session,
  StaffUser,
} from "../../../packages/staff-contracts/types";
import {
  canAccessDatabase,
  canAssignTask,
  feedbackDeadline,
  followupState,
  formatLeadsToCsv,
  generateLeadsPdfDocument,
  isManagerRole,
  summarizeLeadsPipeline,
} from "../../../packages/staff-contracts/workflow.mjs";
import {
  ROLE_DASHBOARD_LAYOUT_MAP,
  getMobilePrimaryTabs,
  resolvePageForRole,
  resolveWorkspaceRoleOnSignIn,
  writePreferredWorkspaceRole,
} from "../../../packages/staff-contracts/role-preference.mjs";
import {
  clearOfflineSnapshot,
  flushOfflineOutbox,
  getOfflineOutboxCounts,
  isNetworkOfflineError,
  readOfflineSnapshot,
  readOfflineViewData,
  retryFailedOfflineOutboxItems,
  writeOfflineSessionUser,
  writeOfflineViewData,
} from "../../../packages/staff-contracts/offline-cache.mjs";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { useLowBatteryWarning } from "./hooks/useLowBatteryWarning";
import { useLeadNotifications } from "./hooks/useLeadNotifications";
import { notifyLeadAssigned } from "./pwa/leadNotificationService";
import { WeeklyLeaderboardPage } from "./components/WeeklyLeaderboardPage";
import { ProjectInventoryWizard } from "./components/ProjectInventoryWizard";
import { HrContractsWorkspace } from "./components/HrContractsWorkspace";
import { AgreementVerification } from "./components/AgreementVerification";
import { FinanceWorkspace } from "./components/FinanceWorkspace";
import {
  MarketingWorkspace,
  SubmissionsStatusView,
} from "./components/MarketingWorkspace";
import { EngineeringWorkspace } from "./components/EngineeringWorkspace";
import {
  DepartmentRosterStrip,
  getDepartmentStaffForPage,
} from "./components/DepartmentRosterStrip";
import { MobileFollowupCardList } from "./components/SalesMobileCards";
import {
  StaffCalendarSyncConfirmModal,
  StaffSheetsExportModal,
  type PendingStaffCalendarSync,
} from "./components/GoogleWorkspaceIntegration";
import type { DateRange } from "./components/ui/date-range-picker";
import { DigitalVault } from "./components/DigitalVault";
import {
  type ModalState,
  type Page,
  ROLE_LABELS,
  STAFF_SIDEBAR_COMPACT_KEY,
  SWITCHABLE_ROLES,
  base,
  client,
  fa,
  initials,
  initialPreferredRole,
  initialRoleParam,
  isDashboardPath,
  isPreview,
  labels,
  management,
  pageFromPath,
  panelSpec,
  readStaffSidebarCompact,
  searchParams,
} from "./staffConfig";
import { Empty, Modal } from "./components/StaffUiPrimitives";
import {
  AssignForm,
  EntryForm,
  FeedbackForm,
  LeadDetail,
  TaskDetail,
} from "./components/StaffLeadModals";
import { DepartmentForm, StaffForm } from "./components/StaffAdminModals";
import { Login } from "./components/StaffLoginView";
import { OverviewWorkspace } from "./components/OverviewWorkspace";
import { CrmRecordsWorkspace } from "./components/CrmRecordsWorkspace";
import { ProfileWorkspace } from "./components/ProfileWorkspace";
import "../../../shared/alabaster-dashboard.css";
import "./styles.css";
import "./callcenter-theme.css";

function App() {
  const [language, setLanguage] = useState<"en" | "fa">(() =>
    management && localStorage.getItem("staff-language") === "fa" ? "fa" : "en",
  );
  const t = useCallback(
    (s: string) => (language === "fa" ? fa[s] || s : s),
    [language],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(true);
  const [page, setPage] = useState<Page>(() => pageFromPath());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [number, setNumber] = useState(0);
  const [menu, setMenu] = useState(false);
  const [isCompact, setIsCompact] = useState<boolean>(() => readStaffSidebarCompact());
  const [filter, setFilter] = useState("today");
  const [notice, setNotice] = useState("");
  const [justSignedOut, setJustSignedOut] = useState(false);
  const isOnline = useOnlineStatus();
  const {
    battery,
    showWarning: showLowBatteryWarning,
    thresholdPercent: lowBatteryThreshold,
    dismissWarning: dismissLowBatteryWarning,
  } = useLowBatteryWarning(panelSpec.panelId === "sales");
  const {
    canInstall: canInstallPwa,
    isInstalled: isPwaInstalled,
    promptInstall,
  } = usePWAInstall();
  const {
    isSupported: isNotificationSupported,
    permission: notificationPermission,
    requestPermission: requestNotificationPermission,
    sendTestNotification,
    isTesting: isTestingNotification,
    testNotice: notificationTestNotice,
  } = useLeadNotifications(
    session?.user?.id,
    data?.leads,
    panelSpec.panelId === "sales" || isDashboardPath
  );
  const [showNotificationPopover, setShowNotificationPopover] = useState(false);
  const [offlineSavedAt, setOfflineSavedAt] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [failedSyncCount, setFailedSyncCount] = useState<number>(0);
  const [syncingPending, setSyncingPending] = useState<boolean>(false);
  const syncInFlightRef = useRef<boolean>(false);

  const refreshOutboxCounts = useCallback((userId?: number | string) => {
    const counts = getOfflineOutboxCounts(panelSpec.panelId, userId);
    setPendingSyncCount(counts.pending + counts.syncing);
    setFailedSyncCount(counts.failed);
    return counts;
  }, []);

  const handleToggleCompact = () => {
    setIsCompact((prev) => {
      const next = !prev;
      try {
        window.localStorage?.setItem(STAFF_SIDEBAR_COMPACT_KEY, next ? "true" : "false");
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };
  const [modal, setModal] = useState<ModalState>(null);
  const [sheetsExportMode, setSheetsExportMode] = useState<"leads" | "inventory" | null>(null);
  const [pendingCalendarSync, setPendingCalendarSync] = useState<PendingStaffCalendarSync | null>(null);
  const generation = useRef(0);

  const activeRole: Role = session?.user?.role || (management ? "ceo" : "callcenter");
  const isCallCenterOnly = activeRole === "callcenter" && !isDashboardPath && !management;

  useEffect(() => {
    const effectiveLang = isCallCenterOnly ? "en" : language;
    document.documentElement.lang = effectiveLang;
    document.documentElement.dir = effectiveLang === "fa" ? "rtl" : "ltr";
    if (!isCallCenterOnly) localStorage.setItem("staff-language", effectiveLang);
  }, [language, isCallCenterOnly]);

  useEffect(() => {
    const restoreOfflineSession = () => {
      const snapshot = readOfflineSnapshot(panelSpec.panelId);
      const cachedUser = snapshot?.user as StaffUser | undefined;
      if (
        !cachedUser ||
        (!isPreview &&
          !(panelSpec.allowedRoles as readonly string[]).includes(cachedUser.role))
      ) {
        return false;
      }
      setSession({
        user: cachedUser,
        csrfToken: "",
        serverTime: snapshot?.savedAt || new Date().toISOString(),
      });
      refreshOutboxCounts(cachedUser.id);
      setOfflineSavedAt(snapshot?.savedAt || new Date().toISOString());
      const pathTail = location.pathname.replace(/\/$/, "").split("/").pop() || "";
      const isRootPath = [
        "ceo",
        "management",
        "sales-leader",
        "sales",
        "callcenter",
        "finance",
        "marketing",
        "engineering",
        "dashboard",
        "",
      ].includes(pathTail);
      setPage((current) => {
        const resolvedPage = resolvePageForRole(
          cachedUser.role,
          current,
          isRootPath,
        ) as Page;
        const cachedView = readOfflineViewData(
          panelSpec.panelId,
          resolvedPage === "profile" ? "overview" : resolvedPage,
        );
        if (cachedView?.data) {
          setData(cachedView.data as DashboardData);
          setOfflineSavedAt(cachedView.savedAt);
        }
        return resolvedPage;
      });
      return true;
    };

    const bootSession = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (restoreOfflineSession()) return;
      }
      try {
        const s = await client.session();
        if (!s.user) {
          clearOfflineSnapshot(panelSpec.panelId);
          setSession(null);
          return;
        }
        let resolvedUser = s.user;
        if (isPreview) {
          const previewRole = (
            initialRoleParam ||
            (panelSpec.panelId !== "dashboard"
              ? panelSpec.defaultRole
              : resolveWorkspaceRoleOnSignIn({
                  urlRoleParam: initialRoleParam,
                  sessionRole: s.user.role,
                  management,
                }))
          ) as Role;
          if (previewRole && previewRole !== s.user.role) {
            resolvedUser =
              client.setActiveRole(previewRole) || {
                ...s.user,
                role: previewRole,
              };
          }
        }
        writePreferredWorkspaceRole(resolvedUser.role);
        writeOfflineSessionUser(panelSpec.panelId, resolvedUser);
        refreshOutboxCounts(resolvedUser.id);
        setOfflineSavedAt(null);
        setSession({ ...s, user: resolvedUser });
        const pathTail = location.pathname.replace(/\/$/, "").split("/").pop() || "";
        const isRootPath = [
          "ceo",
          "management",
          "sales-leader",
          "sales",
          "callcenter",
          "finance",
          "marketing",
          "engineering",
          "dashboard",
          "",
        ].includes(pathTail);
        setPage((current) => resolvePageForRole(resolvedUser.role, current, isRootPath) as Page);
      } catch (err) {
        if (!(isNetworkOfflineError(err) && restoreOfflineSession())) {
          setSession(null);
        }
      }
    };

    void bootSession().finally(() => setStarting(false));
    const expire = () => {
      clearOfflineSnapshot(panelSpec.panelId);
      setOfflineSavedAt(null);
      setSession(null);
      setData(null);
      setJustSignedOut(false);
      setError("Your session ended. Please sign in again.");
    };
    window.addEventListener("staff-session-expired", expire);
    return () => window.removeEventListener("staff-session-expired", expire);
  }, []);

  const syncQueuedOfflineEntries = useCallback(async () => {
    if (!session || syncInFlightRef.current) return null;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      refreshOutboxCounts(session.user.id);
      return null;
    }
    const before = refreshOutboxCounts(session.user.id);
    if (before.pending === 0 && before.syncing === 0) {
      return null;
    }
    syncInFlightRef.current = true;
    setSyncingPending(true);
    try {
      const outcome = await flushOfflineOutbox({
        panelId: panelSpec.panelId,
        userId: session.user.id,
        executor: async (item, updateItem) => {
          if (item.kind === "lead_entry") {
            const {
              existingLeadId,
              existingLeadVersion,
              draft,
              entry,
              draftKey,
              entryKey,
            } = item.payload || {};
            let leadId = existingLeadId;
            let version = existingLeadVersion;
            if (!leadId) {
              const created = await client.draft(draft, draftKey);
              leadId = created.id;
              version = created.version;
              updateItem({
                payload: {
                  ...item.payload,
                  existingLeadId: leadId,
                  existingLeadVersion: version,
                },
              });
            }
            await client.entry(
              leadId,
              { ...entry, version },
              entryKey || item.idempotencyKey,
            );
          } else if (item.kind === "followup_feedback") {
            await client.feedback(
              item.payload.taskId,
              item.payload.body,
              item.idempotencyKey,
            );
          } else if (item.kind === "task_create") {
            await client.createTask(item.payload.body, item.idempotencyKey);
          } else if (item.kind === "task_status") {
            await client.taskStatus(
              item.payload.taskId,
              item.payload.status,
              item.payload.version,
              item.idempotencyKey,
            );
          }
        },
      });
      refreshOutboxCounts(session.user.id);
      if (outcome.syncedCount > 0) {
        setNotice(
          `${t("Synced offline entries")}: ${outcome.syncedCount}`,
        );
      }
      return outcome;
    } finally {
      syncInFlightRef.current = false;
      setSyncingPending(false);
    }
  }, [session, refreshOutboxCounts, t]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const current = ++generation.current;
    const targetView = page === "profile" ? "overview" : page;
    setLoading(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        refreshOutboxCounts(session.user.id);
        const cached = readOfflineViewData(panelSpec.panelId, targetView, query);
        if (cached?.data && current === generation.current) {
          setData(cached.data as DashboardData);
          setOfflineSavedAt(cached.savedAt);
          setError("");
          return;
        }
      }
      const syncResult = await syncQueuedOfflineEntries();
      if (syncResult?.authExpired) {
        return;
      }
      const result = await client.load(
        targetView,
        query,
        number,
        page === "followups" ? filter : "all",
      );
      if (current === generation.current) {
        setData(result);
        setOfflineSavedAt(null);
        setError("");
        writeOfflineViewData(panelSpec.panelId, targetView, result, {
          query,
          page: number,
        });
      }
    } catch (e) {
      if (isNetworkOfflineError(e)) {
        refreshOutboxCounts(session.user.id);
        const cached = readOfflineViewData(panelSpec.panelId, targetView, query);
        if (cached?.data && current === generation.current) {
          setData(cached.data as DashboardData);
          setOfflineSavedAt(cached.savedAt);
          setError("");
          return;
        }
      }
      if (current === generation.current) setError((e as Error).message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [session, page, query, number, filter, refreshOutboxCounts, syncQueuedOfflineEntries]);

  useEffect(() => {
    if (isOnline && session && (offlineSavedAt || pendingSyncCount > 0)) {
      void refresh();
    }
  }, [isOnline, offlineSavedAt, pendingSyncCount, session, refresh]);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 180);
    return () => {
      clearTimeout(timer);
      generation.current++;
    };
  }, [refresh]);

  useEffect(() => {
    const syncIntervalMs = pendingSyncCount > 0 ? 15000 : 60000;
    const timer = setInterval(() => {
      if (!document.hidden && (typeof navigator === "undefined" || navigator.onLine)) {
        void refresh();
      }
    }, syncIntervalMs);
    const focus = () => {
      if (typeof navigator === "undefined" || navigator.onLine) {
        void refresh();
      }
    };
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh, pendingSyncCount]);

  useEffect(() => {
    const pop = () => {
      setPage(pageFromPath());
      setQuery("");
      setNumber(0);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);

  const navigate = (next: Page) => {
    const win = window as unknown as { __ATTAIE_ANDROID_APP__?: boolean };
    if (win.__ATTAIE_ANDROID_APP__ || location.pathname.endsWith("/index.html")) {
      history.pushState(
        { page: next },
        "",
        `./index.html?page=${next}${isPreview ? "&preview=1" : ""}`,
      );
    } else {
      history.pushState(
        { page: next },
        "",
        `${base}/${next === "overview" ? "" : next}${isPreview ? "?preview=1" : ""}`,
      );
    }
    setPage(next);
    setQuery("");
    setNumber(0);
    setMenu(false);
  };

  const format = (value: string) =>
    new Intl.DateTimeFormat(language === "fa" && !isCallCenterOnly ? "fa-AF" : "en-GB", {
      timeZone: "Asia/Kabul",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const badge = (value: string) => (
    <span className={`badge ${value}`}>{t(labels[value] || value)}</span>
  );

  const manager = !!session && isManagerRole(session.user.role);

  const canAssignTasks =
    !!session &&
    [
      "manager",
      "ceo",
      "sales_leader",
      "marketing_manager",
      "finance_manager",
    ].includes(session.user.role);

  const complete = async () => {
    setModal(null);
    setNotice(t("Saved successfully."));
    await refresh();
  };

  const completeOffline = (queuedMessage?: string) => {
    setModal(null);
    if (session) {
      refreshOutboxCounts(session.user.id);
    }
    setNotice(
      queuedMessage ||
        t("Saved locally while offline. Will sync automatically when online."),
    );
  };

  const hasSalesOrCallAccess = [
    "callcenter",
    "sales",
    "sales_leader",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasProjectsAccess = [
    "manager",
    "ceo",
    "manager",
    "sales_leader",
    "sales",
    "callcenter",
    "finance_manager",
    "architect",
    "graphic_designer",
    "visual_designer_3d",
  ].includes(activeRole);
  const hasContractsAccess = [
    "manager",
    "ceo",
    "finance_manager",
  ].includes(activeRole);
  const hasFinanceAccess = [
    "finance_manager",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasMarketingAccess = [
    "marketing_manager",
    "editor",
    "videographer",
    "sales",
    "sales_leader",
    "callcenter",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasEngineeringAccess = [
    "architect",
    "graphic_designer",
    "visual_designer_3d",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasSubmissionsReadAccess =
    (activeRole === "ceo" || activeRole === "editor") &&
    canAccessDatabase(activeRole, "submissions") !== false;

  const isExecOrBranchManager = activeRole === "ceo" || activeRole === "manager";

  const rawTabs: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "leaderboard", label: "Weekly Leaderboard", icon: Trophy },
    ...(hasSalesOrCallAccess && !isExecOrBranchManager
      ? [
          { id: "followups" as Page, label: "Follow-ups", icon: CalendarClock },
          { id: "customers" as Page, label: "Customers", icon: Users },
          { id: "leads" as Page, label: "Leads", icon: PhoneIncoming },
        ]
      : []),
    ...(isExecOrBranchManager
      ? [
          { id: "customers" as Page, label: "Customers", icon: Users },
          { id: "leads" as Page, label: "Leads", icon: PhoneIncoming },
        ]
      : []),
    ...(hasProjectsAccess
      ? [{ id: "projects" as Page, label: "Pre-Sale Projects", icon: Building2 }]
      : []),
    ...(hasContractsAccess
      ? [{ id: "contracts" as Page, label: "HR Contracts", icon: FileText }]
      : []),
    ...(hasFinanceAccess
      ? [{ id: "finance" as Page, label: "Finance Ledger", icon: DollarSign }]
      : []),
    ...(hasMarketingAccess
      ? [{ id: "marketing" as Page, label: "Marketing & Media", icon: Film }]
      : []),
    ...(hasEngineeringAccess
      ? [
          {
            id: "deliverables" as Page,
            label: "Engineering",
            icon: Compass,
          },
        ]
      : []),
    ...(hasSubmissionsReadAccess
      ? [{ id: "submissions" as Page, label: "Submissions", icon: Send }]
      : []),
    { id: "vault", label: "Digital Vault", icon: Layers },
    { id: "tasks", label: "My Tasks", icon: ClipboardList },
    ...(canAssignTasks
      ? [{ id: "team" as Page, label: "Team tasks", icon: Users }]
      : []),
  ];

  const roleAllowedPages = (
    ROLE_DASHBOARD_LAYOUT_MAP as Record<string, { allowedPages?: readonly string[] }>
  )[activeRole]?.allowedPages;
  const tabs = roleAllowedPages
    ? rawTabs.filter((t) => roleAllowedPages.includes(t.id))
    : rawTabs;

  const headings: Record<Page, [string, string]> = {
    overview: ["Overview", "Your day, clearly organized."],
    leaderboard: [
      "Weekly Leaderboard",
      "Weekly agent performance rankings: 1 Lead = 1 pt · 1 Customer Visit = 3 pts · 1 Deal = 10 pts.",
    ],
    followups: ["Follow-ups", "Focus on the next conversation."],
    customers: ["Customers", "Customer requirements, in one place."],
    leads: ["Leads", "Every inquiry has a next step."],
    tasks: ["My Tasks", "A clear view of your assigned work."],
    team: ["Team tasks", "Give your team a clear next step."],
    projects: [
      "Pre-Sale Projects",
      "Manager project inventory, multiple sellers, construction company, and floor apartments.",
    ],
    contracts: [
      "HR Contracts",
      "4-step bilingual apartment contract issuance and Two-Page A4 legal printout.",
    ],
    finance: [
      "Finance Ledger",
      "Contract installment schedules, draft customer deposits, and Finance Manager approvals.",
    ],
    marketing: [
      "Marketing & Media",
      "Filming, editing, and social media post workflow connected to the Submission DB.",
    ],
    submissions: [
      "Submissions",
      "Read-only status of property posts sent to the isolated Submission Database.",
    ],
    deliverables: [
      "Engineering",
      "Project-linked architectural plans, graphic brochures, and 3D renders with version history.",
    ],
    vault: [
      "Digital Vault",
      "Company-wide secure document cloud, folder system, and file library.",
    ],
    profile: ["Profile", "Your workspace preferences and security."],
  };

  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [leadDateRange, setLeadDateRange] = useState<DateRange>({ from: null, to: null });

  const leadsPipelineSummary = summarizeLeadsPipeline(data?.leads || []);

  const visibleLeads = (data?.leads || []).filter((l) => {
    const matchesStatus = leadStatusFilter === "all" || l.status === leadStatusFilter;
    if (!matchesStatus) return false;
    if (leadDateRange.from) {
      const leadDate = new Date(l.callAt);
      if (leadDate < leadDateRange.from) return false;
    }
    if (leadDateRange.to) {
      const leadDate = new Date(l.callAt);
      if (leadDate > leadDateRange.to) return false;
    }
    return true;
  });

  const triggerBlobDownload = (
    content: string,
    mimeType: string,
    filename: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportLeadsCsv = () => {
    const csvContent = formatLeadsToCsv(visibleLeads);
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerBlobDownload(
      csvContent,
      "text/csv;charset=utf-8;",
      `attaie-leads-${leadStatusFilter}-${dateStamp}.csv`,
    );
    setNotice(
      `${t("Exported current leads view to CSV.")} (${visibleLeads.length})`,
    );
  };

  const handleExportLeadsPdf = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const pdfContent = generateLeadsPdfDocument(visibleLeads, {
      title: "Attaie Properties — Internal CRM Leads Export",
      subtitle: `Role: ${ROLE_LABELS[activeRole] || activeRole} · Filter: ${leadStatusFilter.toUpperCase()} · Search: "${query || "All"}" · Records: ${visibleLeads.length}`,
    });
    triggerBlobDownload(
      pdfContent,
      "application/pdf",
      `attaie-leads-${leadStatusFilter}-${dateStamp}.pdf`,
    );
    setNotice(
      `${t("Exported current leads view to PDF.")} (${visibleLeads.length})`,
    );
  };

  const followups = (data?.followups || []).filter((f) => {
    const state = followupState(f, data?.serverTime);
    return (
      filter === "all" ||
      (filter === "today"
        ? !f.completedAt &&
          new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kabul" }).format(
            new Date(f.scheduledAt),
          ) ===
            new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kabul" }).format(
              new Date(data?.serverTime || Date.now()),
            )
        : filter === "completed"
          ? !!f.completedAt
          : state === filter)
    );
  });

  const followupTable = (items: Followup[]) =>
    items.length ? (
      <>
        <div className="table-scroll desktop-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Customer")}</th>
                <th>{t("Scheduled")}</th>
                <th>{t("Deadline")}</th>
                <th>{t("Status")}</th>
                <th>
                  <span className="sr-only">{t("Action")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button
                      className="person-link"
                      onClick={() =>
                        setModal({
                          kind: "detail",
                          item: { id: item.leadId } as Lead,
                        })
                      }
                    >
                      <span className="avatar">
                        {initials(item.customerName)}
                      </span>
                      <span>
                        <strong>{item.customerName}</strong>
                        <small className="serial">{item.serial}</small>
                      </span>
                    </button>
                  </td>
                  <td>{format(item.scheduledAt)}</td>
                  <td className="muted">
                    {format(feedbackDeadline(item.scheduledAt))}
                  </td>
                  <td>{badge(followupState(item, data?.serverTime))}</td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() =>
                        setModal({
                          kind: item.completedAt ? "detail" : "feedback",
                          item: item.completedAt
                            ? ({ id: item.leadId } as Lead)
                            : item,
                        })
                      }
                    >
                      {t(item.completedAt ? "Open" : "Feedback")}
                      <ArrowUpRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <MobileFollowupCardList
          followups={items}
          serverTime={data?.serverTime}
          t={t}
          format={format}
          statusLabel={(s) => labels[s] || s}
          onSelectFollowup={(item, kind) =>
            setModal({
              kind,
              item: kind === "detail" ? ({ id: item.leadId } as Lead) : item,
            })
          }
        />
      </>
    ) : (
      <Empty
        title={t("No records to show")}
        text={t("Try another filter or check back when new work is assigned.")}
      />
    );

  const verificationToken = searchParams.get("verify");
  if (verificationToken) return <AgreementVerification token={verificationToken} verify={client.verifyContract} lang={language} />;

  if (starting)
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>{t("Loading your workspace…")}</p>
      </div>
    );

  if (!session)
    return (
      <Login
        t={t}
        error={error}
        justSignedOut={justSignedOut}
        onLogin={(s) => {
          writePreferredWorkspaceRole(s.user.role);
          writeOfflineSessionUser(panelSpec.panelId, s.user);
          try {
            if (s.user?.name) localStorage.setItem("attaie_staff_last_user", s.user.name);
          } catch {
            // ignore storage errors
          }
          setOfflineSavedAt(null);
          setJustSignedOut(false);
          setSession(s);
          setPage((current) =>
            resolvePageForRole(
              s.user.role,
              current,
              current === "overview",
            ) as Page,
          );
          setError("");
        }}
        management={management}
      />
    );

  if (
    !isDashboardPath &&
    !isPreview &&
    !(panelSpec.allowedRoles as readonly string[]).includes(session.user.role)
  ) {
    const target =
      (ROLE_DASHBOARD_LAYOUT_MAP as Record<string, { workspacePath?: string }>)[
        session.user.role
      ]?.workspacePath || "/callcenter";
    window.location.replace(target);
    return null;
  }

  const roleLabel =
    ROLE_LABELS[session.user.role] ||
    (manager ? "Management" : "Call Center");

  const pillarDefinitions: {
    id: "command" | "sales" | "operations" | "tasks";
    label: string;
    shortTag: string;
    icon: React.ElementType;
    pages: Page[];
  }[] = [
    {
      id: "command",
      label: "Command",
      shortTag: "Core",
      icon: LayoutGrid,
      pages: ["overview", "projects"],
    },
    {
      id: "sales",
      label: "Sales & Client CRM",
      shortTag: "CRM",
      icon: Briefcase,
      pages: ["leaderboard", "followups", "customers", "leads"],
    },
    {
      id: "operations",
      label: "Operations & Finance",
      shortTag: "Ops",
      icon: Layers,
      pages: ["contracts", "finance", "marketing", "deliverables", "submissions"],
    },
    {
      id: "tasks",
      label: "Tasks & Account",
      shortTag: "Work",
      icon: ClipboardList,
      pages: ["tasks", "team", "profile"],
    },
  ];

  const tabById = new Map(tabs.map((tab) => [tab.id, tab]));
  const profileTab: { id: Page; label: string; icon: React.ElementType } = {
    id: "profile",
    label: "Profile",
    icon: UserRound,
  };

  const pillars = pillarDefinitions
    .map((pillar) => {
      const items = pillar.pages
        .map((id) => (id === "profile" ? profileTab : tabById.get(id)))
        .filter((item): item is { id: Page; label: string; icon: React.ElementType } => Boolean(item));
      return { ...pillar, items };
    })
    .filter((pillar) => pillar.items.length > 0);

  const activePillar =
    pillars.find((pillar) => pillar.items.some((item) => item.id === page)) ||
    pillars[0];

  const shortTagForPage = (id: Page) =>
    pillars.find((p) => p.items.some((i) => i.id === id))?.shortTag || "Core";

  const mobileTabs = getMobilePrimaryTabs(tabs);

  return (
    <div
      className={`staff-shell ${isCompact ? "is-compact" : ""}`}
      data-sidebar-mode={isCompact ? "compact" : "expanded"}
      data-panel-id={panelSpec.panelId}
    >
      {menu && (
        <button
          className="nav-shade"
          aria-label={t("Close")}
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <div className="pillar-rail" aria-label={t("Workspace")}>
          <a
            className="pillar-brand"
            href={`${base}/${isPreview ? "?preview=1" : ""}`}
            title={t("Attaie Properties")}
            aria-label={t("Attaie Properties")}
          >
            <Building2 size={18} />
          </a>
          <div className="pillar-rail-nav">
            {pillars.map((pillar) => {
              const PillarIcon = pillar.icon;
              const isActive = activePillar?.id === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  title={t(pillar.label)}
                  aria-label={t(pillar.label)}
                  className={`pillar-btn ${isActive ? "active" : ""}`}
                  onClick={() => {
                    const firstItem = pillar.items[0];
                    if (firstItem && !pillar.items.some((item) => item.id === page)) {
                      navigate(firstItem.id);
                    }
                  }}
                >
                  <PillarIcon size={18} />
                </button>
              );
            })}
          </div>
          <div className="pillar-rail-foot">
            <button
              type="button"
              data-testid="staff-sidebar-compact-toggle"
              aria-pressed={isCompact}
              aria-expanded={!isCompact}
              title={t(isCompact ? "Expand full sidebar" : "Compact icon-only sidebar")}
              aria-label={t(isCompact ? "Expand full sidebar" : "Compact icon-only sidebar")}
              className={`pillar-btn pillar-collapse-btn ${isCompact ? "active" : ""}`}
              onClick={handleToggleCompact}
            >
              {isCompact ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
            <button
              type="button"
              title={t("Profile")}
              aria-label={t("Profile")}
              className={`pillar-btn ${page === "profile" ? "active" : ""}`}
              onClick={() => navigate("profile")}
            >
              <UserRound size={17} />
            </button>
          </div>
        </div>

        <div className="sub-drawer">
          <div className="sub-drawer-head">
            <div>
              <div className="sub-drawer-kicker">{t("Attaie Properties")}</div>
              <div className="sub-drawer-title">
                {t(activePillar?.label || "Workspace")}
              </div>
            </div>
            <button
              type="button"
              className="mobile-drawer-close"
              aria-label={t("Close")}
              onClick={() => setMenu(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="sub-drawer-scroll">
            <nav aria-label={t(activePillar?.label || "Workspace")}>
              {(activePillar?.items || []).map(({ id, label, icon: Icon }) => {
                const isDeptTab = [
                  "deliverables",
                  "submissions",
                  "finance",
                  "marketing",
                  "leads",
                  "contracts",
                  "projects",
                  "team",
                ].includes(id);
                const deptCount =
                  isDeptTab && (data?.assignees?.length || 0) > 0
                    ? getDepartmentStaffForPage(
                        id,
                        data?.assignees || [],
                        data?.branches || [],
                      ).count
                    : 0;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`nav-item ${page === id ? "selected" : ""}`}
                    onClick={() => navigate(id)}
                  >
                    <Icon size={16} />
                    <span>{t(label)}</span>
                    {id === "followups" && (data?.counts.overtime || 0) > 0 && (
                      <span className="nav-count">{data!.counts.overtime}</span>
                    )}
                    {isDeptTab && deptCount > 0 && (
                      <span
                        className="nav-dept-staff-pill"
                        title={`${deptCount} ${t("Employees")}`}
                        style={{
                          marginInlineStart: "auto",
                          padding: "1px 7px",
                          borderRadius: 999,
                          background: page === id ? "#FFFFFF" : "#E6F2FA",
                          color: "#0072BC",
                          fontSize: 10.5,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {deptCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="sub-drawer-all">
              <p className="nav-caption">{t("All Modules")}</p>
              <nav aria-label={t("All Modules")}>
                {tabs.map(({ id, label, icon: Icon }) => {
                  const isDeptTab = [
                    "deliverables",
                    "submissions",
                    "finance",
                    "marketing",
                    "leads",
                    "contracts",
                    "projects",
                    "team",
                  ].includes(id);
                  const deptCount =
                    isDeptTab && (data?.assignees?.length || 0) > 0
                      ? getDepartmentStaffForPage(
                          id,
                          data?.assignees || [],
                          data?.branches || [],
                        ).count
                      : 0;
                  return (
                    <button
                      key={`quick-${id}`}
                      type="button"
                      data-testid={`nav-tab-${id}`}
                      className={`nav-item quick-jump-item ${page === id ? "selected" : ""}`}
                      onClick={() => navigate(id)}
                    >
                      <Icon size={14} />
                      <span>{t(label)}</span>
                      {id === "followups" && (data?.counts.overtime || 0) > 0 ? (
                        <span className="nav-count">{data!.counts.overtime}</span>
                      ) : isDeptTab && deptCount > 0 ? (
                        <span
                          className="quick-jump-tag"
                          title={`${deptCount} ${t("Employees")}`}
                          style={{
                            background: "#E6F2FA",
                            color: "#0072BC",
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {deptCount} · {shortTagForPage(id)}
                        </span>
                      ) : (
                        <span className="quick-jump-tag">
                          {shortTagForPage(id)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="sidebar-bottom">
            <button
              type="button"
              className="account"
              onClick={() => navigate("profile")}
            >
              <span className="avatar neutral">{initials(session.user.name)}</span>
              <span>
                <strong>{session.user.name}</strong>
                <small>{t(roleLabel)}</small>
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>{t(activePillar?.label || (!isDashboardPath ? (manager ? "Management" : "Call Center") : roleLabel))}</span>
            <span className="crumb-divider">/</span>
            <strong>{t(headings[page][0])}</strong>
          </div>
          <div className="topbar-actions">
            {(isPreview || (typeof window !== "undefined" && window.location.search.includes("preview=1"))) && (
              <div
                className="preview-role-switcher"
                data-testid="presentation-role-switcher"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#E6F2FA",
                  border: "1px solid #0072BC",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  marginRight: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#0072BC",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Lens:
                </span>
                <select
                  value={session?.user.role || activeRole}
                  aria-label="Switch presentation role lens"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#005E9B",
                    fontSize: "12px",
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onChange={(e) => {
                    const nextRole = e.target.value as Role;
                    if (!session) return;
                    const layout = (ROLE_DASHBOARD_LAYOUT_MAP as Record<string, any>)[nextRole];
                    const nextUser: StaffUser = {
                      ...session.user,
                      role: nextRole,
                      departmentCode:
                        layout?.defaultPillar === "sales"
                          ? "sales"
                          : nextRole === "finance_manager"
                          ? "finance"
                          : nextRole === "editor" || nextRole === "videographer" || nextRole === "marketing_manager"
                          ? "production"
                          : nextRole.includes("designer") || nextRole === "architect"
                          ? "engineering"
                          : "management",
                    };
                    setSession({
                      ...session,
                      user: nextUser,
                    });
                    if (layout?.defaultPage) {
                      navigate(layout.defaultPage as Page);
                    }
                  }}
                >
                  <option value="ceo">CEO (Executive Global)</option>
                  <option value="manager">Branch Manager (Operations)</option>
                  <option value="sales_leader">Sales Leader (CRM & Team)</option>
                  <option value="sales">Sales Agent (Direct Deals)</option>
                  <option value="callcenter">Call Center (Intake & Drafts)</option>
                  <option value="finance_manager">Finance Manager (Treasury & Ledger)</option>
                  <option value="marketing_manager">Marketing Manager (Production & Filming)</option>
                  <option value="videographer">Videographer (Footage & Capture)</option>
                  <option value="editor">Video Editor (Cut, Social & Submit)</option>
                  <option value="architect">Engineering Architect (2D/3D Plans)</option>
                </select>
              </div>
            )}
            {panelSpec.panelId === "sales" && battery.visible && (
              <span
                className={`header-battery-indicator tone-${battery.tone}`}
                data-testid="header-battery-indicator"
                data-battery-tone={battery.tone}
                role="status"
                aria-label={`${t("Device battery")} ${battery.text}${battery.charging ? ` · ${t("Charging")}` : ""}`}
                title={`${t("Device battery")}: ${battery.text}${battery.charging ? ` (${t("Charging")})` : !isOnline ? ` · ${t("Offline")}` : ""}`}
              >
                {battery.charging ? (
                  <BatteryCharging size={14} aria-hidden="true" />
                ) : battery.percent <= 15 ? (
                  <BatteryWarning size={14} aria-hidden="true" />
                ) : battery.percent <= 35 ? (
                  <BatteryLow size={14} aria-hidden="true" />
                ) : battery.percent <= 75 ? (
                  <BatteryMedium size={14} aria-hidden="true" />
                ) : (
                  <BatteryFull size={14} aria-hidden="true" />
                )}
                <span className="header-battery-percent">{battery.text}</span>
              </span>
            )}
            {panelSpec.panelId === "sales" && canInstallPwa && !isPwaInstalled && (
              <button
                type="button"
                className="button secondary pwa-install-topbar-btn"
                data-testid="pwa-install-btn"
                onClick={async () => {
                  const result = await promptInstall();
                  if (result === "ios") {
                    setNotice(
                      t(
                        "On iPhone/iPad Safari: tap the Share button at the bottom, then choose 'Add to Home Screen' for full-screen app mode.",
                      ),
                    );
                  }
                }}
              >
                <Download size={15} />
                {t("Install App")}
              </button>
            )}
            {isNotificationSupported && (panelSpec.panelId === "sales" || isDashboardPath) && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className={`header-notification-btn ${
                    notificationPermission === "granted"
                      ? "tone-active"
                      : notificationPermission === "default"
                      ? "tone-prompt"
                      : "tone-denied"
                  }`}
                  data-testid="header-notification-btn"
                  onClick={() => {
                    if (notificationPermission === "default") {
                      void requestNotificationPermission();
                    } else {
                      setShowNotificationPopover((prev) => !prev);
                    }
                  }}
                  title={
                    notificationPermission === "granted"
                      ? t("Mobile Lead Alerts Active")
                      : notificationPermission === "default"
                      ? t("Enable Mobile Lead Alerts")
                      : t("Notifications Blocked in Browser")
                  }
                >
                  {notificationPermission === "granted" ? (
                    <>
                      <BellRing size={14} />
                      <span className="header-notification-dot" />
                      <span>{t("Alerts Active")}</span>
                    </>
                  ) : notificationPermission === "default" ? (
                    <>
                      <Bell size={14} />
                      <span className="header-notification-dot prompt" />
                      <span>{t("Enable Alerts")}</span>
                    </>
                  ) : (
                    <>
                      <BellOff size={14} />
                      <span>{t("Alerts Blocked")}</span>
                    </>
                  )}
                </button>

                {showNotificationPopover && (
                  <div className="notification-popover" data-testid="notification-popover">
                    <div className="notification-popover-head">
                      <strong>{t("Mobile Lead Alerts")}</strong>
                      <button
                        type="button"
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
                        onClick={() => setShowNotificationPopover(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p>
                      {notificationPermission === "granted"
                        ? t("Service worker notifications are active. You will receive device vibration and lock-screen alerts when customer leads are assigned.")
                        : notificationPermission === "default"
                        ? t("Allow notifications to get alerted on your mobile phone whenever a lead is assigned.")
                        : t("Notifications are blocked in your browser. Reset permissions in site settings to receive lead alerts.")}
                    </p>
                    {notificationTestNotice && (
                      <div style={{ fontSize: "11px", color: "#166534", background: "#DCFCE7", padding: "6px 8px", borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                        {notificationTestNotice}
                      </div>
                    )}
                    <div className="notification-popover-actions">
                      {notificationPermission === "default" ? (
                        <button
                          type="button"
                          className="button"
                          style={{ minHeight: 32, fontSize: "12px", padding: "4px 10px" }}
                          onClick={async () => {
                            await requestNotificationPermission();
                          }}
                        >
                          <Bell size={14} />
                          {t("Allow Mobile Notifications")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button secondary"
                          style={{ minHeight: 32, fontSize: "12px", padding: "4px 10px" }}
                          disabled={isTestingNotification}
                          onClick={() => void sendTestNotification()}
                        >
                          <BellRing size={14} />
                          {isTestingNotification ? t("Sending Alert...") : t("Send Test Alert to Device")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <span className="timezone">Kabul · UTC+04:30</span>
            <button
              type="button"
              className="icon-button mobile-refresh-btn"
              onClick={refresh}
              disabled={loading}
              aria-label={t("Refresh")}
              title={t("Refresh")}
            >
              <RefreshCw className={loading ? "spinning" : ""} size={16} />
            </button>
            {!isCallCenterOnly && (
              <button
                className="language-toggle"
                data-testid="staff-language-toggle"
                onClick={() => setLanguage(language === "en" ? "fa" : "en")}
              >
                <Globe size={15} />
                {language === "en" ? "دری" : "English"}
              </button>
            )}
            <span className="avatar small gold">
              {initials(session.user.name)}
            </span>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{t("ATTAIE WORKSPACE")}</div>
              <h1>{t(headings[page][0])}</h1>
              <p>{t(headings[page][1])}</p>
            </div>
            <div className="heading-actions">
              <button
                className="icon-button"
                onClick={refresh}
                disabled={loading}
                aria-label={t("Refresh")}
              >
                <RefreshCw className={loading ? "spinning" : ""} size={18} />
              </button>
              {canAssignTasks &&
                (page === "team" || page === "tasks" || page === "overview") && (
                  <button
                    className="button"
                    data-testid="assign-task-btn"
                    onClick={() => setModal({ kind: "assign" })}
                  >
                    <Plus size={17} />
                    {t("Assign task")}
                  </button>
                )}
              {(activeRole === "callcenter" ||
                activeRole === "sales" ||
                activeRole === "ceo") && (
                <button
                  className="button"
                  data-testid="new-entry-btn"
                  onClick={() => setModal({ kind: "entry" })}
                >
                  <Plus size={17} />
                  {t("New entry")}
                </button>
              )}
            </div>
          </div>
          {showLowBatteryWarning && (
            <div
              className="low-battery-warning-banner"
              role="alert"
              data-testid="low-battery-warning-banner"
            >
              <div className="low-battery-warning-copy">
                <span className="low-battery-warning-icon" aria-hidden="true">
                  <BatteryWarning size={17} />
                </span>
                <div>
                  <strong>
                    {t("Low battery")} · {battery.text}
                  </strong>
                  <small>
                    {t(
                      "Battery dropped below {{threshold}}%. Connect a charger soon to keep working smoothly in the field.",
                    ).replace("{{threshold}}", String(lowBatteryThreshold))}
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="low-battery-dismiss-btn"
                data-testid="dismiss-low-battery-btn"
                aria-label={t("Dismiss")}
                onClick={dismissLowBatteryWarning}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {(!isOnline || offlineSavedAt || pendingSyncCount > 0 || failedSyncCount > 0) && (
            <div
              className="offline-indicator-banner"
              role="status"
              data-testid="offline-indicator-banner"
            >
              <div className="offline-indicator-copy">
                <span className="offline-indicator-icon">
                  {isOnline && (pendingSyncCount > 0 || syncingPending) ? (
                    <RefreshCw size={16} className={syncingPending ? "spinning" : ""} />
                  ) : (
                    <WifiOff size={16} />
                  )}
                </span>
                <div>
                  <strong>
                    {!isOnline
                      ? t("Offline mode · Showing saved leads")
                      : syncingPending
                        ? t("Syncing locally stored offline entries…")
                        : pendingSyncCount > 0
                          ? `${pendingSyncCount} ${t("offline entries pending sync")}`
                          : failedSyncCount > 0
                            ? `${failedSyncCount} ${t("offline entries need attention")}`
                            : t("Offline mode · Showing saved leads")}
                  </strong>
                  <small>
                    {!isOnline && pendingSyncCount > 0
                      ? `${pendingSyncCount} ${t("entries saved locally and will sync automatically when reconnected.")}`
                      : offlineSavedAt
                        ? `${t("Last synced")} ${format(offlineSavedAt)}`
                        : failedSyncCount > 0
                          ? t("Some queued entries could not be confirmed by the server.")
                          : t("Reconnect to sync updates and save new entries.")}
                  </small>
                </div>
              </div>
              {isOnline && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {failedSyncCount > 0 && (
                    <button
                      type="button"
                      className="offline-retry-btn"
                      data-testid="offline-retry-failed-btn"
                      onClick={() => {
                        retryFailedOfflineOutboxItems(panelSpec.panelId, session.user.id);
                        refreshOutboxCounts(session.user.id);
                        void refresh();
                      }}
                      disabled={loading || syncingPending}
                    >
                      <RefreshCw size={14} className={loading || syncingPending ? "spinning" : ""} />
                      {t("Retry failed")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="offline-retry-btn"
                    data-testid="offline-sync-now-btn"
                    onClick={refresh}
                    disabled={loading || syncingPending}
                  >
                    <RefreshCw size={14} className={loading || syncingPending ? "spinning" : ""} />
                    {t("Sync now")}
                  </button>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="alert error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={refresh}>{t("Refresh")}</button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              <Check size={17} />
              {notice}
              <button aria-label={t("Close")} onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}

          {[
            "overview",
            "leaderboard",
            "projects",
            "contracts",
            "finance",
            "marketing",
            "submissions",
            "deliverables",
            "leads",
            "followups",
            "customers",
            "team",
          ].includes(page) && (
            <DepartmentRosterStrip
              page={page}
              users={data?.assignees || []}
              branches={data?.branches || []}
              t={t}
            />
          )}

          {page === "leaderboard" && (
            <WeeklyLeaderboardPage
              leads={data?.leads || []}
              followups={data?.followups || []}
              assignees={data?.assignees || []}
              branches={data?.branches || []}
              leaderboardEntries={data?.leaderboard || []}
              serverTime={data?.serverTime}
              language={isCallCenterOnly ? "en" : language}
              t={t}
            />
          )}

          {page === "overview" && (
            <OverviewWorkspace
              t={t}
              data={data}
              activeRole={activeRole}
              userId={session.user.id}
              language={language}
              hasSalesOrCallAccess={hasSalesOrCallAccess}
              setFilter={setFilter}
              navigate={navigate}
              setModal={setModal}
              followupTable={followupTable}
              badge={badge}
              format={format}
            />
          )}

          {/* Phase 2: Pre-Sale Projects & Apartments Wizard */}
          {page === "projects" && (
            <ProjectInventoryWizard
              projects={data?.projects || []}
              staffUsers={data?.assignees || []}
              branches={data?.branches || []}
              language={language}
              onUpload={client.upload}
              actorRole={activeRole}
              onExportSheets={() => setSheetsExportMode("inventory")}
              onSaveProject={async (proj) => {
                await client.saveProject(proj);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 4: HR Deal Contracts & Two-Page A4 Legal Printout */}
          {page === "contracts" && (
            <HrContractsWorkspace
              lang={language}
              onUpload={client.upload}
              onSavePreparation={async (projectId, body) => { const result = await client.saveProjectPreparation(projectId, body); await refresh(); return result; }}
              contracts={data?.hrContracts || []}
              projects={data?.projects || []}
              closedDeals={(data?.leads || []).filter(
                (l) => l.status === "closed",
              )}
              actorRole={activeRole}
              onAmendContract={async (id, body) => { const updated = await client.amendContract(id, body); await refresh(); return updated; }}
              onIssueContract={async (payload) => {
                const created = await client.issueContract(payload);
                await refresh();
                return created;
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 4: Finance Installment Schedule & Customer Deposits */}
          {page === "finance" && (
            <FinanceWorkspace
              lang={language}
              contracts={data?.hrContracts || []}
              deposits={data?.financeDeposits || []}
              actorRole={activeRole}
              onManageDeposit={async (payload) => {
                await client.manageDeposit(payload);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 5: Marketing & Media Production Pipeline */}
          {page === "marketing" && (
            <MarketingWorkspace
              t={t}
              onUpload={client.upload}
              entries={data?.marketingEntries || []}
              submissions={data?.submissions || []}
              staffUsers={data?.assignees || []}
              actorRole={activeRole}
              onCreateEntry={async (payload) => {
                await client.createMarketingEntry(payload);
                await refresh();
              }}
              onAdvanceEntry={async (id, action, payload) => {
                await client.advanceMarketing(id, action, payload);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 5: Read-Only Submissions Status View */}
          {page === "submissions" && (
            <SubmissionsStatusView submissions={data?.submissions || []} t={t} />
          )}

          {/* Phase 6: Engineering Project Tasks & Versioned Deliverables */}
          {page === "deliverables" && (
            <EngineeringWorkspace
              t={t}
              onUpload={client.upload}
              deliverables={data?.engineeringDeliverables || []}
              projects={data?.projects || []}
              actorRole={activeRole}
              onUploadVersion={async (id, payload) => {
                await client.uploadDeliverableVersion(id, payload);
                await refresh();
              }}
              onReviewVersion={async (id, payload) => {
                await client.reviewDeliverable(id, payload);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {["followups", "customers", "leads", "tasks", "team"].includes(page) && (
            <CrmRecordsWorkspace
              t={t}
              page={page}
              data={data}
              activeRole={activeRole}
              userId={session.user.id}
              language={language}
              isExecOrBranchManager={isExecOrBranchManager}
              canAssignTasks={canAssignTasks}
              manager={manager}
              isNotificationSupported={isNotificationSupported}
              notificationPermission={notificationPermission}
              isTestingNotification={isTestingNotification}
              requestNotificationPermission={requestNotificationPermission}
              sendTestNotification={sendTestNotification}
              leadsPipelineSummary={leadsPipelineSummary}
              leadStatusFilter={leadStatusFilter}
              setLeadStatusFilter={setLeadStatusFilter}
              leadDateRange={leadDateRange}
              setLeadDateRange={setLeadDateRange}
              visibleLeads={visibleLeads}
              followups={followups}
              query={query}
              setQuery={setQuery}
              number={number}
              setNumber={setNumber}
              loading={loading}
              filter={filter}
              setFilter={setFilter}
              handleExportLeadsCsv={handleExportLeadsCsv}
              handleExportLeadsPdf={handleExportLeadsPdf}
              setSheetsExportMode={setSheetsExportMode}
              setNotice={setNotice}
              refresh={refresh}
              navigate={navigate}
              setModal={setModal}
              followupTable={followupTable}
              badge={badge}
              format={format}
            />
          )}
          {page === "vault" && (
            <div style={{ marginTop: 8 }}>
              <DigitalVault
                currentUser={{
                  name: session?.user?.name || "Staff Member",
                  role: activeRole,
                  uid: String(session?.user?.id || ""),
                }}
                apiBaseUrl="/api"
              />
            </div>
          )}
          {page === "profile" && (
            <ProfileWorkspace
              t={t}
              session={session}
              roleLabel={roleLabel}
              language={language}
              canInstallPwa={canInstallPwa}
              isPwaInstalled={isPwaInstalled}
              promptInstall={promptInstall}
              isNotificationSupported={isNotificationSupported}
              notificationPermission={notificationPermission}
              isTestingNotification={isTestingNotification}
              requestNotificationPermission={requestNotificationPermission}
              sendTestNotification={sendTestNotification}
              setSession={setSession}
              setData={setData}
              setOfflineSavedAt={setOfflineSavedAt}
              setJustSignedOut={setJustSignedOut}
              setNotice={setNotice}
              setError={setError}
            />
          )}
          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Attaie Properties</span>
            <span>
              <ShieldCheck size={13} />
              {t("Private staff workspace")}
            </span>
          </footer>
        </main>
        {(activeRole === "sales" || activeRole === "callcenter") &&
          !modal &&
          ["leads", "followups", "customers"].includes(page) && (
            <button
              type="button"
              className="mobile-fab"
              data-testid="mobile-fab-new-entry"
              onClick={() => setModal({ kind: "entry" })}
              aria-label={t("New entry")}
            >
              <Plus size={18} />
              <span>{t("New entry")}</span>
            </button>
          )}
        <nav
          className="mobile-bottom-nav"
          aria-label={t("Workspace")}
          data-testid="mobile-bottom-nav"
        >
          {mobileTabs.map((item) => {
            const Icon = item.icon as React.ElementType;
            const isActive = page === item.id;
            const overdueCount =
              item.id === "followups" ? data?.counts.overtime || 0 : 0;
            return (
              <button
                key={`mobile-nav-${item.id}`}
                type="button"
                data-testid={`mobile-nav-${item.id}`}
                className={`mobile-bottom-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.id as Page)}
              >
                <span className="mobile-bottom-nav-icon">
                  <Icon size={18} />
                  {overdueCount > 0 && (
                    <span className="mobile-bottom-nav-badge">
                      {overdueCount}
                    </span>
                  )}
                </span>
                <span className="mobile-bottom-nav-label">
                  {t(item.mobileLabel || item.label)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      {modal && (
        <Modal
          title={t(
            {
              entry: "New entry",
              feedback: "Feedback",
              task: "Task details",
              detail: "Activity history",
              assign: "Assign task",
              staff: "Create agent",
              department: "Create department",
            }[modal.kind],
          )}
          close={() => setModal(null)}
          t={t}
        >
          {modal.kind === "entry" ? (
            <EntryForm
              t={t}
              item={modal.item as Lead | undefined}
              users={data?.assignees || []}
              projects={data?.projects || []}
              self={session.user}
              done={complete}
              onQueueOffline={() => completeOffline()}
              onRequestCalendarSync={(pending) => setPendingCalendarSync(pending)}
            />
          ) : modal.kind === "feedback" ? (
            <FeedbackForm
              t={t}
              task={modal.item as Followup}
              users={data?.assignees || []}
              projects={data?.projects || []}
              self={session.user}
              done={complete}
              onQueueOffline={() => completeOffline()}
              format={format}
              onRequestCalendarSync={(pending) => setPendingCalendarSync(pending)}
            />
          ) : modal.kind === "assign" ? (
            <AssignForm
              t={t}
              users={data?.assignees || []}
              projects={data?.projects || []}
              self={session.user}
              done={complete}
              onQueueOffline={() => completeOffline()}
            />
          ) : modal.kind === "staff" ? (
            <StaffForm
              t={t}
              departments={data?.departments || []}
              branches={data?.branches || []}
              salesLeaders={(data?.assignees || []).filter(
                (u) => u.role === "sales_leader" && u.active !== false,
              )}
              done={complete}
            />
          ) : modal.kind === "department" ? (
            <DepartmentForm t={t} done={complete} />
          ) : modal.kind === "task" ? (
            <TaskDetail
              t={t}
              task={modal.item as ManagementTask}
              self={session.user}
              done={complete}
              onQueueOffline={() => completeOffline()}
              format={format}
            />
          ) : (
            <LeadDetail
              t={t}
              id={modal.item!.id}
              fallbackLead={
                data?.leads.find((l) => l.id === modal.item!.id) ||
                (modal.item as Lead)
              }
              format={format}
            />
          )}
        </Modal>
      )}
      {sheetsExportMode && (
        <StaffSheetsExportModal
          mode={sheetsExportMode}
          leads={visibleLeads}
          projects={data?.projects || []}
          staffUsers={data?.assignees || []}
          onClose={() => setSheetsExportMode(null)}
          onSuccess={(msg) => {
            setError("");
            setNotice(msg);
          }}
          onError={(err) => setError(err)}
        />
      )}
      {pendingCalendarSync && (
        <StaffCalendarSyncConfirmModal
          pending={pendingCalendarSync}
          onClose={() => setPendingCalendarSync(null)}
          onSynced={(msg) => {
            setError("");
            setNotice(msg);
          }}
          onError={(err) => setError(err)}
        />
      )}
    </div>
  );
}





createRoot(document.getElementById("root")!).render(<App />);
