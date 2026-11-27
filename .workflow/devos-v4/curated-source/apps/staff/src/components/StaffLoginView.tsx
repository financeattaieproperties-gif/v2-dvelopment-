import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Lock,
  Mail,
  X,
} from "lucide-react";
import type { Session } from "../../../../packages/staff-contracts/types";
import {
  getPasswordVisibilityProps,
  shouldAutoPromptBiometric,
} from "../../../../packages/staff-contracts/role-preference.mjs";
import {
  authenticateWithBiometric,
  clearBiometricEnrollment,
  enrollBiometric,
  getBiometricStatus,
  setQuickSignInPreference,
} from "../auth/biometric";
import { type Translate, client, isPreview, panelSpec } from "../staffConfig";
import { FormError } from "./StaffUiPrimitives";
import { PasswordForm } from "./StaffAdminModals";

export function Login({
  t,
  error,
  justSignedOut = false,
  onLogin,
}: {
  t: Translate;
  error: string;
  justSignedOut?: boolean;
  onLogin: (s: Session) => void;
  management: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [bioStatus, setBioStatus] = useState(() => getBiometricStatus());
  const [now, setNow] = useState(() => new Date());
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [desktopServerUrl, setDesktopServerUrl] = useState<string>("");
  const [androidApiBaseUrl, setAndroidApiBaseUrl] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const win = window as unknown as {
      __ATTAIE_ANDROID_APP__?: boolean;
      __ATTAIE_STAFF_API_BASE_URL__?: string;
      AttaieServerConfig?: { getApiBaseUrl?: () => string };
    };
    if (!win.__ATTAIE_ANDROID_APP__ && !win.AttaieServerConfig) return "";
    return (
      win.AttaieServerConfig?.getApiBaseUrl?.() ||
      win.__ATTAIE_STAFF_API_BASE_URL__ ||
      ""
    );
  });
  const [showAndroidServerSheet, setShowAndroidServerSheet] = useState(false);
  const [androidServerDraft, setAndroidServerDraft] = useState("");
  const [androidServerStatus, setAndroidServerStatus] = useState<{
    ok?: boolean;
    message: string;
  } | null>(null);
  const [testingAndroidServer, setTestingAndroidServer] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const bridge =
      (
        window as unknown as {
          attaieDesktop?: {
            getStatus?: () => Promise<{ serverUrl?: string; backendOrigin?: string }>;
            openServerConfig?: () => Promise<void>;
          };
          callcenterDesktop?: {
            getStatus?: () => Promise<{ serverUrl?: string; backendOrigin?: string }>;
            openServerConfig?: () => Promise<void>;
          };
        }
      ).attaieDesktop ||
      (
        window as unknown as {
          callcenterDesktop?: {
            getStatus?: () => Promise<{ serverUrl?: string; backendOrigin?: string }>;
            openServerConfig?: () => Promise<void>;
          };
        }
      ).callcenterDesktop;
    if (!bridge?.getStatus) return;
    let active = true;
    const refreshStatus = () => {
      bridge
        .getStatus!()
        .then((info) => {
          if (!active || !info) return;
          setDesktopServerUrl(info.backendOrigin || info.serverUrl || "");
        })
        .catch(() => {});
    };
    refreshStatus();
    window.addEventListener("focus", refreshStatus);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshStatus);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const win = window as unknown as { __ATTAIE_STAFF_API_BASE_URL__?: string };
    const rawApiBase = win.__ATTAIE_STAFF_API_BASE_URL__ || "";
    const originPrefix = /^https?:\/\//i.test(rawApiBase)
      ? rawApiBase.replace(/\/staff-api\/v1\/?$/i, "").replace(/\/+$/, "")
      : "";
    fetch(`${originPrefix}/visual-config/read.php`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!active) return;
        const url = cfg?.loginBackgrounds?.[panelSpec.panelId];
        if (url) setBgUrl(url);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("attaie_visual_config_draft");
          const parsed = raw ? JSON.parse(raw) : null;
          const url = parsed?.loginBackgrounds?.[panelSpec.panelId];
          if (active && url) setBgUrl(url);
        } catch {
          // ignore
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const [rememberedStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem("attaie_staff_last_user");
      if (saved) return saved;
      const bio = getBiometricStatus();
      if (bio.email) return bio.email.includes("@") ? bio.email.split("@")[0] : bio.email;
      return "";
    } catch {
      return "";
    }
  });
  const [enableBiometric, setEnableBiometric] = useState(true);
  const autoPromptTriggeredRef = useRef(false);
  const passwordId = React.useId();
  const pwdProps = getPasswordVisibilityProps(showPassword);

  const handleBiometricSignIn = useCallback(async () => {
    if (!bioStatus.available || !bioStatus.enrolled) return;
    setBioBusy(true);
    setFailure("");
    try {
      const bioResult = await authenticateWithBiometric({
        title: t(panelSpec.loginTitle),
        subtitle: t("Verify your fingerprint or face to sign in"),
        cancelLabel: t("Use password"),
      });
      if (!bioResult.ok) {
        if (!bioResult.cancelled && bioResult.message) {
          setFailure(t(bioResult.message));
        }
        return;
      }
      const email = bioResult.email || "";
      const password = bioResult.password || "";
      const loggedIn = await client.login(email, password);
      if (
        !isPreview &&
        !(panelSpec.allowedRoles as readonly string[]).includes(
          loggedIn.user.role,
        )
      ) {
        clearBiometricEnrollment();
        setBioStatus(getBiometricStatus());
        setFailure(t("This account does not have access to this workspace."));
        return;
      }
      onLogin(loggedIn);
    } catch {
      setFailure(
        t(
          "Saved biometric credentials are no longer valid. Please sign in with your password.",
        ),
      );
    } finally {
      setBioBusy(false);
    }
  }, [bioStatus.available, bioStatus.enrolled, onLogin, t]);

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    setFailure("");
    try {
      const loggedIn = await client.loginWithGoogle();
      if (
        !isPreview &&
        !(panelSpec.allowedRoles as readonly string[]).includes(
          loggedIn.user.role,
        )
      ) {
        setFailure(t("This account does not have access to this workspace."));
        return;
      }
      onLogin(loggedIn);
    } catch (err) {
      setFailure((err as Error).message || t("Google sign-in failed."));
    } finally {
      setGoogleBusy(false);
    }
  };

  useEffect(() => {
    if (
      !autoPromptTriggeredRef.current &&
      shouldAutoPromptBiometric({
        available: bioStatus.available,
        enrolled: bioStatus.enrolled,
        quickSignInEnabled: bioStatus.quickSignInEnabled,
        justSignedOut,
        attemptFailed: Boolean(error || failure),
      })
    ) {
      autoPromptTriggeredRef.current = true;
      void handleBiometricSignIn();
    }
  }, [
    bioStatus.available,
    bioStatus.enrolled,
    bioStatus.quickSignInEnabled,
    error,
    failure,
    handleBiometricSignIn,
    justSignedOut,
  ]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const screenStyle = bgUrl
    ? {
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.72), rgba(248, 250, 252, 0.72)), url("${bgUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className="login-screen" data-panel-id={panelSpec.panelId} style={screenStyle}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 14px",
          marginBottom: 16,
          borderRadius: 999,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          fontSize: 12,
          fontWeight: 600,
          color: "#475569",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <CalendarClock size={13} color="#0072BC" />
          <span>{dateLabel}</span>
        </span>
        <span style={{ color: "#CBD5E1" }}>•</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Clock3 size={13} color="#14A850" />
          <span>{timeLabel}</span>
        </span>
        {desktopServerUrl && (
          <>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <button
              type="button"
              onClick={() => {
                const bridge =
                  (
                    window as unknown as {
                      attaieDesktop?: { openServerConfig?: () => Promise<void> };
                      callcenterDesktop?: { openServerConfig?: () => Promise<void> };
                    }
                  ).attaieDesktop ||
                  (
                    window as unknown as {
                      callcenterDesktop?: { openServerConfig?: () => Promise<void> };
                    }
                  ).callcenterDesktop;
                void bridge?.openServerConfig?.();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#E6F2FA",
                border: "1px solid #BAE6FD",
                color: "#0072BC",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Switch Backend Server URL"
            >
              <Globe size={12} color="#0072BC" />
              <span>{desktopServerUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}</span>
            </button>
          </>
        )}
        {!desktopServerUrl && androidApiBaseUrl && (
          <>
            <span style={{ color: "#CBD5E1" }}>•</span>
            <button
              type="button"
              data-testid="android-server-config-btn"
              onClick={() => {
                setAndroidServerDraft(
                  androidApiBaseUrl.replace(/\/staff-api\/v1\/?$/i, ""),
                );
                setAndroidServerStatus(null);
                setShowAndroidServerSheet((prev) => !prev);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#E6F2FA",
                border: "1px solid #BAE6FD",
                color: "#0072BC",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Switch Backend Server URL"
            >
              <Globe size={12} color="#0072BC" />
              <span>
                {androidApiBaseUrl
                  .replace(/^https?:\/\//, "")
                  .replace(/\/.*$/, "")}
              </span>
            </button>
          </>
        )}
      </div>
      {showAndroidServerSheet && (
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            marginBottom: 14,
            padding: 16,
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 14, color: "#1E293B" }}>
              {t("Backend Server Connection")}
            </strong>
            <button
              type="button"
              onClick={() => setShowAndroidServerSheet(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748B",
              }}
              aria-label={t("Close")}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 10px" }}>
            {t(
              "Select or enter the backend server origin for Sales Agent CRM sync (/staff-api/v1).",
            )}
          </p>
          <input
            type="url"
            value={androidServerDraft}
            onChange={(e) => {
              setAndroidServerDraft(e.target.value);
              setAndroidServerStatus(null);
            }}
            placeholder="https://attaieproperties.com"
            style={{
              width: "100%",
              height: 36,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: 13,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 10,
            }}
          >
            {[
              {
                label: "Main (attaieproperties.com)",
                url: "https://attaieproperties.com",
              },
              {
                label: "V2 Testing (website.attaieproperties.com)",
                url: "https://website.attaieproperties.com",
              },
              {
                label: "WWW Host",
                url: "https://www.attaieproperties.com",
              },
            ].map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => {
                  setAndroidServerDraft(preset.url);
                  setAndroidServerStatus(null);
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  background: "#F1F5F9",
                  color: "#1E293B",
                  cursor: "pointer",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {androidServerStatus && (
            <div
              style={{
                fontSize: 12,
                padding: "8px 10px",
                borderRadius: 8,
                marginBottom: 10,
                background: androidServerStatus.ok ? "#E8F7EE" : "#FEF2F2",
                border: `1px solid ${androidServerStatus.ok ? "#86EFAC" : "#FECACA"}`,
                color: androidServerStatus.ok ? "#14532D" : "#991B1B",
              }}
            >
              {androidServerStatus.message}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              type="button"
              className="button secondary"
              disabled={testingAndroidServer}
              onClick={async () => {
                const cleaned = androidServerDraft
                  .trim()
                  .replace(/\/staff-api\/v1\/?$/i, "")
                  .replace(/\/+$/, "");
                if (!/^https?:\/\//i.test(cleaned)) {
                  setAndroidServerStatus({
                    ok: false,
                    message: "Enter a valid https:// server URL.",
                  });
                  return;
                }
                setTestingAndroidServer(true);
                setAndroidServerStatus(null);
                try {
                  const res = await fetch(`${cleaned}/staff-api/v1/session`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                  });
                  const payload = await res.json().catch(() => null);
                  if (res.ok && payload?.data?.csrfToken) {
                    setAndroidServerStatus({
                      ok: true,
                      message: `Connected to ${cleaned} (Staff API v1 ready)`,
                    });
                  } else {
                    setAndroidServerStatus({
                      ok: false,
                      message:
                        payload?.error?.message ||
                        `HTTP ${res.status} at ${cleaned}/staff-api/v1/session`,
                    });
                  }
                } catch {
                  setAndroidServerStatus({
                    ok: false,
                    message: `Unable to reach ${cleaned}/staff-api/v1/session`,
                  });
                } finally {
                  setTestingAndroidServer(false);
                }
              }}
            >
              {testingAndroidServer ? t("Testing…") : t("Test Connection")}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                const cleaned = androidServerDraft
                  .trim()
                  .replace(/\/staff-api\/v1\/?$/i, "")
                  .replace(/\/+$/, "");
                if (!/^https?:\/\//i.test(cleaned)) {
                  setAndroidServerStatus({
                    ok: false,
                    message: "Enter a valid https:// server URL.",
                  });
                  return;
                }
                const nextApiBase = `${cleaned}/staff-api/v1`;
                const win = window as unknown as {
                  __ATTAIE_STAFF_API_BASE_URL__?: string;
                  AttaieServerConfig?: {
                    setApiBaseUrl?: (url: string) => boolean;
                  };
                };
                win.__ATTAIE_STAFF_API_BASE_URL__ = nextApiBase;
                try {
                  win.AttaieServerConfig?.setApiBaseUrl?.(nextApiBase);
                  localStorage.setItem(
                    "attaie_android_api_base_url",
                    nextApiBase,
                  );
                } catch {
                  // ignore storage errors
                }
                setAndroidApiBaseUrl(nextApiBase);
                setShowAndroidServerSheet(false);
              }}
            >
              {t("Save & Connect")}
            </button>
          </div>
        </div>
      )}
      <main className="login-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <img
            src="./logo.png"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith("/login-logo.png")) {
                img.src = "/login-logo.png";
              }
            }}
            alt="Attaie Properties"
            style={{ maxWidth: 210, width: "100%", height: "auto", display: "block" }}
          />
        </div>
        <h1>
          {rememberedStaffUser
            ? `${t("Welcome Back")}, ${rememberedStaffUser}`
            : t("Welcome Back")}
        </h1>
        {bioStatus.available && bioStatus.enrolled && (
          <>
            <div
              className="biometric-quick-card"
              data-testid="biometric-quick-card"
            >
              <div className="biometric-quick-meta">
                <span className="biometric-quick-icon">
                  <Fingerprint size={19} />
                </span>
                <div className="biometric-quick-text">
                  <strong>{t("Quick biometric sign-in")}</strong>
                  <span dir="ltr">{bioStatus.email}</span>
                </div>
              </div>
              <button
                type="button"
                className="button full"
                data-testid="biometric-signin-btn"
                disabled={busy || bioBusy || googleBusy}
                onClick={handleBiometricSignIn}
              >
                <Fingerprint size={17} />
                {t(
                  bioBusy
                    ? "Verifying fingerprint or face…"
                    : "Sign in with Fingerprint / Face",
                )}
              </button>
              <div className="biometric-toggle-row">
                <div className="biometric-toggle-copy">
                  <strong>{t("Quick Sign-in")}</strong>
                  <small>
                    {t("Prompt fingerprint or face immediately on app launch")}
                  </small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bioStatus.quickSignInEnabled}
                  aria-label={t("Quick Sign-in")}
                  data-testid="biometric-quick-signin-toggle"
                  className="alabaster-switch"
                  disabled={busy || bioBusy || googleBusy}
                  onClick={() => {
                    const next = !bioStatus.quickSignInEnabled;
                    setQuickSignInPreference(next);
                    setBioStatus((prev) => ({
                      ...prev,
                      quickSignInEnabled: next,
                    }));
                  }}
                >
                  <span className="alabaster-switch-thumb" />
                </button>
              </div>
              <button
                type="button"
                className="biometric-clear-link"
                data-testid="biometric-clear-btn"
                disabled={busy || bioBusy || googleBusy}
                onClick={() => {
                  clearBiometricEnrollment();
                  setBioStatus(getBiometricStatus());
                  setFailure("");
                }}
              >
                {t("Remove saved biometric")}
              </button>
            </div>
            <div className="biometric-divider">
              <span>{t("Or sign in with email & password")}</span>
            </div>
          </>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const email = String(f.get("username") || "").trim();
            const password = String(f.get("password") || "");
            setBusy(true);
            setFailure("");
            try {
              const loggedIn = await client.login(email, password);
              if (
                bioStatus.available &&
                enableBiometric &&
                (isPreview ||
                  (panelSpec.allowedRoles as readonly string[]).includes(
                    loggedIn.user.role,
                  ))
              ) {
                try {
                  await enrollBiometric(email, password, {
                    title: t(panelSpec.loginTitle),
                    subtitle: t(
                      "Confirm your fingerprint or face to enable quick sign-in",
                    ),
                    cancelLabel: t("Cancel"),
                  });
                } catch {
                  // Never block a verified login if biometric confirmation fails
                }
              }
              onLogin(loggedIn);
            } catch (err) {
              setFailure((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="field">
            <div className="input-with-icon">
              <span className="input-icon-lead">
                <Mail size={17} />
              </span>
              <input
                id="staff-login-username"
                name="username"
                type="email"
                placeholder={t("Email")}
                autoComplete="username"
                defaultValue={bioStatus.enrolled ? bioStatus.email : ""}
                required
              />
            </div>
          </div>
          <div className="field">
            <div className="password-input-wrap">
              <span className="input-icon-lead">
                <Lock size={17} />
              </span>
              <input
                id={passwordId}
                name="password"
                placeholder={t("Password")}
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
                title={t(pwdProps.buttonLabel)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="login-util-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t("Remember me")}</span>
            </label>
            <button
              type="button"
              className="forgot-link-btn"
              onClick={() => setShowForgot((prev) => !prev)}
            >
              {t("Forgot password?")}
            </button>
          </div>

          {showForgot && (
            <div className="login-forgot-panel">
              <PasswordForm t={t} done={() => setShowForgot(false)} />
            </div>
          )}

          {bioStatus.available && !bioStatus.enrolled && (
            <label className="biometric-check-row">
              <input
                type="checkbox"
                data-testid="biometric-enroll-checkbox"
                checked={enableBiometric}
                onChange={(e) => setEnableBiometric(e.target.checked)}
              />
              <span>{t("Enable Fingerprint / Face unlock for faster sign-in")}</span>
            </label>
          )}
          <FormError message={t(failure || error)} />
          <button
            className={`button full ${bioStatus.available && bioStatus.enrolled ? "secondary" : ""}`}
            disabled={busy || bioBusy || googleBusy}
          >
            <span>{t(busy ? "Signing in…" : "Sign In")}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </main>
      <footer>Attaie Properties 2026 - Developed By Mohammad Roheen Ahmadi</footer>
    </div>
  );
}
