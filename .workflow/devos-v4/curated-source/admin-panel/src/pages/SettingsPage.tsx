import { useState, useEffect } from 'react';
import LandingBackgroundSettings from '../components/visual/LandingBackgroundSettings';
import LoginBackgroundSettings from '../components/visual/LoginBackgroundSettings';
import { V1, V1_STYLES, v1BadgeStyle } from '../components/variant1';
import { getAdminServerUrl, setAdminServerUrl, getApiBase } from '../api';

const S = {
  page: { maxWidth: 640 } as const,
  title: { ...V1_STYLES.title, marginBottom: '0.25rem' } as const,
  sub: { color: V1.slate, fontSize: '0.85rem', marginBottom: '1.5rem' } as const,
  card: {
    ...V1_STYLES.card,
    marginBottom: '1.25rem',
  } as const,
  section: { padding: '1.35rem 1.5rem' } as const,
  divider: { borderTop: `1px solid ${V1.slateSoft}` } as const,
  secHdr: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: V1.slate,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: '1rem',
  } as const,
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: V1.ink,
    marginBottom: '0.3rem',
  } as const,
  input: {
    width: '100%',
    padding: '0.58rem 0.8rem',
    border: `1px solid ${V1.borderSoft}`,
    borderRadius: 6,
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: V1.ink,
    background: V1.surface,
  } as const,
  row: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginTop: '1rem', alignItems: 'center' } as const,
  btnPrimary: V1_STYLES.primaryBtn,
  btnSecondary: V1_STYLES.secondaryBtn,
  badge: (ok: boolean | null): React.CSSProperties =>
    v1BadgeStyle(ok === null ? 'slate' : ok ? 'green' : 'danger'),
  verRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: `1px solid ${V1.slateSoft}`,
    fontVariantNumeric: 'tabular-nums',
  } as const,
  verKey: { fontSize: '0.875rem', color: V1.ink, fontWeight: 500 } as const,
  verVal: { fontSize: '0.875rem', color: V1.slate, fontVariantNumeric: 'tabular-nums' } as const,
};

export default function SettingsPage() {
  const electron = window.electronAPI;

  const [apiUrl, setApiUrl] = useState(() => {
    const saved = localStorage.getItem('attaie_admin_server_url');
    if (saved) return saved;
    const base = getApiBase();
    if (/^https?:\/\//i.test(base)) return base;
    return getAdminServerUrl();
  });
  const [testing, setTesting] = useState(false);
  const [connStatus, setConnStatus] = useState<boolean | null>(null);
  const [version, setVersion] = useState('—');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!electron) return;
    electron.getVersion().then(setVersion);
  }, [electron]);

  const testConnection = async () => {
    setTesting(true);
    setConnStatus(null);
    setSaveError(null);
    try {
      const base = apiUrl.trim().replace(/\/api\/?$/i, '').replace(/\/+$/, '');
      const testUrl = base.startsWith('http') ? `${base}/api/admin/properties.php` : `${base}/admin/properties.php`;
      const res = await fetch(testUrl, {
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      });
      setConnStatus(res.ok || res.status === 401);
    } catch {
      setConnStatus(false);
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = () => {
    setSaveError(null);
    try {
      const cleaned = setAdminServerUrl(apiUrl);
      setApiUrl(cleaned);
      setSaved(true);
      electron?.notify('Settings', 'Settings saved successfully.');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Settings</h1>
      <p style={S.sub}>Backend connection and application info</p>

      {/* Backend Connection Card */}
      <div style={S.card}>
        <div style={S.section}>
          <p style={S.secHdr}>Backend Connection</p>

          <label style={S.label}>API Base URL</label>
          <input
            style={S.input}
            value={apiUrl}
            onChange={e => {
              setApiUrl(e.target.value);
              setConnStatus(null);
            }}
            placeholder="https://your-server.com/api"
            spellCheck={false}
          />
          <p style={{ fontSize: '0.75rem', color: V1.slate, marginTop: '0.4rem' }}>
            This is baked at build time via <code>VITE_API_URL</code>. Shown here for reference.
          </p>

          <div style={S.row}>
            <button style={S.btnPrimary} onClick={testConnection} disabled={testing}>
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            <button style={S.btnSecondary} onClick={saveSettings}>
              {saved ? '✓ Saved' : 'Save URL'}
            </button>
            {connStatus !== null && (
              <span style={S.badge(connStatus)}>
                {connStatus ? '✓ Reachable' : '✕ Unreachable'}
              </span>
            )}
          </div>
          {saveError && (
            <p style={{ color: V1.danger, fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
              {saveError}
            </p>
          )}
        </div>
      </div>

      {/* Landing Page Hero Background Settings */}
      <LandingBackgroundSettings />

      {/* Application Info Card */}
      <div style={S.card}>
        <div style={S.section}>
          <LoginBackgroundSettings />
        </div>
      </div>

      <div style={S.card}>
        <div style={S.section}>
          <p style={S.secHdr}>Application Info</p>

          {[
            ['Version', version],
            ['Platform', electron?.platform ?? 'web'],
            ['Mode', import.meta.env.MODE],
          ].map(([k, v]) => (
            <div key={k} style={S.verRow}>
              <span style={S.verKey}>{k}</span>
              <span style={S.verVal}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ ...S.section, ...S.divider }}>
          <div style={S.row}>
            <button style={S.btnPrimary} onClick={saveSettings}>
              {saved ? '✓ Saved' : 'Save Settings'}
            </button>
            <button
              style={S.btnSecondary}
              onClick={() =>
                electron
                  ? electron.openExternal('https://www.attaieproperties.com')
                  : window.open('https://www.attaieproperties.com', '_blank')
              }
            >
              Open Website
            </button>
          </div>
          {saveError && (
            <p style={{ color: V1.danger, fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
              {saveError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
