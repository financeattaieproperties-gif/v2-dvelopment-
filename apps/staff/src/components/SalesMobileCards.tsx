import React from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Clock3,
  MessageCircle,
  Phone,
  PhoneCall,
} from "lucide-react";
import type { Followup, Lead } from "../../../../packages/staff-contracts/types";
import {
  feedbackDeadline,
  followupState,
} from "../../../../packages/staff-contracts/workflow.mjs";
import { formatMobileContactLinks } from "../../../../packages/staff-contracts/role-preference.mjs";

type Translate = (s: string) => string;

function initialsOf(name: string) {
  return (name || "NI")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

const STATUS_DOT_COLOR: Record<string, string> = {
  active: "#0072BC",
  due: "#0072BC",
  draft: "#818285",
  overtime: "#B91C1C",
  closed: "#14A850",
  completed: "#14A850",
  completed_late: "#818285",
  lost: "#B91C1C",
  upcoming: "#818285",
};

const CARD_SURFACE_STYLE: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  fontVariantNumeric: "tabular-nums",
};

const MUTED_META_STYLE: React.CSSProperties = {
  color: "#818285",
  fontVariantNumeric: "tabular-nums",
};

const CALL_BTN_STYLE: React.CSSProperties = {
  backgroundColor: "#0072BC",
  borderColor: "#0072BC",
  color: "#FFFFFF",
};

const WHATSAPP_BTN_STYLE: React.CSSProperties = {
  backgroundColor: "#E8F7EE",
  borderColor: "#14A850",
  color: "#14A850",
};

const CLOSED_PILL_STYLE: React.CSSProperties = {
  backgroundColor: "#E8F7EE",
  color: "#14A850",
  padding: "2px 8px",
  borderRadius: "9999px",
};

export function MobileLeadCardList({
  leads,
  t,
  format,
  statusLabel,
  onSelectLead,
}: {
  leads: Lead[];
  t: Translate;
  format: (s: string) => string;
  statusLabel: (status: string) => string;
  onSelectLead: (lead: Lead, kind: "entry" | "detail") => void;
}) {
  return (
    <div className="mobile-card-feed" data-testid="mobile-leads-card-feed">
      {leads.map((lead) => {
        const contact = formatMobileContactLinks(lead.phone);
        const dotColor = STATUS_DOT_COLOR[lead.status] || "#818285";
        const isDraft = lead.status === "draft";
        const isClosed = lead.status === "closed";
        return (
          <motion.article
            key={lead.id}
            className="crm-mobile-card"
            style={CARD_SURFACE_STYLE}
            data-testid={`mobile-lead-card-${lead.id}`}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.12 }}
          >
            <div className="crm-mobile-card-head">
              <div className="crm-mobile-card-identity">
                <span className="avatar">
                  {initialsOf(lead.customerName || t("New inquiry"))}
                </span>
                <div className="crm-mobile-card-titles">
                  <strong style={{ color: "#1E293B" }}>
                    {lead.customerName || t("New inquiry")}
                  </strong>
                  <div className="crm-mobile-card-meta" style={MUTED_META_STYLE}>
                    <span className="serial" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {lead.serial}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {contact.display}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className="crm-status-inline"
                style={isClosed ? CLOSED_PILL_STYLE : { color: "#818285" }}
              >
                <span
                  className="crm-status-dot"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                {t(statusLabel(lead.status))}
              </span>
            </div>

            {lead.projectName && (
              <div className="crm-mobile-card-project" style={{ color: "#1E293B" }}>
                <Building2 size={13} aria-hidden="true" style={{ color: "#0072BC", flexShrink: 0 }} />
                <span>
                  <strong>{lead.projectName}</strong>
                  {lead.apartmentNumber ? ` · ${lead.apartmentNumber}` : ""}
                </span>
              </div>
            )}

            <p className="crm-mobile-card-body">
              {lead.requirements || t("No requirements recorded yet.")}
            </p>

            <div className="crm-mobile-card-subrow" style={MUTED_META_STYLE}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {format(lead.callAt)}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t(
                  lead.source === "provider"
                    ? "Provider event"
                    : "Manual entry",
                )}
              </span>
            </div>

            <div className="crm-mobile-card-actions">
              {contact.telHref && (
                <a
                  href={contact.telHref}
                  className="crm-action-btn"
                  style={CALL_BTN_STYLE}
                  aria-label={`${t("Call")} ${lead.customerName || lead.phone}`}
                >
                  <Phone size={15} />
                  <span>{t("Call")}</span>
                </a>
              )}
              {contact.whatsappHref && (
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="crm-action-btn"
                  style={WHATSAPP_BTN_STYLE}
                  aria-label={`WhatsApp ${lead.customerName || lead.phone}`}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                className={`crm-action-btn ${isDraft ? "primary" : ""}`}
                style={
                  isDraft
                    ? CALL_BTN_STYLE
                    : { borderColor: "#E2E8F0", color: "#1E293B" }
                }
                onClick={() =>
                  onSelectLead(lead, isDraft ? "entry" : "detail")
                }
              >
                <span>{t(isDraft ? "Complete entry" : "Open")}</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export function MobileFollowupCardList({
  followups,
  serverTime,
  t,
  format,
  statusLabel,
  onSelectFollowup,
}: {
  followups: Followup[];
  serverTime?: string;
  t: Translate;
  format: (s: string) => string;
  statusLabel: (status: string) => string;
  onSelectFollowup: (
    item: Followup,
    kind: "feedback" | "detail",
  ) => void;
}) {
  return (
    <div className="mobile-card-feed" data-testid="mobile-followups-card-feed">
      {followups.map((item) => {
        const state = followupState(item, serverTime);
        const dotColor = STATUS_DOT_COLOR[state] || "#818285";
        const contact = formatMobileContactLinks(item.phone);
        const isDone = Boolean(item.completedAt);
        const isClosedState = (state as string) === "closed" || state === "completed" || state === "completed_late";
        return (
          <motion.article
            key={item.id}
            className="crm-mobile-card"
            style={CARD_SURFACE_STYLE}
            data-testid={`mobile-followup-card-${item.id}`}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.12 }}
          >
            <div className="crm-mobile-card-head">
              <div className="crm-mobile-card-identity">
                <span className="avatar">
                  {initialsOf(item.customerName)}
                </span>
                <div className="crm-mobile-card-titles">
                  <strong style={{ color: "#1E293B" }}>{item.customerName}</strong>
                  <div className="crm-mobile-card-meta" style={MUTED_META_STYLE}>
                    <span className="serial" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {item.serial}
                    </span>
                    {item.projectName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.projectName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span
                className="crm-status-inline"
                style={isClosedState ? CLOSED_PILL_STYLE : { color: "#818285" }}
              >
                <span
                  className="crm-status-dot"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                {t(statusLabel(state))}
              </span>
            </div>

            {item.requirements && (
              <p className="crm-mobile-card-body">{item.requirements}</p>
            )}

            <div className="crm-mobile-followup-times" style={MUTED_META_STYLE}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                <CalendarClock size={13} />
                {t("Scheduled")}:{" "}
                <strong style={{ color: "#1E293B" }}>{format(item.scheduledAt)}</strong>
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                <Clock3 size={13} />
                {t("Deadline")}:{" "}
                <strong style={{ color: "#1E293B" }}>
                  {format(feedbackDeadline(item.scheduledAt))}
                </strong>
              </span>
            </div>

            <div className="crm-mobile-card-actions">
              {contact.telHref && (
                <a
                  href={contact.telHref}
                  className="crm-action-btn"
                  style={CALL_BTN_STYLE}
                  aria-label={`${t("Call")} ${item.customerName}`}
                >
                  <PhoneCall size={15} />
                  <span>{t("Call")}</span>
                </a>
              )}
              <button
                type="button"
                className={`crm-action-btn ${!isDone ? "primary" : ""}`}
                style={
                  !isDone
                    ? CALL_BTN_STYLE
                    : { borderColor: "#E2E8F0", color: "#1E293B" }
                }
                onClick={() =>
                  onSelectFollowup(item, isDone ? "detail" : "feedback")
                }
              >
                <span>{t(isDone ? "Open" : "Feedback")}</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
