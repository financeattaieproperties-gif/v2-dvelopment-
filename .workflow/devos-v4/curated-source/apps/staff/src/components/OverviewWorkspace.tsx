import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  ClipboardList,
  Clock3,
  PhoneIncoming,
} from "lucide-react";
import type {
  DashboardData,
  Followup,
  Role,
} from "../../../../packages/staff-contracts/types";
import { followupState } from "../../../../packages/staff-contracts/workflow.mjs";
import type { ModalState, Page, Translate } from "../staffConfig";
import { AgentConversionChart } from "./AgentConversionChart";
import { LeadConversionFunnelChart } from "./LeadConversionFunnelChart";
import { KpiSparkline, OverviewAnalyticsStrip } from "./OverviewAnalyticsStrip";
import { Empty } from "./StaffUiPrimitives";

export function OverviewWorkspace({
  t,
  data,
  activeRole,
  userId,
  language,
  hasSalesOrCallAccess,
  setFilter,
  navigate,
  setModal,
  followupTable,
  badge,
  format,
}: {
  t: Translate;
  data: DashboardData | null;
  activeRole: Role;
  userId: number;
  language: "en" | "fa";
  hasSalesOrCallAccess: boolean;
  setFilter: (f: string) => void;
  navigate: (p: Page) => void;
  setModal: (m: ModalState) => void;
  followupTable: (rows: Followup[]) => ReactNode;
  badge: (status: string) => ReactNode;
  format: (s: string) => string;
}) {
  return (
    <>
      <div className="stats-grid">
        {[
          {
            label: "New inquiries",
            value:
              data?.counts.newLeads ??
              data?.leads.filter((l) => l.status === "draft").length ??
              0,
            note: "Needs a first response",
            icon: PhoneIncoming,
            color: "gold",
            target: (hasSalesOrCallAccess ? "leads" : "tasks") as Page,
          },
          {
            label: "Due now",
            value:
              data?.counts.due ??
              data?.followups.filter((f) => followupState(f) === "due").length ??
              0,
            note: "Within the feedback window",
            icon: CalendarClock,
            color: "blue",
            target: (hasSalesOrCallAccess ? "followups" : "tasks") as Page,
          },
          {
            label: "Overtime",
            value:
              data?.counts.overtime ??
              data?.followups.filter((f) => followupState(f) === "overtime")
                .length ??
              0,
            note: "Past the 24-hour deadline",
            icon: Clock3,
            color: "red",
            target: (hasSalesOrCallAccess ? "followups" : "tasks") as Page,
          },
          {
            label: "My Tasks",
            value:
              data?.counts.tasks ??
              data?.tasks.filter((task) => task.status !== "completed").length ??
              0,
            note: "Assigned by management",
            icon: ClipboardList,
            color: "purple",
            target: "tasks" as Page,
          },
        ].map(({ label, value, note, icon: Icon, color, target }) => {
          const sparkColor =
            color === "gold" ? "#0072BC" : color === "red" ? "#818285" : "#14A850";
          const sparkPts = [
            Math.max(1, value - 2),
            Math.max(1, value - 1),
            Math.max(1, value),
            Math.max(1, value - 1),
            Math.max(1, value + 1),
            Math.max(1, value),
          ];
          return (
            <button
              className="stat-card"
              key={label}
              onClick={() => {
                setFilter(label === "Overtime" ? "overtime" : "due");
                navigate(target);
              }}
            >
              <div className="stat-top">
                <span>{t(label)}</span>
                <span className={`stat-icon ${color}`}>
                  <Icon size={18} />
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <strong
                  className="stat-number"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {value}
                </strong>
                <KpiSparkline points={sparkPts} color={sparkColor} />
              </div>
              <span className="stat-note">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 7px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: color === "red" ? "#F1F5F9" : "#E8F7EE",
                    color: color === "red" ? "#818285" : "#14A850",
                    marginInlineEnd: 6,
                  }}
                >
                  {t(note)}
                </span>
                <ArrowUpRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
      <OverviewAnalyticsStrip
        activeRole={activeRole}
        leads={data?.leads || []}
        followups={data?.followups || []}
      />
      {activeRole === "sales_leader" && (
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
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Your follow-ups")}</h2>
              <p>{t("All times in Kabul · UTC+04:30")}</p>
            </div>
            {hasSalesOrCallAccess && (
              <button
                className="text-button"
                onClick={() => {
                  setFilter("all");
                  navigate("followups");
                }}
              >
                {t("View all")}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
          {followupTable(
            (data?.followups || []).filter((f) => !f.completedAt).slice(0, 5),
          )}
        </section>
        <section className="panel task-preview">
          <div className="panel-heading">
            <div>
              <h2>{t("Next on your list")}</h2>
              <p>{t("Assigned by management")}</p>
            </div>
            <ClipboardList size={19} />
          </div>
          {data?.tasks.slice(0, 3).map((task) => (
            <button
              className="task-mini"
              key={task.id}
              onClick={() => setModal({ kind: "task", item: task })}
            >
              <span className="task-check">
                <Check size={14} />
              </span>
              <span>
                <strong>{task.title}</strong>
                <small>{format(task.deadlineAt)}</small>
              </span>
              {badge(task.priority)}
            </button>
          ))}
          {!data?.tasks.length && (
            <Empty
              title={t("No records to show")}
              text={t("Tasks from management will appear here.")}
            />
          )}
          <button className="task-footer" onClick={() => navigate("tasks")}>
            {t("My Tasks")}
            <ArrowRight size={15} />
          </button>
        </section>
      </div>
      <div className="integration-note">
        <AlertCircle size={15} />
        <span>
          <strong>{t("Etisalat not connected")}</strong> ·{" "}
          {t("Call time is entered manually; this is not a verified provider event.")}
        </span>
      </div>
    </>
  );
}
