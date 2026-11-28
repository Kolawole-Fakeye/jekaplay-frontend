import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, ShoppingBag, X, Search, UserPlus, Printer } from 'lucide-react';
import { api, naira } from './api.js';

const TYPES = [['eat_in', 'Eat-in'], ['pickup', 'Pick-up'], ['delivery', 'Delivery']];

// Paper roll width in millimetres. Change to 58 if the outlet printer uses 58mm paper.
const SLIP_MM = 80;

// Only the slip prints. Everything else on the page is hidden while printing.
const SLIP_CSS = `
#slip-print{display:none}
@media print{
  @page{size:${SLIP_MM}mm auto;margin:0}
  html,body{background:#fff!important;margin:0!important;padding:0!important}
  body>*:not(#slip-print){display:none!important}
  #slip-print{display:block;width:${SLIP_MM - 8}mm;margin:0 auto;padding:4mm 0 6mm;color:#000;background:#fff;font:12px/1.35 Arial,Helvetica,sans-serif}
  #slip-print .c{text-align:center}
  #slip-print .brand{font-size:20px;font-weight:800;letter-spacing:.5px}
  #slip-print .big{font-size:34px;font-weight:800;line-height:1.1}
  #slip-print .code{font-size:26px;font-weight:800;letter-spacing:4px}
  #slip-print .r{display:flex;justify-content:space-between;gap:6px}
  #slip-print .r span:last-child{white-space:nowrap}
  #slip-print hr{border:0;border-top:1px dashed #000;margin:6px 0}
  #slip-print .tot{font-size:15px;font-weight:800}
  #slip-print .sm{font-size:10.5px}
}`;

const fmtTime = (d) => d.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

function Slip({ s }) {
  return createPortal(
    <div id="slip-print">
      <style>{SLIP_CSS}</style>
      <div className="c brand">JEKAPLAY</div>
      <div className="c sm">the Streets’ Food HQ</div>
      <div className="c">{s.branch.replace('Jekaplay ', '')}</div>
      <hr />
      <div className="c sm">ORDER NUMBER</div>
      <div className="c big">#{s.no}</div>
      {s.code && (<>
        <div className="c sm" style={{ marginTop: 6 }}>PICK-UP CODE</div>
        <div className="c code">{s.code}</div>
      </>)}
      <hr />
      <div className="sm">{fmtTime(s.at)}</div>
      <div className="sm">{TYPES.find((t) => t[0] === s.type)?.[1]}{s.customer ? ' · ' + s.customer : ''}</div>
      <hr />
      {s.lines.map((l, i) => (
        <div className="r" key={i}><span>{l.n}× {l.name}</span><span>{naira(l.total)}</span></div>
      ))}
      <hr />
      {s.fee > 0 && <div className="r"><span>Delivery</span><span>{naira(s.fee)}</span></div>}
      <div className="r tot"><span>TOTAL</span><span>{naira(s.total)}</span></div>
      {s.notes && (<><hr /><div className="sm">Note: {s.notes}</div></>)}
      <hr />
      <div className="c sm">Hand this slip to the service counter to collect your meal.</div>
      <div className="c sm" style={{ marginTop: 4 }}>Thank you!</div>
    </div>,
    document.body
  );
}

export default function TakeOrder({ branch, onToast }) {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('');
  const [cart, setCart] = useState({});
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('eat_in');
  const [customer, setCustomer] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [newCust, setNewCust] = useState(null);
  const [zones, setZones] = useState([]);
  const [zone, setZone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [slip, setSlip] = useState(null);

  useEffect(() => {
    setMenu(null); setCart({}); setError(''); setZones([]); setZone('');
    api('/api/ops/menu?branch_id=' + branch.id)
      .then((d) => { setMenu(d.menu); setCat(d.menu[0]?.category || ''); })
      .catch((e) => setError(e.message));
  }, [branch.id]);

  useEffect(() => {
    if (type !== 'delivery' || zones.length) return;
    api('/api/ops/delivery-zones?branch_id=' + branch.id)
      .then((d) => { setZones(d.zones); setZone(d.zones[0]?.id || ''); })
      .catch((e) => setSheetError(e.message));
  }, [type, branch.id, zones.length]);

  useEffect(() => {
    if (q.trim().length < 2) return setFound([]);
    const t = setTimeout(() => {
      api('/api/customers/search?q=' + encodeURIComponent(q.trim())).then((d) => setFound(d.customers)).catch(() => setFound([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const categories = useMemo(() => [...new Set((menu || []).map((m) => m.category))], [menu]);
  const byId = useMemo(() => Object.fromEntries((menu || []).map((m) => [m.id, m])), [menu]);
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ ...byId[id], n }));
  const count = lines.reduce((a, l) => a + l.n, 0);
  const subtotal = lines.reduce((a, l) => a + l.price_kobo * l.n, 0);
  const zoneObj = zones.find((z) => z.id === zone);
  const fee = type === 'delivery' && zoneObj ? zoneObj.fee_kobo : 0;

  const change = (id, d) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));

  async function addCustomer() {
    setSheetError('');
    try {
      const d = await api('/api/customers', { method: 'POST', body: { full_name: newCust.name, phone: newCust.phone } });
      setCustomer(d.customer); setNewCust(null); setQ('');
    } catch (e) { setSheetError(e.message); }
  }

  async function place() {
    setBusy(true); setSheetError('');
    try {
      const d = await api('/api/ops/orders', {
        method: 'POST',
        body: {
          branch_id: branch.id, order_type: type, customer_id: customer?.id || null,
          delivery_zone_id: type === 'delivery' ? zone : null,
          delivery_address: type === 'delivery' ? address : null,
          notes: notes || null,
          items: lines.map((l) => ({ menu_item_id: l.id, quantity: l.n })),
        },
      });
      setSlip({
        no: d.order.order_no,
        code: d.order.pickup_code || null,
        at: new Date(),
        branch: branch.name,
        type,
        customer: customer?.full_name || null,
        notes: notes || null,
        lines: lines.map((l) => ({ name: l.name, n: l.n, total: l.price_kobo * l.n })),
        fee,
        total: subtotal + fee,
      });
      onToast('Order #' + d.order.order_no + ' recorded');
      setCart({}); setOpen(false); setCustomer(null); setNotes(''); setAddress('');
    } catch (e) { setSheetError(e.message); } finally { setBusy(false); }
  }

  if (error) return <div className="err">{error}</div>;
  if (!menu) return <div className="center">Loading the menu…</div>;

  return (
    <div>
      <div className="eyebrow">{branch.name}</div>
      <h1 className="h1">Take an <b>order</b></h1>
      <p className="sub">Tap + to add dishes. The order is saved against your login.</p>
      <div className="chips">
        {categories.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {menu.filter((m) => m.category === cat).map((m) => (
        <div className={'card dish' + (m.is_available ? '' : ' off')} key={m.id}>
          <div>
            <h3>{m.name}</h3>
            {m.description && <div className="mu">{m.description}</div>}
            <div className="price">{naira(m.price_kobo)}</div>
            {!m.is_available && <span className="badge">Not available now</span>}
          </div>
          <div className="qty">
            {(cart[m.id] || 0) > 0 && (<>
              <button className="qb" onClick={() => change(m.id, -1)} aria-label={'Remove one ' + m.name}><Minus size={18} /></button>
              <span>{cart[m.id]}</span>
            </>)}
            <button className="qb add" disabled={!m.is_available} onClick={() => change(m.id, 1)} aria-label={'Add ' + m.name}><Plus size={18} /></button>
          </div>
        </div>
      ))}

      {count > 0 && !open && (
        <div className="cartbar"><button onClick={() => setOpen(true)}><span><ShoppingBag size={18} style={{ verticalAlign: -3 }} /> {count} item{count > 1 ? 's' : ''}</span><span>{naira(subtotal)}</span></button></div>
      )}

      {open && (
        <div className="scrim" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Review order</h2><button className="icon" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></div>
            {lines.map((l) => (
              <div className="row" key={l.id}>
                <span>{l.n}× {l.name}</span>
                <span className="qty">
                  <button className="qb" onClick={() => change(l.id, -1)}><Minus size={16} /></button>
                  <button className="qb add" onClick={() => change(l.id, 1)}><Plus size={16} /></button>
                  <b style={{ minWidth: 72, textAlign: 'right' }}>{naira(l.price_kobo * l.n)}</b>
                </span>
              </div>
            ))}
            <label>Order type</label>
            <div className="seg">{TYPES.map(([v, l]) => <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>)}</div>

            <label>Customer (optional)</label>
            {customer ? (
              <div className="row card" style={{ margin: 0 }}><span><b>{customer.full_name}</b><div className="mu">{customer.phone}</div></span><button className="icon" onClick={() => setCustomer(null)}><X size={16} /></button></div>
            ) : newCust ? (
              <div>
                <input placeholder="Customer name" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
                <input style={{ marginTop: 8 }} inputMode="tel" placeholder="WhatsApp number" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} />
                <div className="seg" style={{ marginTop: 8 }}><button onClick={() => setNewCust(null)}>Cancel</button><button className="on" onClick={addCustomer}>Save customer</button></div>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 14, top: 17, color: 'var(--mu)' }} /><input style={{ paddingLeft: 38 }} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
                {found.map((c) => <button key={c.id} className="row card" style={{ width: '100%', margin: '6px 0' }} onClick={() => { setCustomer(c); setQ(''); }}><b>{c.full_name}</b><span className="mu">{c.phone}</span></button>)}
                <button className="chip" style={{ marginTop: 8 }} onClick={() => setNewCust({ name: '', phone: '' })}><UserPlus size={14} style={{ verticalAlign: -2 }} /> New customer</button>
              </div>
            )}

            {type === 'delivery' && (<>
              <label>Delivery area (approved zones only)</label>
              {zones.length ? (
                <select value={zone} onChange={(e) => setZone(e.target.value)}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name} · {naira(z.fee_kobo)}</option>)}</select>
              ) : <div className="mu">No approved delivery zones are set for this outlet yet.</div>}
              <label>Delivery address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street and landmark" />
            </>)}

            <label>Note for the kitchen (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. no pepper" />
            <div style={{ marginTop: 14 }}>
              <div className="row"><span className="mu">Items</span><span>{naira(subtotal)}</span></div>
              {type === 'delivery' && <div className="row"><span className="mu">Delivery</span><span>{naira(fee)}</span></div>}
              <div className="row total"><span>Total</span><span>{naira(subtotal + fee)}</span></div>
            </div>
            {sheetError && <div className="err">{sheetError}</div>}
            <button className="btn" disabled={busy || (type === 'delivery' && !zoneObj)} onClick={place}>{busy ? 'Saving…' : 'Place order'}</button>
          </div>
        </div>
      )}

      {slip && (<>
        <Slip s={slip} />
        <div className="scrim" onClick={() => setSlip(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Order #{slip.no} recorded</h2><button className="icon" onClick={() => setSlip(null)} aria-label="Close"><X size={18} /></button></div>
            <div className="row total"><span>Total</span><span>{naira(slip.total)}</span></div>
            <button className="btn" onClick={() => window.print()}><Printer size={16} style={{ verticalAlign: -3 }} /> Print slip</button>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setSlip(null)}>Done, next order</button>
          </div>
        </div>
      </>)}
    </div>
  );
}
