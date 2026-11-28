import { useState } from 'react';
import { api, naira } from './api.js';

const STATUS = {
  pending_payment: 'Payment not confirmed',
  received: 'Received',
  preparing: 'Being prepared',
  ready: 'Ready to hand over',
  out_for_delivery: 'Out for delivery',
  completed: 'Already handed over',
  cancelled: 'Cancelled',
};
const TYPE = { eat_in: 'Eat-in', pickup: 'Pick-up', delivery: 'Delivery' };
const when = (t) => new Date(t).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

export default function Collect({ branch, onToast }) {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function find(c = code) {
    if (c.length !== 4) return setError('Enter the 4-digit code from the slip');
    setBusy(true); setError(''); setOrder(null);
    try {
      const d = await api(`/api/ops/collect/lookup?branch_id=${branch.id}&code=${c}`);
      setOrder(d.order);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function handOver() {
    setBusy(true); setError('');
    try {
      await api('/api/ops/collect', { method: 'POST', body: { order_id: order.id } });
      onToast('Order #' + order.order_no + ' handed over');
      setOrder(null); setCode('');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const used = order?.status === 'completed';

  return (
    <div>
      <div className="eyebrow">{branch.name.replace('Jekaplay ', '')} counter</div>
      <h1 className="h1">Hand over a <b>meal</b></h1>
      <p className="sub">Ask for the customer’s slip and type the 4-digit pick-up code from it.</p>

      <label>Pick-up code</label>
      <input
        type="text" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="0000"
        style={{ fontSize: 28, letterSpacing: 8, textAlign: 'center' }}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          setCode(v); setOrder(null); setError('');
          if (v.length === 4) find(v);
        }}
      />
      <button className="btn" style={{ marginTop: 10 }} disabled={busy || code.length !== 4} onClick={() => find()}>{busy && !order ? 'Checking…' : 'Find order'}</button>
      {error && <div className="err">{error}</div>}

      {order && (
        <div className={'card' + (used || order.status === 'cancelled' ? ' late' : '')} style={{ marginTop: 14 }}>
          <div className="row">
            <b>Order #{order.order_no}</b>
            <span className={'badge' + (order.can_collect ? ' go' : ' warn')}>{STATUS[order.status] || order.status}</span>
          </div>
          <div className="mu">{TYPE[order.order_type]} · placed {when(order.placed_at)}{order.customer_name || order.guest_name ? ' · ' + (order.customer_name || order.guest_name) : ''}</div>
          <div style={{ margin: '10px 0' }}>
            {(order.items || []).map((i, k) => <div className="row" key={k}><span>{i.quantity}× {i.name}</span></div>)}
          </div>
          {order.notes && <div className="note">Note: {order.notes}</div>}
          <div className="row total"><span>Total</span><span>{naira(order.total_kobo)}</span></div>

          {used && (
            <div className="err">
              This slip was already used{order.collected_at ? ' at ' + when(order.collected_at) : ''}{order.collected_by_name ? ' by ' + order.collected_by_name : ''}. Do not hand over another meal.
            </div>
          )}
          {!used && !order.can_collect && order.status !== 'cancelled' && (
            <div className="mu" style={{ marginTop: 8 }}>This order is not ready yet. Ask the customer to wait, then check again.</div>
          )}
          {order.can_collect && (
            <button className="btn" style={{ marginTop: 12 }} disabled={busy} onClick={handOver}>{busy ? 'Saving…' : 'Hand over meal'}</button>
          )}
          {!used && !order.can_collect && (
            <button className="btn ghost" style={{ marginTop: 12 }} disabled={busy} onClick={() => find()}>Check again</button>
          )}
        </div>
      )}
    </div>
  );
}
