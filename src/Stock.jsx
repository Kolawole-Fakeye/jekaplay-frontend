import { useEffect, useState } from 'react';
import { PackagePlus, X, Check } from 'lucide-react';
import { api } from './api.js';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const txt = (v) => (v === null || v === undefined ? '' : String(Number(v)));
const STATUS = { submitted: 'Waiting for supervisor', confirmed: 'Confirmed', disputed: 'Disputed' };

export default function Stock({ branch, role, onToast }) {
  const canEnter = ['owner', 'admin'].includes(role);
  const canReview = ['owner', 'supervisor'].includes(role);
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [vals, setVals] = useState({});
  const [busy, setBusy] = useState(false);
  const [dispute, setDispute] = useState(null);
  const [note, setNote] = useState('');
  const [restock, setRestock] = useState(null);
  const [qty, setQty] = useState('');
  const [rnote, setRnote] = useState('');
  const [sheetError, setSheetError] = useState('');

  async function load() {
    try {
      const d = await api(`/api/manage/inventory/day?branch_id=${branch.id}&date=${date}`);
      setData(d);
      setVals(Object.fromEntries(d.ingredients.map((i) => [i.ingredient_id, txt(i.entered_qty)])));
      setError('');
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { setData(null); load(); }, [branch.id, date]);

  const locked = (i) => i.status === 'confirmed' && role !== 'owner';

  async function save() {
    const entries = data.ingredients
      .filter((i) => !locked(i) && vals[i.ingredient_id] !== '' && Number(vals[i.ingredient_id]) !== Number(i.entered_qty ?? NaN))
      .map((i) => ({ ingredient_id: i.ingredient_id, quantity: Number(vals[i.ingredient_id]) }));
    if (entries.length === 0) return onToast('Nothing new to save');
    if (entries.some((e) => !Number.isFinite(e.quantity) || e.quantity < 0)) return onToast('Check the quantities');
    setBusy(true);
    try {
      await api('/api/manage/inventory/day', { method: 'PUT', body: { branch_id: branch.id, date, entries } });
      onToast('Inventory saved');
      await load();
    } catch (e) { onToast(e.message); } finally { setBusy(false); }
  }

  async function review(action, ingredient_id, n) {
    setBusy(true);
    try {
      await api('/api/manage/inventory/day/review', { method: 'POST', body: { branch_id: branch.id, date, action, ingredient_id, note: n } });
      onToast(action === 'confirm' ? 'Confirmed' : 'Dispute sent');
      setDispute(null); setNote('');
      await load();
    } catch (e) { onToast(e.message); } finally { setBusy(false); }
  }

  async function doRestock() {
    setSheetError('');
    try {
      await api('/api/manage/inventory/restock', { method: 'POST', body: { branch_id: branch.id, ingredient_id: restock.ingredient_id, quantity: Number(qty), note: rnote || null } });
      onToast(restock.name + ' restocked');
      setRestock(null); setQty(''); setRnote('');
      await load();
    } catch (e) { setSheetError(e.message); }
  }

  const s = data?.summary;
  return (
    <div>
      <div className="eyebrow">{branch.name.replace('Jekaplay ', '')} stock</div>
      <h1 className="h1">Daily <b>inventory</b></h1>
      <p className="sub">Enter what the kitchen used for the day. A supervisor then confirms it, and that unlocks the sales report.</p>
      <label>Day</label>
      <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
      {error && <div className="err">{error}</div>}
      {!data && !error && <div className="center">Loading…</div>}
      {data && (<>
        <div className="card">
          <div className="row"><b>{s.filled} of {s.total} entered</b><span className={'badge' + (s.complete ? ' go' : '')}>{s.complete ? 'Complete' : 'Incomplete'}</span></div>
          <div className="bar"><i style={{ width: (s.total ? (s.filled / s.total) * 100 : 0) + '%' }} /></div>
          <div className="mu" style={{ marginTop: 8 }}>{s.confirmed} confirmed · {s.disputed} disputed</div>
        </div>

        {data.ingredients.map((i) => (
          <div className={'card' + (i.status === 'disputed' ? ' late' : '')} key={i.ingredient_id}>
            <div className="row">
              <b>{i.name}</b>
              <span className={'badge' + (i.status === 'confirmed' ? ' go' : i.status === 'disputed' ? ' warn' : '')}>{i.status ? STATUS[i.status] : 'Not entered'}</span>
            </div>
            {canEnter && !locked(i) ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" inputMode="decimal" min="0" step="any" placeholder={'Used today (' + i.unit + ')'} value={vals[i.ingredient_id] ?? ''} onChange={(e) => setVals({ ...vals, [i.ingredient_id]: e.target.value })} />
                <span className="mu">{i.unit}</span>
              </div>
            ) : (
              <div className="mu">Used: <b style={{ color: 'var(--tx)' }}>{i.entered_qty === null ? '—' : txt(i.entered_qty) + ' ' + i.unit}</b></div>
            )}
            {i.status === 'disputed' && i.review_note && <div className="note">“{i.review_note}”</div>}
            {canReview && i.entered_qty !== null && i.status !== 'confirmed' && (
              <div className="seg" style={{ marginTop: 10 }}>
                <button disabled={busy} onClick={() => review('confirm', i.ingredient_id)}><Check size={14} style={{ verticalAlign: -2 }} /> Confirm</button>
                <button disabled={busy} onClick={() => { setDispute(i); setNote(''); }}>Dispute</button>
              </div>
            )}
          </div>
        ))}

        {canEnter && <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save inventory'}</button>}
        {canReview && s.filled > 0 && s.confirmed < s.total && (
          <button className="btn ghost" style={{ marginTop: 10 }} disabled={busy} onClick={() => review('confirm')}>Confirm everything entered</button>
        )}

        <h2 className="group">Stock levels now</h2>
        {data.ingredients.map((i) => {
          const q = Number(i.stock), r = Number(i.reorder_level), low = q <= r;
          return (
            <div className="card" key={'s' + i.ingredient_id}>
              <div className="row"><b>{i.name}</b><span className={'badge' + (low ? ' warn' : ' go')}>{low ? 'Restock now' : 'OK'}</span></div>
              <div className="row"><span className="big">{q} <span className="mu">{i.unit}</span></span><span className="mu">reorder at {r}</span></div>
              <div className="bar"><i className={low ? 'low' : ''} style={{ width: Math.min(100, (q / Math.max(r * 3, 1)) * 100) + '%' }} /></div>
              {canEnter && <button className="pill" style={{ marginTop: 10 }} onClick={() => { setRestock(i); setSheetError(''); }}><PackagePlus size={14} style={{ verticalAlign: -2 }} /> Restock</button>}
            </div>
          );
        })}
      </>)}

      {dispute && (
        <div className="scrim" onClick={() => setDispute(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Dispute {dispute.name}</h2><button className="icon" onClick={() => setDispute(null)}><X size={18} /></button></div>
            <label>What looks wrong?</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. rice count looks too low" />
            <button className="btn" disabled={busy || note.trim().length < 3} onClick={() => review('dispute', dispute.ingredient_id, note)}>Send dispute</button>
          </div>
        </div>
      )}
      {restock && (
        <div className="scrim" onClick={() => setRestock(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Restock {restock.name}</h2><button className="icon" onClick={() => setRestock(null)}><X size={18} /></button></div>
            <label>How much came in ({restock.unit})?</label>
            <input type="number" inputMode="decimal" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
            <label>Note (optional)</label>
            <input value={rnote} onChange={(e) => setRnote(e.target.value)} placeholder="e.g. delivery from market" />
            {sheetError && <div className="err">{sheetError}</div>}
            <button className="btn" disabled={!(Number(qty) > 0)} onClick={doRestock}>Add to stock</button>
          </div>
        </div>
      )}
    </div>
  );
}
