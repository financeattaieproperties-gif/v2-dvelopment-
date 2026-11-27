import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Branch } from '../api';
import { V1, V1_STYLES } from '../components/variant1';

const S = {
  action: {
    ...V1_STYLES.primaryBtn,
    padding: '0.32rem 0.72rem',
    fontSize: '0.78rem',
    marginRight: 6,
  },
};

export default function Branches() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => api.getBranches().then(setItems).catch(e => setError(e.message || 'Could not load branches.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const remove = async (branch: Branch) => {
    if (!confirm(`Delete the ${branch.name} branch?`)) return;
    try { await api.deleteBranch(branch.id); setItems(current => current.filter(x => x.id !== branch.id)); }
    catch (e) { setError((e as Error).message || 'Delete failed.'); }
  };
  if (loading) return <p style={{ color: V1.slate }}>Loading branches…</p>;
  return <div>
    <div style={V1_STYLES.header}>
      <h1 style={V1_STYLES.title}>Branches ({items.length})</h1>
      <button style={V1_STYLES.primaryBtn} onClick={() => navigate('/branches/new')}>+ Add Branch</button>
    </div>
    {error && <p role="alert" style={{ color: V1.danger, background: V1.dangerSoft, border: `1px solid ${V1.dangerBorder}`, padding: '0.75rem', borderRadius: 8 }}>{error}<button onClick={() => { setError(''); setLoading(true); load(); }} style={{ ...V1_STYLES.secondaryBtn, marginLeft: 12, padding: '0.25rem 0.65rem', fontSize: '0.76rem' }}>Retry</button></p>}
    <div style={{ ...V1_STYLES.card, overflowX: 'auto' }}><table style={V1_STYLES.table}><thead><tr>{['Branch', 'Address', 'Phone', 'Email', 'Actions'].map(x => <th key={x} style={V1_STYLES.th}>{x}</th>)}</tr></thead><tbody>
      {items.map(branch => <tr key={branch.id}><td style={V1_STYLES.td}><strong style={{ color: V1.ink }}>{branch.name}</strong></td><td style={V1_STYLES.td}>{branch.address}</td><td style={V1_STYLES.td}>{branch.phone || '—'}</td><td style={V1_STYLES.td}>{branch.email || '—'}</td><td style={V1_STYLES.td}><button onClick={() => navigate(`/branches/${branch.id}/edit`)} style={S.action}>Edit</button><button onClick={() => remove(branch)} style={V1_STYLES.dangerBtn}>Delete</button></td></tr>)}
      {items.length === 0 && <tr><td colSpan={5} style={{ ...V1_STYLES.td, textAlign: 'center', padding: '2.5rem', color: V1.slate }}>No branches yet. Add your first branch to show it on the About page.</td></tr>}
    </tbody></table></div>
  </div>;
}
