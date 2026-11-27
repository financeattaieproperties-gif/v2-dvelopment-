import React, { useState, useEffect } from 'react';
import { visualConfigApi } from '../../visualConfigApi';
import ImageUpload from '../ImageUpload';

const LOGIN_ROLES: { id: string; label: string; route: string }[] = [
  { id: 'admin', label: 'Website Admin', route: '/admin' },
  { id: 'callcenter', label: 'Call Center', route: '/callcenter' },
  { id: 'sales', label: 'Sales Agent (Web & Android/iOS)', route: '/sales' },
  { id: 'sales-leader', label: 'Sales Leader', route: '/sales-leader' },
  { id: 'management', label: 'Branch Management & HR', route: '/management' },
  { id: 'finance', label: 'Finance', route: '/finance' },
  { id: 'marketing', label: 'Marketing', route: '/marketing' },
  { id: 'engineering', label: 'Engineering', route: '/engineering' },
  { id: 'ceo', label: 'CEO', route: '/ceo' },
];

export const LoginBackgroundSettings: React.FC = () => {
  const [backgrounds, setBackgrounds] = useState<Record<string, string | null>>({});
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    visualConfigApi
      .getConfig()
      .then((cfg) => {
        if (cfg.loginBackgrounds) {
          setBackgrounds(cfg.loginBackgrounds);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const currentUrl = backgrounds[selectedRole] || '';

  const handleSave = async (nextMap: Record<string, string | null> = backgrounds) => {
    setSaving(true);
    try {
      await visualConfigApi.updateLoginBackgrounds(nextMap);
      showToast(true, 'Login background updated and published.');
    } catch (err) {
      showToast(false, (err as Error).message || 'Failed to save login background.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const next = { ...backgrounds, [selectedRole]: null };
    setBackgrounds(next);
    await handleSave(next);
  };

  if (loading) {
    return <p style={{ fontSize: '0.85rem', color: '#818285' }}>Loading login background settings…</p>;
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '1.5rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>
          Role Login Page Backgrounds
        </h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#818285' }}>
          Upload a custom background image for each department's login screen.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.1rem' }}>
        {LOGIN_ROLES.map((role) => {
          const active = role.id === selectedRole;
          const hasImg = Boolean(backgrounds[role.id]);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              style={{
                padding: '6px 11px',
                borderRadius: 7,
                border: active ? '1px solid #0072BC' : '1px solid #E2E8F0',
                background: active ? '#E6F2FA' : '#FFFFFF',
                color: active ? '#0072BC' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{role.label}</span>
              {hasImg && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#14A850',
                    display: 'inline-block',
                  }}
                  title="Custom background set"
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
        Background Image for {LOGIN_ROLES.find((r) => r.id === selectedRole)?.label ?? selectedRole}
      </div>
      <ImageUpload
        value={currentUrl || null}
        onChange={(url) => setBackgrounds((prev) => ({ ...prev, [selectedRole]: url || null }))}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave()}
          style={{
            padding: '0.55rem 1.15rem',
            background: '#0072BC',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 7,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.84rem',
          }}
        >
          {saving ? 'Saving…' : 'Save & Publish'}
        </button>
        {currentUrl && (
          <button
            type="button"
            disabled={saving}
            onClick={handleClear}
            style={{
              padding: '0.55rem 1rem',
              background: '#FFFFFF',
              color: '#818285',
              border: '1px solid #E2E8F0',
              borderRadius: 7,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.84rem',
            }}
          >
            Reset to Default
          </button>
        )}
        {toast && (
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: toast.ok ? '#14A850' : '#B91C1C',
              background: toast.ok ? '#E8F7EE' : '#FEF2F2',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            {toast.msg}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoginBackgroundSettings;
