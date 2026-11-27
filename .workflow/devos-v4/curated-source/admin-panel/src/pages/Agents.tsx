import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Agent } from '../api';
import { V1, V1_STYLES, v1BadgeStyle } from '../components/variant1';

const S = {
  action: {
    ...V1_STYLES.primaryBtn,
    padding: '0.32rem 0.75rem',
    marginRight: 6,
    fontSize: '0.78rem',
  },
};

export default function Agents() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => api.getAgents().then(setItems).catch(e => setError(e.message || 'Could not load agents.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (agent: Agent) => {
    if (!confirm(`Delete ${agent.name}'s profile?`)) return;
    try { await api.deleteAgent(agent.id); setItems(current => current.filter(x => x.id !== agent.id)); }
    catch (e) { setError((e as Error).message || 'Delete failed.'); }
  };

  if (loading) return <p style={{ color: V1.slate }}>Loading agents…</p>;
  return <div>
    <div style={V1_STYLES.header}>
      <h1 style={V1_STYLES.title}>Agents & Employees ({items.length})</h1>
      <button style={V1_STYLES.primaryBtn} onClick={() => navigate('/agents/new')}>+ Add Agent</button>
    </div>
    {error && <p role="alert" style={{ color: V1.danger, background: V1.dangerSoft, border: `1px solid ${V1.dangerBorder}`, padding: '0.75rem', borderRadius: 8 }}>{error}<button onClick={() => { setError(''); setLoading(true); load(); }} style={{ ...V1_STYLES.secondaryBtn, marginLeft: 12, padding: '0.25rem 0.65rem', fontSize: '0.76rem' }}>Retry</button></p>}
    <div style={{ ...V1_STYLES.card, overflowX: 'auto' }}><table style={V1_STYLES.table}><thead><tr>{['Portrait', 'Name', 'Role', 'Contact', 'Visibility', 'Actions'].map(x => <th key={x} style={V1_STYLES.th}>{x}</th>)}</tr></thead>
      <tbody>{items.map(agent => <tr key={agent.id}>
        <td style={V1_STYLES.td}>{agent.portrait_url ? <img src={agent.portrait_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', border: `1px solid ${V1.border}` }} /> : '—'}</td>
        <td style={{ ...V1_STYLES.td, fontWeight: 600 }}>{agent.name}</td><td style={V1_STYLES.td}>{agent.role}</td><td style={V1_STYLES.td}>{agent.phone}<br /><span style={{ color: V1.slate, fontSize: '0.8rem' }}>{agent.email}</span></td>
        <td style={V1_STYLES.td}><span style={v1BadgeStyle(agent.published ? 'green' : 'slate')}>{agent.published ? 'Published' : 'Draft'}</span></td>
        <td style={V1_STYLES.td}><button style={S.action} onClick={() => navigate(`/agents/${agent.id}/edit`)}>Edit</button><button style={V1_STYLES.dangerBtn} onClick={() => remove(agent)}>Delete</button></td>
      </tr>)}{items.length === 0 && <tr><td colSpan={6} style={{ ...V1_STYLES.td, textAlign: 'center', padding: '2.5rem', color: V1.slate }}>No profiles yet. Add an agent or employee to get started.</td></tr>}</tbody>
    </table></div>
  </div>;
}
