import { useEffect, useState } from 'react';
import { Search, KeyRound, X } from 'lucide-react';
import { api } from './api.js';

export default function StaffCustomers() {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [temp, setTemp] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) return setList([]);
    const t = setTimeout(() => {
      api('/api/customers/search?q=' + encodeURIComponent(q.trim())).then((d) => setList(d.customers)).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function reset() {
    setBusy(true); setError('');
    try {
      const d = await api(`/api/customers/${target.id}/reset-pin`, { method: 'POST' });
      setTemp({ name: target.full_name, pin: d.temp_pin });
      setTarget(null);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="eyebrow">Customers</div>
      <h1 className="h1">Help a <b>customer</b></h1>
      <p className="sub">Find them by name or WhatsApp number. Confirm it is really them before you reset a PIN.</p>
      <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 14, top: 17, color: 'var(--mu)' }} /><input style={{ paddingLeft: 38 }} placeholder="Search name or number" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {error && <div className="err">{error}</div>}
      {list.map((c) => (
        <div className="card row" key={c.id}>
          <span><b>{c.full_name}</b><div className="mu">{c.phone}</div></span>
          <button className="pill" onClick={() => setTarget(c)}><KeyRound size={14} style={{ verticalAlign: -2 }} /> Reset PIN</button>
        </div>
      ))}
      {q.trim().length >= 2 && list.length === 0 && <div className="card center">No customer found.</div>}

      {target && (
        <div className="scrim" onClick={() => setTarget(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Reset PIN?</h2><button className="icon" onClick={() => setTarget(null)}><X size={18} /></button></div>
            <p>This gives <b>{target.full_name}</b> a temporary PIN. They will choose a new one when they next log in.</p>
            <button className="btn" disabled={busy} onClick={reset}>{busy ? 'Resetting…' : 'Yes, reset it'}</button>
          </div>
        </div>
      )}
      {temp && (
        <div className="scrim" onClick={() => setTemp(null)}>
          <div className="sheet center-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Temporary PIN for {temp.name}</h2>
            <div className="bigpin">{temp.pin}</div>
            <p className="mu">Tell the customer now. It is shown only once. They will be asked to pick their own 4-digit PIN.</p>
            <button className="btn" onClick={() => setTemp(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
