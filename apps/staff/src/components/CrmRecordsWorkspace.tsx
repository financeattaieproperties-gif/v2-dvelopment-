import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
  UserRound,
  X,
} from "lucide-react";
import type {
  DashboardData,
  Followup,
  Lead,
  Role,
} from "../../../../packages/staff-contracts/types";
import { taskState } from "../../../../packages/staff-contracts/workflow.mjs";
import {
  type ModalState,
  type Page,
  type Translate,
  client,
  initials,
  labels,
} from "../staffConfig";
import { AgentConversionChart } from "./AgentConversionChart";
import { LeadConversionFunnelChart } from "./LeadConversionFunnelChart";
import { MobileLeadCardList } from "./SalesMobileCards";
import { DateRangePicker, type DateRange } from "./ui/date-range-picker";
import { Empty } from "./StaffUiPrimitives";

export interface LeadsPipelineSummary {
  total: number;
  active: number;
  draft: number;
  closed: number;
  lost: number;
  percentages: {
    activePct: number;
    draftPct: number;
    closedPct: number;
    lostPct: number;
  };
}

export function CrmRecordsWorkspace({
  t,
  page,
  data,
  activeRole,
  userId,
  language,
  isExecOrBranchManager,
  canAssignTasks,
  manager,
  isNotificationSupported,
  notificationPermission,
  isTestingNotification,
  requestNotificationPermission,
  sendTestNotification,
  leadsPipelineSummary,
  leadStatusFilter,
  setLeadStatusFilter,
  leadDateRange,
  setLeadDateRange,
  visibleLeads,
  followups,
  query,
  setQuery,
  number,
  setNumber,
  loading,
  filter,
  setFilter,
  handleExportLeadsCsv,
  handleExportLeadsPdf,
  setSheetsExportMode,
  setNotice,
  refresh,
  navigate,
  setModal,
  followupTable,
  badge,
  format,
}: {
  t: Translate;
  page: Page;
  data: DashboardData | null;
  activeRole: Role;
  userId: number;
  language: "en" | "fa";
  isExecOrBranchManager: boolean;
  canAssignTasks: boolean;
  manager: boolean;
  isNotificationSupported: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  isTestingNotification: boolean;
  requestNotificationPermission: () => Promise<NotificationPermission | "unsupported">;
  sendTestNotification: () => Promise<unknown>;
  leadsPipelineSummary: LeadsPipelineSummary;
  leadStatusFilter: string;
  setLeadStatusFilter: (s: string) => void;
  leadDateRange: DateRange;
  setLeadDateRange: (r: DateRange) => void;
  visibleLeads: Lead[];
  followups: Followup[];
  query: string;
  setQuery: (q: string) => void;
  number: number;
  setNumber: (updater: number | ((n: number) => number)) => void;
  loading: boolean;
  filter: string;
  setFilter: (f: string) => void;
  handleExportLeadsCsv: () => void;
  handleExportLeadsPdf: () => void;
  setSheetsExportMode: (m: "leads" | "inventory" | null) => void;
  setNotice: (msg: string) => void;
  refresh: () => Promise<void>;
  navigate: (p: Page) => void;
  setModal: (m: ModalState) => void;
  followupTable: (rows: Followup[]) => ReactNode;
  badge: (status: string) => ReactNode;
  format: (s: string) => string;
}) {
  return (
    <>
      {page === "customers" &&
        isExecOrBranchManager &&
        (data?.customerReviewRequests || []).filter(
          (r) => r.status === "pending_review",
        ).length > 0 && (
          <section
            className="panel"
            style={{ marginBottom: 16 }}
            data-testid="manager-customer-review-queue"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  Phase 3 Deduplication · Redacted Conflict Queue
                </p>
                <h2>Pending Customer Duplicate Review Requests</h2>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Phone</th>
                    <th>Requesting Agent</th>
                    <th>Submitted Name & Requirements</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.customerReviewRequests || [])
                    .filter((r) => r.status === "pending_review")
                    .map((req) => (
                      <tr key={req.id}>
                        <td dir="ltr">
                          <strong>{req.phone}</strong>
                        </td>
                        <td>{req.requestingAgentName}</td>
                        <td>
                          <strong>{req.submittedName}</strong>
                          <small>{req.submittedRequirements}</small>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className="button"
                              data-testid={`approve-customer-review-${req.id}`}
                              onClick={async () => {
                                await client.resolveCustomerReview(
                                  req.id,
                                  "approved_shared",
                                  req.version ?? 1,
                                );
                                setNotice(
                                  `Granted shared customer access to ${req.requestingAgentName}.`,
                                );
                                await refresh();
                              }}
                            >
                              Approve Shared Access
                            </button>
                            <button
                              type="button"
                              className="button secondary"
                              onClick={async () => {
                                await client.resolveCustomerReview(
                                  req.id,
                                  "rejected",
                                  req.version ?? 1,
                                );
                                setNotice("Rejected duplicate request.");
                                await refresh();
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      {page === "leads" &&
        isNotificationSupported &&
        notificationPermission === "default" && (
          <section
            className="lead-notifications-banner tone-prompt"
            data-testid="lead-notifications-banner"
          >
            <div className="lead-notifications-banner-copy">
              <span className="lead-notifications-banner-icon">
                <Bell size={20} />
              </span>
              <div>
                <strong>{t("Never miss a new customer inquiry")}</strong>
                <p>
                  {t(
                    "Enable mobile push notifications to get instant lock-screen alerts and vibration whenever new leads or property tours are assigned to you.",
                  )}
                </p>
              </div>
            </div>
            <div className="lead-notifications-banner-actions">
              <button
                type="button"
                className="button"
                style={{ minHeight: 34, fontSize: "12px", padding: "6px 14px" }}
                onClick={() => void requestNotificationPermission()}
              >
                <Bell size={14} />
                {t("Enable Notifications")}
              </button>
              <button
                type="button"
                className="button secondary"
                style={{ minHeight: 34, fontSize: "12px", padding: "6px 12px" }}
                disabled={isTestingNotification}
                onClick={() => void sendTestNotification()}
                title={t("Test notification delivery")}
              >
                {t("Test Alert")}
              </button>
            </div>
          </section>
        )}

      {page === "leads" && (
        <section
          className="panel pipeline-health-panel"
          style={{ marginBottom: 16 }}
          data-testid="leads-pipeline-summary-card"
        >
          <div className="panel-heading" style={{ marginBottom: 12 }}>
            <div>
              <p className="eyebrow">{t("ATTAIE WORKSPACE")}</p>
              <h2>{t("Pipeline Health Summary")}</h2>
              <p>{t("Quick glance at lead pipeline distribution by status.")}</p>
            </div>
            <span className="crm-status-inline">
              {t("Total Leads")}: <strong>{leadsPipelineSummary.total}</strong>
            </span>
          </div>

          <div className="pipeline-health-body" style={{ padding: "14px 16px 18px" }}>
            <div
              style={{
                display: "flex",
                height: 6,
                borderRadius: 6,
                overflow: "hidden",
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                marginBottom: 12,
              }}
              aria-label="Pipeline status distribution bar"
            >
              {leadsPipelineSummary.active > 0 && (
                <div
                  style={{
                    width: `${Math.max(4, leadsPipelineSummary.percentages.activePct)}%`,
                    background: "#0072BC",
                  }}
                  title={`Active: ${leadsPipelineSummary.active} (${leadsPipelineSummary.percentages.activePct}%)`}
                />
              )}
              {leadsPipelineSummary.draft > 0 && (
                <div
                  style={{
                    width: `${Math.max(4, leadsPipelineSummary.percentages.draftPct)}%`,
                    background: "#D97706",
                  }}
                  title={`Draft: ${leadsPipelineSummary.draft} (${leadsPipelineSummary.percentages.draftPct}%)`}
                />
              )}
              {leadsPipelineSummary.closed > 0 && (
                <div
                  style={{
                    width: `${Math.max(4, leadsPipelineSummary.percentages.closedPct)}%`,
                    background: "#059669",
                  }}
                  title={`Closed: ${leadsPipelineSummary.closed} (${leadsPipelineSummary.percentages.closedPct}%)`}
                />
              )}
              {leadsPipelineSummary.lost > 0 && (
                <div
                  style={{
                    width: `${Math.max(4, leadsPipelineSummary.percentages.lostPct)}%`,
                    background: "#DC2626",
                  }}
                  title={`Lost: ${leadsPipelineSummary.lost} (${leadsPipelineSummary.percentages.lostPct}%)`}
                />
              )}
            </div>

            <div className="pipeline-stat-grid">
              {[
                {
                  key: "all",
                  label: t("Total Leads"),
                  count: leadsPipelineSummary.total,
                  pct: 100,
                  testId: "pipeline-stat-total",
                },
                {
                  key: "active",
                  label: t("Active"),
                  count: leadsPipelineSummary.active,
                  pct: leadsPipelineSummary.percentages.activePct,
                  testId: "pipeline-stat-active",
                },
                {
                  key: "draft",
                  label: t("Draft"),
                  count: leadsPipelineSummary.draft,
                  pct: leadsPipelineSummary.percentages.draftPct,
                  testId: "pipeline-stat-draft",
                },
                {
                  key: "closed",
                  label: t("Closed"),
                  count: leadsPipelineSummary.closed,
                  pct: leadsPipelineSummary.percentages.closedPct,
                  testId: "pipeline-stat-closed",
                },
                {
                  key: "lost",
                  label: t("Lost"),
                  count: leadsPipelineSummary.lost,
                  pct: leadsPipelineSummary.percentages.lostPct,
                  testId: "pipeline-stat-lost",
                },
              ].map((stat) => {
                const isSelected = leadStatusFilter === stat.key;
                return (
                  <button
                    key={stat.key}
                    type="button"
                    data-testid={stat.testId}
                    onClick={() => setLeadStatusFilter(stat.key)}
                    className={`pipeline-stat-chip ${isSelected ? "selected" : ""}`}
                  >
                    <div className="pipeline-stat-chip-top">
                      <span>{stat.label}</span>
                      <small>{stat.key === "all" ? "100%" : `${stat.pct}%`}</small>
                    </div>
                    <strong>{stat.count}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {page === "leads" && activeRole === "sales_leader" && (
        <div className="sales-leader-charts-grid">
          <AgentConversionChart
            leads={data?.leads || []}
            assignees={data?.assignees || []}
            leaderId={userId}
            serverTime={data?.serverTime}
            language={language}
          />
          <LeadConversionFunnelChart
            leads={data?.leads || []}
            assignees={data?.assignees || []}
            leaderId={userId}
            serverTime={data?.serverTime}
            language={language}
          />
        </div>
      )}

      <section className="panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNumber(0);
              }}
              placeholder={`${t("Search")}…`}
              aria-label={t("Search")}
            />
            {query && (
              <button
                className="icon-button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {page === "leads" && (
              <>
                <button
                  type="button"
                  className="button secondary"
                  data-testid="export-leads-csv-btn"
                  onClick={handleExportLeadsCsv}
                  disabled={!visibleLeads.length}
                >
                  <Download size={15} />
                  {t("Export CSV")} ({visibleLeads.length})
                </button>
                <button
                  type="button"
                  className="button secondary"
                  data-testid="export-leads-pdf-btn"
                  onClick={handleExportLeadsPdf}
                  disabled={!visibleLeads.length}
                >
                  <FileText size={15} />
                  {t("Export PDF")} ({visibleLeads.length})
                </button>
                <button
                  type="button"
                  className="button secondary"
                  data-testid="export-leads-sheets-btn"
                  onClick={() => setSheetsExportMode("leads")}
                  disabled={!visibleLeads.length}
                >
                  <Table2 size={15} />
                  {t("Export Google Sheets")} ({visibleLeads.length})
                </button>
              </>
            )}
            <span className="list-note">
              <SlidersHorizontal size={15} />
              {t("Your permitted records")}
            </span>
          </div>
        </div>
        {page === "followups" && (
          <div className="filter-bar">
            {[
              ["today", "Today"],
              ["due", "All due"],
              ["upcoming", "Upcoming"],
              ["overtime", "Overtime"],
              ["completed", "Completed"],
              ["all", "All"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={filter === id ? "active" : ""}
              >
                {t(label)}
              </button>
            ))}
          </div>
        )}
        {page === "leads" && (
          <div className="filter-bar" data-testid="leads-status-filter-bar">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["draft", "Needs details"],
              ["closed", "Deal closed"],
              ["lost", "Deal lost"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLeadStatusFilter(id)}
                className={leadStatusFilter === id ? "active" : ""}
              >
                {t(label)}
              </button>
            ))}
            <div style={{ marginInlineStart: "auto" }}>
              <DateRangePicker
                value={leadDateRange}
                onChange={setLeadDateRange}
                placeholder={t("Filter by date")}
                align="right"
              />
            </div>
          </div>
        )}
        {page === "followups" && followupTable(followups)}
        {page === "customers" &&
          (data?.customers.length ? (
            <div className="customer-grid">
              {data.customers.map((customer) => (
                <button
                  className="customer-card"
                  key={customer.id}
                  onClick={() => {
                    setQuery(customer.phone);
                    navigate("leads");
                    setQuery(customer.phone);
                  }}
                >
                  <div className="customer-top">
                    <span className="avatar">{initials(customer.name)}</span>
                    <ArrowUpRight size={17} />
                  </div>
                  <h3>{customer.name}</h3>
                  {customer.serial && (
                    <small className="serial">{customer.serial}</small>
                  )}
                  <p className="phone" dir="ltr">
                    {customer.phone}
                  </p>
                  <div className="customer-requirements">
                    <small>{t("Requirements")}</small>
                    <p>{customer.requirements}</p>
                  </div>
                  <span className="customer-footer">
                    {t("Linked inquiries")}
                    <strong>{customer.leadCount}</strong>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title={t("No records to show")}
              text={t("Submitting a lead automatically adds its customer here.")}
            />
          ))}
        {page === "leads" &&
          (visibleLeads.length ? (
            <>
              <div className="table-scroll desktop-table-wrap">
                <table data-testid="staff-leads-table">
                  <thead>
                    <tr>
                      <th>{t("Customer")}</th>
                      <th>{t("Requirements")}</th>
                      <th>{t("Call date and time")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <strong>{lead.customerName || t("New inquiry")}</strong>
                          <small className="serial">{lead.serial}</small>
                          <small dir="ltr">
                            <a
                              href={`tel:${lead.phone}`}
                              className="phone-call-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.phone}
                            </a>
                          </small>
                          {lead.projectName && (
                            <small>
                              Project: {lead.projectName}{" "}
                              {lead.apartmentNumber || ""}
                            </small>
                          )}
                        </td>
                        <td>
                          <p className="truncate-text">
                            {lead.requirements || "—"}
                          </p>
                        </td>
                        <td>
                          {format(lead.callAt)}
                          <small>
                            {t(
                              lead.source === "provider"
                                ? "Provider event"
                                : "Manual entry",
                            )}
                          </small>
                        </td>
                        <td>{badge(lead.status)}</td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() =>
                              setModal({
                                kind: lead.status === "draft" ? "entry" : "detail",
                                item: lead,
                              })
                            }
                          >
                            {t(
                              lead.status === "draft" ? "Complete entry" : "Open",
                            )}
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <MobileLeadCardList
                leads={visibleLeads}
                t={t}
                format={format}
                statusLabel={(s) => labels[s] || s}
                onSelectLead={(lead, kind) => setModal({ kind, item: lead })}
              />
            </>
          ) : (
            <Empty
              title={t("No records to show")}
              text={t("Record your first call to create a lead.")}
            />
          ))}
        {(page === "tasks" || page === "team") &&
          (data?.tasks.length ? (
            <div className="task-list">
              {data.tasks.map((task) => {
                const assigneeName =
                  task.assigneeName ||
                  data.assignees?.find((u) => u.id === task.assigneeId)?.name;
                return (
                  <button
                    className="task-row"
                    key={task.id}
                    onClick={() => setModal({ kind: "task", item: task })}
                  >
                    <span className="task-check">
                      <ClipboardList size={17} />
                    </span>
                    <span className="task-row-title">
                      <strong>{task.title}</strong>
                      <small>
                        {page === "team" && assigneeName
                          ? `${t("Assigned to")}: ${assigneeName} · ${t("Assigned by")}: ${task.assignedBy}`
                          : task.assignedBy}{" "}
                        · {format(task.deadlineAt)}
                        {task.projectName ? ` · ${task.projectName}` : ""}
                      </small>
                    </span>
                    {badge(task.priority)}
                    {badge(taskState(task, data.serverTime))}
                    <ArrowUpRight size={17} />
                  </button>
                );
              })}
            </div>
          ) : (
            <Empty
              title={t("No records to show")}
              text={t("Assigned tasks appear here with a priority and deadline.")}
            />
          ))}
        <div className="pagination">
          <span>
            {t("Page")} {number + 1} · {t("Up to 25 records")}
          </span>
          <div>
            <button
              className="icon-button"
              disabled={!number || loading}
              onClick={() => setNumber((n) => n - 1)}
              aria-label={t("Previous")}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              className="icon-button"
              disabled={
                loading ||
                Math.max(
                  data?.leads.length || 0,
                  data?.followups.length || 0,
                  data?.customers.length || 0,
                  data?.tasks.length || 0,
                ) < 25
              }
              onClick={() => setNumber((n) => n + 1)}
              aria-label={t("Next")}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
      {page === "followups" && (
        <p className="below-note">
          <Clock3 size={15} />
          {t("Feedback is due within 24 hours of the scheduled time.")}{" "}
          {t("Late feedback remains in the activity history.")}
        </p>
      )}
      {page === "team" && (canAssignTasks || manager) && (
        <div
          className="team-action"
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          {canAssignTasks && (
            <button
              className="button"
              data-testid="team-assign-task-btn"
              onClick={() => setModal({ kind: "assign" })}
            >
              <Plus size={17} />
              {t("Assign task")}
            </button>
          )}
          {manager && (
            <>
              <button
                className="button secondary"
                data-testid="create-department-btn"
                onClick={() => setModal({ kind: "department" })}
              >
                <Building2 size={17} />
                {t("Create department")}
              </button>
              <button
                className="button secondary"
                data-testid="create-agent-btn"
                onClick={() => setModal({ kind: "staff" })}
              >
                <UserRound size={17} />
                {t("Create agent")}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
