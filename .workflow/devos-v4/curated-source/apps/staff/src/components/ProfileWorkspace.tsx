import { Bell, BellRing, Download, LogOut, Smartphone } from "lucide-react";
import type { Session } from "../../../../packages/staff-contracts/types";
import { clearOfflineSnapshot } from "../../../../packages/staff-contracts/offline-cache.mjs";
import { type Translate, client, initials, panelSpec } from "../staffConfig";
import { StaffPhotoUpload } from "./StaffPhotoUpload";
import { BiometricSecurityCard, PasswordForm } from "./StaffAdminModals";

export function ProfileWorkspace({
  t,
  session,
  roleLabel,
  language,
  canInstallPwa,
  isPwaInstalled,
  promptInstall,
  isNotificationSupported,
  notificationPermission,
  isTestingNotification,
  requestNotificationPermission,
  sendTestNotification,
  setSession,
  setData,
  setOfflineSavedAt,
  setJustSignedOut,
  setNotice,
  setError,
}: {
  t: Translate;
  session: Session;
  roleLabel: string;
  language: "en" | "fa";
  canInstallPwa: boolean;
  isPwaInstalled: boolean;
  promptInstall: () => Promise<"installed" | "dismissed" | "ios" | "unavailable">;
  isNotificationSupported: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  isTestingNotification: boolean;
  requestNotificationPermission: () => Promise<NotificationPermission | "unsupported">;
  sendTestNotification: () => Promise<unknown>;
  setSession: (updater: Session | null | ((prev: Session | null) => Session | null)) => void;
  setData: (d: null) => void;
  setOfflineSavedAt: (s: string | null) => void;
  setJustSignedOut: (b: boolean) => void;
  setNotice: (s: string) => void;
  setError: (s: string) => void;
}) {
  return (
    <div className="profile-grid">
      <section className="panel profile-card">
        {session.user.photoUrl ? (
          <img
            src={session.user.photoUrl}
            alt={session.user.name}
            width={72}
            height={72}
            style={{
              objectFit: "cover",
              borderRadius: "9999px",
              border: "2px solid #E2E8F0",
            }}
          />
        ) : (
          <span className="avatar large gold">{initials(session.user.name)}</span>
        )}
        <h2>{session.user.name}</h2>
        <p>{t(roleLabel)}</p>
        <p>{t("All times in Kabul · UTC+04:30")}</p>
        <div style={{ width: "100%", marginTop: 12, textAlign: "start" }}>
          <StaffPhotoUpload
            label={t("Profile photo")}
            value={session.user.photoUrl || ""}
            purpose="user_avatar"
            lang={language}
            onUpload={client.upload}
            onChange={async (url) => {
              try {
                const res = await client.updateProfilePhoto(url);
                setSession((prev) => (prev ? { ...prev, user: res.user } : prev));
                setError("");
                setNotice(t("Profile photo updated."));
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          {session.user.photoUrl && (
            <button
              type="button"
              className="button secondary"
              style={{ marginTop: 8 }}
              onClick={async () => {
                try {
                  const res = await client.updateProfilePhoto("");
                  setSession((prev) =>
                    prev ? { ...prev, user: res.user } : prev,
                  );
                  setError("");
                  setNotice(t("Profile photo removed."));
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              {t("Remove photo")}
            </button>
          )}
        </div>
        <button
          className="button secondary"
          data-testid="profile-signout-btn"
          onClick={() =>
            client
              .logout()
              .then(() => {
                clearOfflineSnapshot(panelSpec.panelId);
                setOfflineSavedAt(null);
                setJustSignedOut(true);
                setSession(null);
                setData(null);
              })
              .catch((e) => setError(e.message))
          }
        >
          <LogOut size={16} />
          {t("Sign out")}
        </button>
      </section>
      <PasswordForm
        t={t}
        done={() => {
          clearOfflineSnapshot(panelSpec.panelId);
          setOfflineSavedAt(null);
          setJustSignedOut(true);
          setSession(null);
          setData(null);
        }}
      />
      {panelSpec.panelId === "sales" && canInstallPwa && !isPwaInstalled && (
        <section
          className="panel biometric-profile-card"
          data-testid="profile-install-app-card"
        >
          <div className="biometric-profile-head">
            <div className="biometric-profile-identity">
              <span className="biometric-quick-icon">
                <Smartphone size={20} />
              </span>
              <div>
                <h3>{t("Install Sales App on Phone")}</h3>
                <p>
                  {t(
                    "Add Attaie Sales to your home screen for quick launch and offline lead viewing.",
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="button"
              data-testid="profile-install-app-btn"
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
              <Download size={16} />
              {t("Install App")}
            </button>
          </div>
        </section>
      )}
      <BiometricSecurityCard
        t={t}
        session={session}
        onNotify={(m) => {
          setError("");
          setNotice(m);
        }}
        onError={(m) => setError(m)}
      />
      {isNotificationSupported && (
        <section
          className="panel biometric-profile-card"
          data-testid="profile-notification-card"
        >
          <div className="biometric-profile-head">
            <div className="biometric-profile-identity">
              <span className="biometric-quick-icon">
                {notificationPermission === "granted" ? (
                  <BellRing size={20} />
                ) : (
                  <Bell size={20} />
                )}
              </span>
              <div>
                <h3>{t("Mobile Lead Notifications (PWA)")}</h3>
                <p>
                  {notificationPermission === "granted"
                    ? t(
                        "Service worker device push alerts and vibration are active for new lead assignments.",
                      )
                    : notificationPermission === "default"
                      ? t(
                          "Turn on mobile push notifications to be alerted on your phone when new leads arrive.",
                        )
                      : t(
                          "Notifications are blocked in your browser. Reset permissions in browser settings.",
                        )}
                </p>
              </div>
            </div>
            {notificationPermission === "granted" ? (
              <button
                type="button"
                className="button secondary"
                disabled={isTestingNotification}
                onClick={() => void sendTestNotification()}
              >
                <BellRing size={15} />
                {isTestingNotification
                  ? t("Sending Alert...")
                  : t("Send Test Alert")}
              </button>
            ) : notificationPermission === "default" ? (
              <button
                type="button"
                className="button"
                onClick={() => void requestNotificationPermission()}
              >
                <Bell size={15} />
                {t("Enable Notifications")}
              </button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
