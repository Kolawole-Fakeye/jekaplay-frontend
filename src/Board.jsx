import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Store, Truck } from 'lucide-react';
import { api, naira } from './api.js';

const TYPE = { eat_in: 'Eat-in', pickup: 'Pick-up', delivery: 'Delivery' };
const NEXT = {
  pending_payment: { to: 'received', label: 'Payment received' },
  received: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'ready', label: 'Mark ready' },
  ready: { to: 'completed', label: 'Collected' },
  out_for_delivery: { to: 'completed', label: 'Delivered' },
};
const GROUPS = [
  ['New', ['pending_payment', 'received']],
  ['Preparing', ['preparing']],
  ['Ready', ['ready', 'out_for_delivery']],
  ['Done (last 2 hours)', ['completed']],
];

export default function Board({ branch, role, onToast }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const [busyId, setBusyId] = useState('');
  const prev = useRef(null);
  const audio = useRef(null);
  const canCancel = ['owner', 'admin', 'supervisor'].includes(role);

  async function load() {
    try {
      const d = await api('/api/ops/orders/board?branch_id=' + branch.id);
      setOrders(d.orders);
      setError('');
      setNow(Date.now());
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    setOrders(null); prev.current = null;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [branch.id]);

  useEffect(() => {
    if (!orders) return;
    const n = orders.filter((o) => ['received', 'pending_payment'].includes(o.status)).length;
    if (prev.current !== null && n > prev.current) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (sound && audio.current) {
        const o = audio.current.createOscillator();
        const g = audio.current.createGain();
        o.frequency.value = 880; g.gain.value = 0.15;
        o.connect(g); g.connect(audio.current.destination);
        o.start(); setTimeout(() => o.stop(), 400);
      }
    }
    prev.current = n;
  }, [orders]);

  function toggleSound() {
    if (!sound && !audio.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio.current = new AC();
    }
    setSound(!sound);
  }

  async function move(o, to) {
    setBusyId(o.id);
    try {
      await api(`/api/ops/orders/${o.id}/status`, { method: 'POST', body: { status: to } });
      await load();
    } catch (e) {
      onToast(e.message);
    } finally {
      setBusyId('');
    }
  }

  const mins = (iso) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

  function Card({ o }) {
    const act = o.status === 'ready' && o.order_type === 'delivery' ? { to: 'out_for_delivery', label: 'Out for delivery' } : NEXT[o.status];
    const m = mins(o.placed_at);
    const late = ['received', 'preparing'].includes(o.status) && m >= 10;
    return (
      <div className={'card order' + (late ? ' late' : '')}>
        <div className="row">
          <b className="onum">#{o.order_no}</b>
          <span className="row" style={{ gap: 6, padding: 0 }}>
            <span className="badge">{o.channel === 'staff' ? 'Counter' : 'Online'}</span>
            <span className="badge go">{TYPE[o.order_type] || o.order_type}</span>
            <span className={'badge' + (late ? ' warn' : '')}>{m} min</span>
          </span>
        </div>
        <ul className="items">{(o.items || []).map((i) => <li key={i.name}><b>{i.quantity}×</b> {i.name}</li>)}</ul>
        {o.notes && <div className="note">“{o.notes.replace(' | Online order: pay at the outlet', '').replace('Online order: pay at the outlet', 'Pay at the outlet')}”</div>}
        <div className="mu">
          {o.customer_name ? <>{o.customer_name}{o.customer_phone ? ' · ' + o.customer_phone : ''}</> : o.guest_name || 'Walk-in'}
          {o.staff_name ? ' · taken by ' + o.staff_name : ''}
          {o.delivery_address ? <><br /><Truck size={13} style={{ verticalAlign: -2 }} /> {o.delivery_address}</> : null}
        </div>
        <div className="row"><span className="mu">Total</span><b>{naira(o.total_kobo)}</b></div>
        {act && (
          <button className="btn act" disabled={busyId === o.id} onClick={() => move(o, act.to)}>{busyId === o.id ? 'Saving…' : act.label}</button>
        )}
        {canCancel && o.status !== 'completed' && (
          <button className="link danger" disabled={busyId === o.id} onClick={() => window.confirm('Cancel order #' + o.order_no + '? Stock is put back.') && move(o, 'cancelled')}>Cancel order</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{branch.name.replace('Jekaplay ', '')} kitchen</div>
          <h1 className="h1">Live <b>orders</b></h1>
        </div>
        <button className="icon" onClick={toggleSound} aria-label="Sound for new orders">{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      </div>
      {error && <div className="err">{error}</div>}
      {!orders && !error && <div className="center">Loading orders…</div>}
      {orders && GROUPS.map(([title, sts]) => {
        const list = orders.filter((o) => sts.includes(o.status));
        if (title.startsWith('Done') && list.length === 0) return null;
        return (
          <section key={title}>
            <h2 className="group">{title} <span className="badge">{list.length}</span></h2>
            {list.length === 0 && <div className="mu" style={{ margin: '4px 0 12px' }}>Nothing here</div>}
            {list.map((o) => <Card key={o.id} o={o} />)}
          </section>
        );
      })}
      {orders && orders.length === 0 && <div className="card center"><Store size={22} /><br />No orders yet. New ones appear here by themselves.</div>}
    </div>
  );
}
