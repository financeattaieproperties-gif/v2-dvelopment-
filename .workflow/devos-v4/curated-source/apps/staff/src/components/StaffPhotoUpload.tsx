import React, { useId, useState, useEffect } from 'react';
import { LoaderLiquidProgress } from './ui/loaders-liquid-progress';

export type UploadStaffFile = (dataURL: string, fileName: string, purpose: string) => Promise<{url: string; fileName?: string}>;
export function StaffPhotoUpload({ label, value, purpose, onChange, onUpload, lang = 'en' }: {
  label: string; value: string; purpose: string; onChange: (url: string) => void;
  onUpload?: UploadStaffFile; lang?: 'en' | 'fa';
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    let timer: any;
    if (busy) {
      setUploadProgress(15);
      timer = setInterval(() => {
        setUploadProgress((p) => (p >= 90 ? p : p + Math.floor(Math.random() * 12) + 5));
      }, 350);
    } else {
      setUploadProgress(0);
    }
    return () => clearInterval(timer);
  }, [busy]);

  return <div className="field">
    <label htmlFor={id}>{label}</label>
    {value && <img src={value} alt={label} width={72} height={96} style={{objectFit: 'cover',borderRadius: 6}} />}
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={!onUpload || busy}
      aria-describedby={error ? `${id}-error` : undefined} onChange={async e => {
        const file = e.currentTarget.files?.[0];
        if (!file || !onUpload) return;
        setError('');
        if (file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) {
          setError(lang === 'fa' ? 'عکس JPG، PNG یا WebP تا ۵ مگابایت انتخاب کنید.' : 'Choose a JPG, PNG or WebP image up to 5 MB.'); return;
        }
        setBusy(true);
        try { const data = await new Promise<string>((resolve,reject) => {
          const reader = new FileReader(); reader.onerror = () => reject(new Error('Image could not be read.'));
          reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file);
        });
        const uploaded = await onUpload(data, file.name, purpose);
        setUploadProgress(100);
        onChange(uploaded.url);
        } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
      }} />
    {busy && (
      <div style={{ marginTop: 8, width: '100%', maxWidth: 320 }}>
        <LoaderLiquidProgress
          progress={uploadProgress}
          height={10}
          showValue={true}
          statusText={lang === 'fa' ? 'در حال آپلود عکس…' : 'Uploading photo…'}
          colorScheme="emerald"
        />
      </div>
    )}
    {error && <small id={`${id}-error`} role="alert">{error}</small>}
  </div>;
}
