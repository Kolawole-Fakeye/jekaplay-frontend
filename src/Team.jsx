import { useEffect, useState } from 'react';
import { UserPlus, KeyRound, MapPin, Power, X } from 'lucide-react';
import { api } from './api.js';

const ROLE = { admin: 'Admin', supervisor: 'Supervisor', staff: 'Staff' };

function makePin() {
  for (;;) {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const p = String(n).padStart(6, '0');
    const d = p.split('').map(Number);
    const run = d.every((x, i) => i === 0 || x - d[i - 1] === 1) || d.every((x, i) => i === 0 || d[i - 1] - x === 1);
    if (!/^(\d)\1+$/.test(p) && !run && !['123123', '112233', '121212'].includes(p)) return p;
  }
}

export default function Team({ me }) {
  const [staff, setStaff] = useState(null);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(null); // {kind:'add'} | {kind:'move', s} | {kind:'reset', s} | {kind:'off', s}
  const [pin, setPin] = useState(null); // {name, pin}
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: 'staff', branch: '', pin: makePin() });
  const [moveTo, setMoveTo] = useState('');
  const roles = me.role === 'owner' ? ['staff', 'supervisor', 'admin'] : ['staff'];

  async function load() {
    try {
      const [s, b] = await Promise.all([api('/api/admin/staff'), api('/api/admin/branches')]);
      setStaff(s.staff); setBranches(b.branches);
      setForm((f) => ({ ...f, branch: f.branch || b.branches[0]?.id || '' }));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function run(fn) {
    setBusy(true); setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const add = () => run(async () => {
    const d = await api('/api/admin/staff', { method: 'POST', body: { full_name: form.name, phone: form.phone, role: form.role, branch_id: form.branch, temp_pin: form.pin } });
    setPin({ name: d.staff.full_name, pin: form.pin, phone: d.staff.phone });
    setSheet(null);
    setForm({ name: '', phone: '', role: 'staff', branch: form.branch, pin: makePin() });
  });
  const move = () => run(async () => {
    await api(`/api/admin/staff/${sheet.s.id}/assign`, { method: 'POST', body: { branch_id: moveTo } });
    setSheet(null);
  });
  const reset = () => run(async () => {
    const t = makePin();
    await api(`/api/admin/staff/${sheet.s.id}/reset-pin`, { method: 'POST', body: { temp_pin: t } });
    setPin({ name: sheet.s.full_name, pin: t });
    setSheet(null);
  });
  const toggle = () => run(async () => {
    await api(`/api/admin/staff/${sheet.s.id}/${sheet.s.is_active ? 'deactivate' : 'reactivate'}`, { method: 'POST' });
    setSheet(null);
  });

  return (
    <div>
      <div className="eyebrow">Your team</div>
      <h1 className="h1">Staff &amp; <b>outlets</b></h1>
      <p className="sub">Add people, place them at an outlet, and move them when needed. Everything they do stays on their record.</p>
      <button className="btn" onClick={() => { setError(''); setSheet({ kind: 'add' }); }}><UserPlus size={18} /> Add a staff member</button>
      {error && !sheet && <div className="err">{error}</div>}
      {!staff && !error && <div className="center">Loading…</div>}
      {staff && staff.length === 0 && <div className="card center">No staff yet. Add your first team member.</div>}
      {staff && staff.map((s) => (
        <div className={'card' + (s.is_active ? '' : ' off')} key={s.id}>
          <div className="row">
            <b>{s.full_name}</b>
            <span className="row" style={{ gap: 6, padding: 0 }}>
              <span className="badge go">{ROLE[s.role] || s.role}</span>
              {!s.is_active && <span className="badge">Inactive</span>}
              {s.must_change_pin && s.is_active && <span className="badge warn">New PIN pending</span>}
            </span>
          </div>
          <div className="mu">{s.phone}</div>
          <div className="mu"><MapPin size={13} style={{ verticalAlign: -2 }} /> {s.branch_name ? s.branch_name.replace('Jekaplay ', '') : 'Not placed at an outlet'}</div>
          <div className="actions">
            {s.is_active && <button className="pill" onClick={() => { setError(''); setMoveTo(s.branch_id || branches[0]?.id || ''); setSheet({ kind: 'move', s }); }}>{s.branch_id ? 'Move' : 'Place'}</button>}
            {s.is_active && <button className="pill" onClick={() => { setError(''); setSheet({ kind: 'reset', s }); }}><KeyRound size={13} style={{ verticalAlign: -2 }} /> Reset PIN</button>}
            <button className="pill" onClick={() => { setError(''); setSheet({ kind: 'off', s }); }}><Power size={13} style={{ verticalAlign: -2 }} /> {s.is_active ? 'Deactivate' : 'Reactivate'}</button>
          </div>
        </div>
      ))}

      {sheet && (
        <div className="scrim" onClick={() => setSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>{{ add: 'Add staff', move: 'Place at an outlet', reset: 'Reset PIN?', off: sheet.s?.is_active ? 'Deactivate?' : 'Reactivate?' }[sheet.kind]}</h2><button className="icon" onClick={() => setSheet(null)}><X size={18} /></button></div>
            {sheet.kind === 'add' && (<>
              <label>Full name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Amaka Okafor" />
              <label>WhatsApp number</label>
              <input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0801 234 5678" />
              <label>Role</label>
              <div className="seg">{roles.map((r) => <button key={r} className={form.role === r ? 'on' : ''} onClick={() => setForm({ ...form, role: r })}>{ROLE[r]}</button>)}</div>
              <label>Outlet</label>
              <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name.replace('Jekaplay ', '')}</option>)}</select>
              <label>Temporary PIN (they choose their own at first login)</label>
              <div className="row"><span className="bigpin small">{form.pin}</span><button className="pill" onClick={() => setForm({ ...form, pin: makePin() })}>New code</button></div>
              {error && <div className="err">{error}</div>}
              <button className="btn" disabled={busy || !form.name.trim() || !form.phone.trim()} onClick={add}>{busy ? 'Saving…' : 'Create account'}</button>
            </>)}
            {sheet.kind === 'move' && (<>
              <p><b>{sheet.s.full_name}</b> will work at the outlet you choose. Their past records stay as they are.</p>
              <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name.replace('Jekaplay ', '')}</option>)}</select>
              {error && <div className="err">{error}</div>}
              <button className="btn" disabled={busy} onClick={move}>{busy ? 'Saving…' : 'Confirm'}</button>
            </>)}
            {sheet.kind === 'reset' && (<>
              <p>This gives <b>{sheet.s.full_name}</b> a new temporary PIN and signs them out. They choose their own at next login.</p>
              {error && <div className="err">{error}</div>}
              <button className="btn" disabled={busy} onClick={reset}>{busy ? 'Resetting…' : 'Yes, reset it'}</button>
            </>)}
            {sheet.kind === 'off' && (<>
              <p>{sheet.s.is_active ? <><b>{sheet.s.full_name}</b> will be signed out and can no longer log in. Their records are kept.</> : <><b>{sheet.s.full_name}</b> will be able to log in again once you place them at an outlet.</>}</p>
              {error && <div className="err">{error}</div>}
              <button className={'btn' + (sheet.s.is_active ? ' danger' : '')} disabled={busy} onClick={toggle}>{busy ? 'Saving…' : sheet.s.is_active ? 'Yes, deactivate' : 'Yes, reactivate'}</button>
            </>)}
          </div>
        </div>
      )}

      {pin && (
        <div className="scrim" onClick={() => setPin(null)}>
          <div className="sheet center-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Temporary PIN for {pin.name}</h2>
            <div className="bigpin">{pin.pin}</div>
            <p className="mu">Give this to {pin.name.split(' ')[0]} now. It is shown only once, and they will be asked to choose their own 6-digit PIN when they first log in{pin.phone ? ' with ' + pin.phone : ''}.</p>
            <button className="btn" onClick={() => setPin(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
