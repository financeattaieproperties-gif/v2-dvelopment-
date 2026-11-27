import React, { useState } from "react";
import { Eye, EyeOff, Fingerprint } from "lucide-react";
import type { Role, Session, StaffUser } from "../../../../packages/staff-contracts/types";
import { getPasswordVisibilityProps } from "../../../../packages/staff-contracts/role-preference.mjs";
import {
  clearBiometricEnrollment,
  enrollBiometric,
  getBiometricStatus,
  setQuickSignInPreference,
} from "../auth/biometric";
import { SWITCHABLE_ROLES, type Translate, client } from "../staffConfig";
import { Field, FormError, useSubmission } from "./StaffUiPrimitives";

export function DepartmentForm({
  t,
  done,
}: {
  t: Translate;
  done: () => Promise<void>;
}) {
  const { busy, error, submit } = useSubmission(done);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = {
          code: String(f.get("code")),
          name: String(f.get("name")),
        };
        void submit(body, () => client.createDepartment(body));
      }}
    >
      <Field label={t("Department Code")}>
        <input name="code" required maxLength={60} placeholder="legal_affairs" />
      </Field>
      <Field label={t("Department Name")}>
        <input name="name" required maxLength={120} placeholder="Legal & Compliance" />
      </Field>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {t("Save Department")}
      </button>
    </form>
  );
}

const STAFF_DEFAULT_DEPARTMENT: Partial<Record<Role, string>> = {
  manager: "management",
  callcenter: "callcenter",
  sales_leader: "sales",
  sales: "sales",
  marketing_manager: "production",
  videographer: "production",
  editor: "production",
  finance_manager: "finance",
  architect: "engineering",
  graphic_designer: "engineering",
  visual_designer_3d: "engineering",
};

export function StaffForm({
  t,
  departments,
  branches,
  salesLeaders,
  done,
}: {
  t: Translate;
  departments: Array<{ code: string; name: string }>;
  branches: Array<{ id: number; name: string }>;
  salesLeaders: StaffUser[];
  done: () => Promise<void>;
}) {
  const { busy, error, submit } = useSubmission(done);
  const [selectedRole, setSelectedRole] = useState<Role>("sales");
  const [departmentCode, setDepartmentCode] = useState<string>("sales");
  const provisionableRoles = SWITCHABLE_ROLES.filter((r) => r.role !== "ceo");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body: Record<string, unknown> = Object.fromEntries(f);
        if (selectedRole !== "sales" || !body.teamLeaderId) {
          delete body.teamLeaderId;
        }
        if (body.branchId) {
          body.branchId = Number(body.branchId);
        }
        void submit(body, (key) => client.createStaff(body, key));
      }}
    >
      <Field label={t("Name")}>
        <input name="name" required maxLength={120} />
      </Field>
      <Field label={t("Email")}>
        <input
          name="username"
          type="email"
          autoComplete="off"
          required
          maxLength={254}
        />
      </Field>
      <p>{t("Create the account in Firebase first, then enter its exact UID and email here.")}</p>
      <Field label={t("Firebase UID")}>
        <input
          name="firebaseUid"
          autoComplete="off"
          required
          maxLength={128}
        />
      </Field>
      <div className="form-grid">
        <Field label={t("Role")}>
          <select
            name="role"
            value={selectedRole}
            onChange={(e) => {
              const nextRole = e.target.value as Role;
              setSelectedRole(nextRole);
              const nextDept = STAFF_DEFAULT_DEPARTMENT[nextRole];
              if (nextDept) setDepartmentCode(nextDept);
            }}
          >
            {provisionableRoles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Department")}>
          <select
            name="departmentCode"
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {branches.length > 0 && (
        <Field label={t("Branch")}>
          <select name="branchId" defaultValue={String(branches[0].id)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {selectedRole === "sales" && (
        <Field label={t("Sales team leader")}>
          <select name="teamLeaderId" defaultValue="">
            <option value="">{t("None (unassigned)")}</option>
            {salesLeaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {t("Create agent")}
      </button>
    </form>
  );
}

export function PasswordForm({ t }: { t: Translate; done: () => void }) {
  const [sent, setSent] = useState(false);
  const { busy, error, submit } = useSubmission(async () => {
    setSent(true);
  });
  return (
    <form
      className="panel profile-card"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void submit({}, () => client.resetPassword(String(form.get("email"))));
      }}
    >
      <h2>{t("Security")}</h2>
      <p>{t("Reset your password by email.")}</p>
      <Field label={t("Email")}>
        <input name="email" type="email" autoComplete="email" required />
      </Field>
      <FormError message={error} />
      {sent && (
        <p role="status">
          {t("If the account exists, a password reset email has been sent.")}
        </p>
      )}
      <button className="button" disabled={busy}>
        {t("Send reset email")}
      </button>
    </form>
  );
}

export function BiometricSecurityCard({
  t,
  session,
  onNotify,
  onError,
}: {
  t: Translate;
  session: Session;
  onNotify: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [status, setStatus] = useState(() => getBiometricStatus());
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pwdProps = getPasswordVisibilityProps(showPassword);
  const pwdId = React.useId();

  if (!status.available) return null;

  const defaultEmail = session.user.username?.includes("@")
    ? session.user.username
    : "";

  return (
    <section
      className="panel biometric-profile-card"
      data-testid="profile-biometric-card"
    >
      <div className="biometric-profile-head">
        <div className="biometric-profile-identity">
          <span className="biometric-quick-icon">
            <Fingerprint size={20} />
          </span>
          <div>
            <h3>{t("Fingerprint & Face Unlock")}</h3>
            <p>
              {t(
                "Use device biometrics on this phone instead of re-entering your password.",
              )}
            </p>
          </div>
        </div>
      </div>

      {status.enrolled ? (
        <>
          <div className="biometric-status-row">
            <span>
              {t("Enabled for")} <strong>{status.email}</strong>
            </span>
            <button
              type="button"
              className="button secondary"
              data-testid="profile-biometric-disable"
              onClick={() => {
                clearBiometricEnrollment();
                setStatus(getBiometricStatus());
                onNotify(t("Biometric unlock disabled on this device."));
              }}
            >
              {t("Disable biometric unlock")}
            </button>
          </div>
          <div className="biometric-toggle-row" style={{ marginTop: 12 }}>
            <div className="biometric-toggle-copy">
              <strong>{t("Quick Sign-in")}</strong>
              <small>
                {t("Prompt fingerprint or face immediately on app launch")}
              </small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={status.quickSignInEnabled}
              aria-label={t("Quick Sign-in")}
              data-testid="profile-quick-signin-toggle"
              className="alabaster-switch"
              onClick={() => {
                const next = !status.quickSignInEnabled;
                setQuickSignInPreference(next);
                setStatus(getBiometricStatus());
              }}
            >
              <span className="alabaster-switch-thumb" />
            </button>
          </div>
        </>
      ) : (
        <form
          className="biometric-enable-form"
          data-testid="profile-biometric-enable-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const email = String(f.get("email") || "").trim();
            const password = String(f.get("password") || "");
            if (!email || !password) return;
            setBusy(true);
            onError("");
            try {
              await client.login(email, password);
              const res = await enrollBiometric(email, password, {
                title: t("Attaie Sales CRM"),
                subtitle: t(
                  "Confirm your fingerprint or face to enable quick sign-in",
                ),
                cancelLabel: t("Cancel"),
              });
              if (res.ok) {
                setStatus(getBiometricStatus());
                onNotify(t("Biometric unlock enabled on this device."));
                e.currentTarget.reset();
              } else if (!res.cancelled && res.message) {
                onError(t(res.message));
              }
            } catch (err) {
              onError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p style={{ width: "100%", fontSize: 12, color: "#64748B", margin: 0 }}>
            {t("Confirm your password once to lock biometric unlock on this device.")}
          </p>
          <Field label={t("Email")}>
            <input
              name="email"
              type="email"
              defaultValue={defaultEmail}
              autoComplete="username"
              required
            />
          </Field>
          <div className="field">
            <label htmlFor={pwdId}>{t("Password")}</label>
            <div className="password-input-wrap">
              <input
                id={pwdId}
                name="password"
                type={pwdProps.inputType}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={t(pwdProps.buttonLabel)}
                aria-pressed={pwdProps.ariaPressed}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="button"
            disabled={busy}
            data-testid="profile-biometric-enable-btn"
          >
            <Fingerprint size={16} />
            {t("Enable biometric unlock")}
          </button>
        </form>
      )}
    </section>
  );
}
