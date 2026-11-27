import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Calendar, Check, CheckCheck } from "lucide-react";
import type {
  Feedback,
  Followup,
  InventoryProject,
  Lead,
  ManagementTask,
  StaffUser,
} from "../../../../packages/staff-contracts/types";
import { canAssignTask, taskState } from "../../../../packages/staff-contracts/workflow.mjs";
import {
  enqueueOfflineEntry,
  isNetworkOfflineError,
} from "../../../../packages/staff-contracts/offline-cache.mjs";
import { extractAgentEmail } from "../../../../shared/googleCalendarSyncService";
import {
  ROLE_LABELS,
  type Translate,
  client,
  initials,
  labels,
  localInputNow,
  panelSpec,
  toUtc,
} from "../staffConfig";
import { StaffPhotoUpload } from "./StaffPhotoUpload";
import type { PendingStaffCalendarSync } from "./GoogleWorkspaceIntegration";
import { Agents, Field, FormError, useSubmission } from "./StaffUiPrimitives";

export function EntryForm({
  t,
  item,
  users,
  projects,
  self,
  done,
  onQueueOffline,
  onRequestCalendarSync,
}: {
  t: Translate;
  item?: Lead;
  users: StaffUser[];
  projects: InventoryProject[];
  self: StaffUser;
  done: () => Promise<void>;
  onQueueOffline?: () => void;
  onRequestCalendarSync?: (pending: PendingStaffCalendarSync) => void;
}) {
  const draft = useRef<Lead | undefined>(item);
  const draftKey = useRef(crypto.randomUUID());
  const [syncCalendar, setSyncCalendar] = useState(true);
  const pendingCalendarRef = useRef<PendingStaffCalendarSync | null>(null);
  const pendingOfflineEntryRef = useRef<{
    draft: {
      phone: FormDataEntryValue | null;
      callAt: string;
      source: FormDataEntryValue | null;
      projectId?: number;
    };
    entry: Record<string, unknown>;
  } | null>(null);
  const { busy, error, submit } = useSubmission(
    async () => {
      const pending = pendingCalendarRef.current;
      pendingCalendarRef.current = null;
      await done();
      if (pending && onRequestCalendarSync) {
        onRequestCalendarSync(pending);
      }
    },
    (_err, key) => {
      if (!pendingOfflineEntryRef.current) return false;
      enqueueOfflineEntry(panelSpec.panelId, self.id, {
        kind: "lead_entry",
        idempotencyKey: key,
        payload: {
          existingLeadId: draft.current?.id,
          existingLeadVersion: draft.current?.version,
          draft: pendingOfflineEntryRef.current.draft,
          entry: pendingOfflineEntryRef.current.entry,
          draftKey: draftKey.current,
          entryKey: key,
        },
      });
      pendingCalendarRef.current = null;
      onQueueOffline?.();
      return true;
    },
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const projectIdVal = f.get("projectId") ? Number(f.get("projectId")) : undefined;
        const body = {
          customerName: String(f.get("customerName")),
          requirements: String(f.get("requirements")),
          nextScheduledAt: toUtc(f.get("nextScheduledAt")),
          nextAssigneeId: Number(f.get("nextAssigneeId")),
          projectId: projectIdVal,
          ...(projectIdVal ? { property: { kind: "project" as const, id: projectIdVal } } : {}),
        };
        pendingOfflineEntryRef.current = {
          draft: {
            phone: f.get("phone"),
            callAt: draft.current ? draft.current.callAt : toUtc(f.get("callAt")),
            source: f.get("source") || "manual",
            projectId: body.projectId,
          },
          entry: body,
        };
        if (syncCalendar && onRequestCalendarSync) {
          const allUsers = [self, ...users.filter((u) => u.id !== self.id)];
          const assignedAgent = allUsers.find((u) => u.id === body.nextAssigneeId) || self;
          const proj = projects.find((p) => p.id === body.projectId);
          pendingCalendarRef.current = {
            scheduleType: "followup",
            customerName: body.customerName,
            customerPhone: String(f.get("phone") || item?.phone || ""),
            propertyOrProject: proj ? `${proj.code} — ${proj.name}` : undefined,
            serial: item?.serial,
            scheduledAtIso: body.nextScheduledAt,
            notes: body.requirements,
            assignedAgentName: assignedAgent.name,
            assignedAgentEmail: extractAgentEmail(assignedAgent),
          };
        } else {
          pendingCalendarRef.current = null;
        }
        void submit(body, async (key) => {
          if (!draft.current)
            draft.current = await client.draft(
              {
                phone: f.get("phone"),
                callAt: toUtc(f.get("callAt")),
                source: f.get("source") || "manual",
                projectId: body.projectId,
              },
              draftKey.current,
            );
          return client.entry(
            draft.current.id,
            { ...body, version: draft.current.version },
            key,
          );
        });
      }}
    >
      <p className="form-description">
        {t("This entry creates a customer and schedules the next follow-up.")}
      </p>
      {item && <p className="serial form-serial">{item.serial}</p>}
      <div className="form-grid">
        <Field label={t("Customer name")}>
          <input
            name="customerName"
            required
            maxLength={160}
            autoComplete="name"
          />
        </Field>
        <Field label={t("Phone")}>
          <input
            name="phone"
            required
            defaultValue={item?.phone}
            readOnly={!!draft.current}
            placeholder="07…"
            dir="ltr"
            inputMode="tel"
          />
        </Field>
      </div>
      {!item && (
        <div className="form-grid">
          <Field label={`${t("Call date and time")} · Kabul`}>
            <input
              type="datetime-local"
              name="callAt"
              required
              defaultValue={localInputNow()}
              readOnly={!!draft.current}
            />
          </Field>
          <Field label={t("Pre-Sale Project (Optional)")}>
            <select name="projectId" defaultValue="">
              <option value="">General Inquiry</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {self.role === "sales" && (
        <Field label={t("Lead Source")}>
          <select name="source" defaultValue="walk_in">
            <option value="walk_in">Walk-in</option>
            <option value="direct_call">Direct Call</option>
            <option value="company_referral">Company Referral</option>
            <option value="callcenter">Call Center Handoff</option>
            <option value="social_media">Social Media</option>
          </select>
        </Field>
      )}
      <Field label={t("Requirements")}>
        <textarea
          name="requirements"
          required
          rows={4}
          maxLength={4000}
          placeholder={t(
            "Describe the property, budget, location, and customer’s priorities.",
          )}
        />
      </Field>
      <div className="form-grid">
        <Field label={`${t("Next follow-up")} · Kabul`}>
          <input
            type="datetime-local"
            name="nextScheduledAt"
            required
            min={localInputNow()}
          />
        </Field>
        <Agents users={users} self={self} t={t} />
      </div>
      <p className="form-note">
        <AlertCircle size={14} />
        {t(
          "Call time is entered manually; this is not a verified provider event.",
        )}
      </p>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#475569",
          marginBottom: 10,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={syncCalendar}
          onChange={(e) => setSyncCalendar(e.target.checked)}
        />
        <Calendar size={14} />
        <span>{t("Sync scheduled follow-up to assigned agent's Google Calendar")}</span>
      </label>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {busy ? t("Saving…") : t("Save entry")}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export function FeedbackForm({
  t,
  task,
  users,
  projects,
  self,
  done,
  onQueueOffline,
  format,
  onRequestCalendarSync,
}: {
  t: Translate;
  task: Followup;
  users: StaffUser[];
  projects: InventoryProject[];
  self: StaffUser;
  done: () => Promise<void>;
  onQueueOffline?: () => void;
  format: (s: string) => string;
  onRequestCalendarSync?: (pending: PendingStaffCalendarSync) => void;
}) {
  const [outcome, setOutcome] = useState<
    "followup" | "visit" | "closed" | "lost"
  >("followup");
  const [selectedProjId, setSelectedProjId] = useState<number>(
    projects[0]?.id || 1,
  );
  const [buyerPhotoUrl, setBuyerPhotoUrl] = useState<string>("");
  const [tazkiraPhotoUrl, setTazkiraPhotoUrl] = useState<string>("");
  const [syncCalendar, setSyncCalendar] = useState(true);
  const pendingCalendarRef = useRef<PendingStaffCalendarSync | null>(null);
  const pendingFeedbackBodyRef = useRef<Feedback | null>(null);
  const selectedProj =
    projects.find((p) => p.id === selectedProjId) || projects[0];
  const { busy, error, submit } = useSubmission(
    async () => {
      const pending = pendingCalendarRef.current;
      pendingCalendarRef.current = null;
      await done();
      if (pending && onRequestCalendarSync) {
        onRequestCalendarSync(pending);
      }
    },
    (_err, key) => {
      if (!pendingFeedbackBodyRef.current) return false;
      enqueueOfflineEntry(panelSpec.panelId, self.id, {
        kind: "followup_feedback",
        idempotencyKey: key,
        payload: {
          taskId: task.id,
          body: pendingFeedbackBodyRef.current,
        },
      });
      pendingCalendarRef.current = null;
      onQueueOffline?.();
      return true;
    },
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body: Feedback = {
          outcome,
          version: task.version,
          ...(outcome === "lost"
            ? { reason: String(f.get("notes")) }
            : outcome === "closed"
              ? {
                  amount: String(f.get("amount")),
                  currency: String(f.get("currency")) as "AFN" | "USD",
                  projectId: Number(f.get("projectId")),
                  apartmentId: Number(f.get("apartmentId")),
                  buyerPhotoUrl: String(f.get("buyerPhotoUrl")),
                  tazkiraPhotoUrl: String(f.get("tazkiraPhotoUrl")),
                }
              : {
                  notes: String(f.get("notes")),
                  nextScheduledAt: toUtc(f.get("nextScheduledAt")),
                  nextAssigneeId: Number(f.get("nextAssigneeId")),
                }),
        };
        pendingFeedbackBodyRef.current = body;
        if (
          (outcome === "followup" || outcome === "visit") &&
          syncCalendar &&
          onRequestCalendarSync
        ) {
          const allUsers = [self, ...users.filter((u) => u.id !== self.id)];
          const assignedAgent =
            allUsers.find((u) => u.id === Number(f.get("nextAssigneeId"))) || self;
          pendingCalendarRef.current = {
            scheduleType: outcome === "visit" ? "visit" : "followup",
            customerName: task.customerName,
            serial: task.serial,
            scheduledAtIso: toUtc(f.get("nextScheduledAt")),
            notes: String(f.get("notes") || ""),
            assignedAgentName: assignedAgent.name,
            assignedAgentEmail: extractAgentEmail(assignedAgent),
          };
        } else {
          pendingCalendarRef.current = null;
        }
        void submit(body, (key) => client.feedback(task.id, body, key));
      }}
    >
      <div className="form-customer">
        <span className="avatar">{initials(task.customerName)}</span>
        <div>
          <strong>{task.customerName}</strong>
          <small className="serial">{task.serial}</small>
        </div>
        <span className="badge normal">{format(task.scheduledAt)}</span>
      </div>
      <Field label={t("Outcome")}>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as typeof outcome)}
        >
          <option value="followup">{t("Follow up")}</option>
          <option value="visit">{t("Visit")}</option>
          {self.role === "sales" && (
            <option value="closed">{t("Deal closed")}</option>
          )}
          <option value="lost">{t("Deal lost")}</option>
        </select>
      </Field>

      {outcome === "closed" ? (
        <div className="form-grid">
          <Field label={t("Select Pre-Sale Project")}>
            <select
              name="projectId"
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Select Apartment Unit")}>
            <select name="apartmentId">
              {(selectedProj?.apartments || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.unitNumber} ({a.areaSqm} m² • ${a.totalPrice.toLocaleString()})
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Agreed Total Amount")}>
            <input
              name="amount"
              type="number"
              step="0.01"
              defaultValue={selectedProj?.apartments[0]?.totalPrice || 120000}
              required
            />
          </Field>
          <Field label={t("Currency")}>
            <select name="currency" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="AFN">AFN</option>
            </select>
          </Field>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <StaffPhotoUpload
              label={t("Buyer 3×4 Portrait Photo")}
              value={buyerPhotoUrl}
              purpose="buyer_portrait"
              lang={document.documentElement.lang === "fa" ? "fa" : "en"}
              onUpload={client.upload}
              onChange={(url) => setBuyerPhotoUrl(url)}
            />
            <input
              name="buyerPhotoUrl"
              type="text"
              value={buyerPhotoUrl}
              onChange={(e) => setBuyerPhotoUrl(e.target.value)}
              placeholder="/staff-api/v1/files/..."
              required
              style={{ fontSize: 12 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <StaffPhotoUpload
              label={t("Buyer Tazkira Photo")}
              value={tazkiraPhotoUrl}
              purpose="buyer_tazkira"
              lang={document.documentElement.lang === "fa" ? "fa" : "en"}
              onUpload={client.upload}
              onChange={(url) => setTazkiraPhotoUrl(url)}
            />
            <input
              name="tazkiraPhotoUrl"
              type="text"
              value={tazkiraPhotoUrl}
              onChange={(e) => setTazkiraPhotoUrl(e.target.value)}
              placeholder="/staff-api/v1/files/..."
              required
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
      ) : (
        <>
          <Field label={t(outcome === "lost" ? "Reason for loss" : "Feedback")}>
            <textarea name="notes" required rows={4} maxLength={4000} />
          </Field>
          {outcome !== "lost" && (
            <div className="form-grid">
              <Field label={`${t("Next follow-up")} · Kabul`}>
                <input
                  type="datetime-local"
                  name="nextScheduledAt"
                  min={localInputNow()}
                  required
                />
              </Field>
              <Agents users={users} self={self} t={t} />
            </div>
          )}
        </>
      )}

      <p className="form-note">
        {t(
          outcome === "lost"
            ? "This lead will be completed. No next follow-up is required."
            : outcome === "closed"
              ? "Generates Deal Closed serial (SA01PRC-Project-Apt-DDMMYY) and sends handoff to HR Contracts."
              : "Feedback is due within 24 hours of the scheduled time.",
        )}
      </p>
      {(outcome === "followup" || outcome === "visit") && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#475569",
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={syncCalendar}
            onChange={(e) => setSyncCalendar(e.target.checked)}
          />
          <Calendar size={14} />
          <span>
            {outcome === "visit"
              ? t("Sync property visit to assigned agent's Google Calendar")
              : t("Sync next follow-up to assigned agent's Google Calendar")}
          </span>
        </label>
      )}
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {busy ? t("Saving…") : t("Submit feedback")}
        <Check size={17} />
      </button>
    </form>
  );
}

export function AssignForm({
  t,
  users,
  projects,
  self,
  done,
  onQueueOffline,
}: {
  t: Translate;
  users: StaffUser[];
  projects: InventoryProject[];
  self: StaffUser;
  done: () => Promise<void>;
  onQueueOffline?: () => void;
}) {
  const pendingTaskBodyRef = useRef<Record<string, unknown> | null>(null);
  const { busy, error, submit } = useSubmission(done, (_err, key) => {
    if (!pendingTaskBodyRef.current) return false;
    enqueueOfflineEntry(panelSpec.panelId, self.id, {
      kind: "task_create",
      idempotencyKey: key,
      payload: { body: pendingTaskBodyRef.current },
    });
    onQueueOffline?.();
    return true;
  });
  const assignableUsers = users.filter((u) => canAssignTask(self, u));
  const targetOptions = assignableUsers.length > 0 ? assignableUsers : users;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = {
          title: String(f.get("title")),
          instructions: String(f.get("instructions")),
          priority: String(f.get("priority")),
          assigneeId: Number(f.get("assigneeId")),
          projectId: f.get("projectId") ? Number(f.get("projectId")) : undefined,
          deadlineAt: toUtc(f.get("deadlineAt")),
        };
        pendingTaskBodyRef.current = body;
        void submit(body, (key) => client.createTask(body, key));
      }}
    >
      <Field label={t("Task title")}>
        <input name="title" required maxLength={200} />
      </Field>
      <Field label={t("Instructions")}>
        <textarea name="instructions" rows={4} required maxLength={4000} />
      </Field>
      <div className="form-grid">
        <Field label={t("Assign to")}>
          <select name="assigneeId" required>
            <option value="">{t("Select an agent")}</option>
            {targetOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABELS[u.role] || u.role})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Priority")}>
          <select name="priority" defaultValue="normal">
            {["low", "normal", "high", "urgent"].map((p) => (
              <option value={p} key={p}>
                {t(labels[p])}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-grid">
        <Field label={`${t("Deadline")} · Kabul`}>
          <input
            type="datetime-local"
            name="deadlineAt"
            required
            min={localInputNow()}
          />
        </Field>
        <Field label={t("Linked Pre-Sale Project (Optional)")}>
          <select name="projectId" defaultValue="">
            <option value="">General Office Task</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="form-note">
        {t(
          "This task has an explicit deadline, without a 24-hour grace period.",
        )}
      </p>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {busy ? t("Saving…") : t("Assign task")}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export function TaskDetail({
  t,
  task,
  self,
  done,
  onQueueOffline,
  format,
}: {
  t: Translate;
  task: ManagementTask;
  self: StaffUser;
  done: () => Promise<void>;
  onQueueOffline?: () => void;
  format: (s: string) => string;
}) {
  const pendingStatusRef = useRef<string | null>(null);
  const { busy, error, submit } = useSubmission(done, (_err, key) => {
    if (!pendingStatusRef.current) return false;
    enqueueOfflineEntry(panelSpec.panelId, self.id, {
      kind: "task_status",
      idempotencyKey: key,
      payload: {
        taskId: task.id,
        status: pendingStatusRef.current,
        version: task.version,
      },
    });
    onQueueOffline?.();
    return true;
  });
  const own = task.assigneeId === self.id;
  const active = !["completed", "cancelled"].includes(task.status);
  return (
    <div className="detail">
      <h3>{task.title}</h3>
      <p className="preserve-lines">{task.instructions}</p>
      <dl>
        {task.assigneeName && (
          <div>
            <dt>{t("Assigned to")}</dt>
            <dd>{task.assigneeName}</dd>
          </div>
        )}
        <div>
          <dt>{t("Assigned by")}</dt>
          <dd>{task.assignedBy}</dd>
        </div>
        <div>
          <dt>{t("Priority")}</dt>
          <dd>{t(labels[task.priority])}</dd>
        </div>
        <div>
          <dt>{t("Deadline")}</dt>
          <dd>{format(task.deadlineAt)}</dd>
        </div>
        <div>
          <dt>{t("Status")}</dt>
          <dd>{t(labels[taskState(task)])}</dd>
        </div>
      </dl>
      <p className="form-note">
        {t(
          "This task has an explicit deadline, without a 24-hour grace period.",
        )}
      </p>
      <FormError message={error} />
      {own && active && (
        <div className="form-grid">
          {task.status === "todo" && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                pendingStatusRef.current = "in_progress";
                void submit({ status: "in_progress" }, (key) =>
                  client.taskStatus(task.id, "in_progress", task.version, key),
                );
              }}
            >
              {t("Start task")}
            </button>
          )}
          <button
            className="button"
            disabled={busy}
            onClick={() => {
              pendingStatusRef.current = "completed";
              void submit({ status: "completed" }, (key) =>
                client.taskStatus(task.id, "completed", task.version, key),
              );
            }}
          >
            <CheckCheck size={16} />
            {t("Mark complete")}
          </button>
        </div>
      )}
    </div>
  );
}

export function LeadDetail({
  t,
  id,
  fallbackLead,
  format,
}: {
  t: Translate;
  id: number;
  fallbackLead?: Lead;
  format: (s: string) => string;
}) {
  const [lead, setLead] = useState<Lead | null>(fallbackLead || null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (
      typeof navigator !== "undefined" &&
      navigator.onLine === false &&
      fallbackLead
    ) {
      setLead(fallbackLead);
      setError("");
      return;
    }
    client
      .lead(id)
      .then((l) => {
        if (active) {
          setLead(l);
          setError("");
        }
      })
      .catch((e) => {
        if (active) {
          if (fallbackLead && isNetworkOfflineError(e)) {
            setLead(fallbackLead);
            setError("");
          } else {
            setError(e.message);
          }
        }
      });
    return () => {
      active = false;
    };
  }, [id, fallbackLead]);
  return (
    <div className="detail">
      <FormError message={error} />
      {!lead && !error ? (
        <p>{t("Loading your workspace…")}</p>
      ) : (
        lead && (
          <>
            <div className="form-customer">
              <span className="avatar">
                {initials(lead.customerName || "New inquiry")}
              </span>
              <div>
                <h3>{lead.customerName || t("New inquiry")}</h3>
                <small className="serial">{lead.serial}</small>
              </div>
            </div>
            <p dir="ltr">{lead.phone}</p>
            <h4>{t("Requirements")}</h4>
            <p className="preserve-lines">{lead.requirements}</p>
            {lead.deal && (
              <>
                <h4>{t("Deal closed")}</h4>
                <dl>
                  {lead.deal.dealSerial && (
                    <div>
                      <dt>Deal Serial</dt>
                      <dd>{lead.deal.dealSerial}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("Deal amount")}</dt>
                    <dd>
                      {lead.deal.currency} {lead.deal.amount}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Sales agent")}</dt>
                    <dd>{lead.deal.salesAgent}</dd>
                  </div>
                  <div>
                    <dt>{t("Completed")}</dt>
                    <dd>{format(lead.deal.closedAt)}</dd>
                  </div>
                </dl>
              </>
            )}
            <h4>{t("Activity history")}</h4>
            <div className="timeline">
              {lead.activities?.map((a) => (
                <div key={a.id}>
                  <span className="timeline-dot" />
                  <strong>{a.actorName}</strong>
                  <small>
                    {format(a.at)} · {t(a.type.replaceAll("_", " "))}
                  </small>
                  <p className="preserve-lines">{a.notes}</p>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
