import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api, naira } from './api.js';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const CHECK = { on_track: ['On track', ''], shortfall: ['Shortfall', ' warn'], excess: ['Excess', ' go'] };

export default function Reports({ branch, onGo }) {
  const [date, setDate] = useState(today());
  const [r, setR] = useState(null);
  const [locked, setLocked] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setR(null); setLocked(null); setError('');
    api(`/api/manage/reports/sales?branch_id=${branch.id}&date=${date}`)
      .then(setR)
      .catch((e) => {
        if (e.status === 403 && /inventory/i.test(e.message)) setLocked(e.message);
        else setError(e.message);
      });
  }, [branch.id, date]);

  return (
    <div>
      <div className="eyebrow">{branch.name.replace('Jekaplay ', '')} report</div>
      <h1 className="h1">Sales <b>report</b></h1>
      <label>Day</label>
      <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
      {error && <div className="err">{error}</div>}
      {locked && (
        <div className="card center">
          <Lock size={22} /><br />
          <b style={{ color: 'var(--tx)' }}>Report not open yet</b>
          <p>The day’s inventory must be completely filled in first.</p>
          <button className="btn" onClick={() => onGo('stock')}>Go to inventory</button>
        </div>
      )}
      {!r && !error && !locked && <div className="center">Loading…</div>}
      {r && (<>
        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="card" style={{ margin: 0 }}><div className="mu">Orders</div><div className="big">{r.totals.orders}</div></div>
          <div className="card" style={{ margin: 0 }}><div className="mu">Sales</div><div className="big">{naira(r.totals.revenue_kobo)}</div></div>
        </div>

        <h2 className="group">Ingredient check</h2>
        {r.ingredient_check.length === 0 && <div className="card mu">No inventory entered for this day.</div>}
        {r.ingredient_check.map((c) => (
          <div className="card" key={c.name}>
            <div className="row"><b>{c.name}</b><span className={'badge' + CHECK[c.status][1]}>{CHECK[c.status][0]}{c.status === 'on_track' ? '' : ' ' + Math.abs(c.difference_pct) + '%'}</span></div>
            <div className="row"><span className="mu">Kitchen used</span><b>{Number(c.used)} {c.unit}</b></div>
            <div className="row"><span className="mu">Sales account for</span><b>{Number(c.accounted_for_by_sales)} {c.unit}</b></div>
          </div>
        ))}
        <p className="mu small">A shortfall means more was used than the day’s sales explain. An excess means sales explain more than was recorded as used.</p>

        <h2 className="group">Sales by staff</h2>
        <div className="card">
          {r.by_staff.length === 0 && <span className="mu">No sales.</span>}
          {r.by_staff.map((s) => <div className="row" key={s.staff}><span>{s.staff} <span className="mu">· {s.orders} orders</span></span><b>{naira(s.revenue_kobo)}</b></div>)}
        </div>

        <h2 className="group">Items sold</h2>
        <div className="card">
          {r.items_sold.length === 0 && <span className="mu">No sales.</span>}
          {r.items_sold.map((i) => <div className="row" key={i.name}><span>{i.quantity}× {i.name}</span><b>{naira(i.revenue_kobo)}</b></div>)}
        </div>
      </>)}
    </div>
  );
}
