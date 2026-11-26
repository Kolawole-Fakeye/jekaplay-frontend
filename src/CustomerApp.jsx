import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingBag, X, LogOut, Sun, Moon, MapPin, UtensilsCrossed, ReceiptText, User, RotateCcw } from 'lucide-react';
import { api, logout, naira, lagosTime } from './api.js';
import { LegalLinks } from './Legal.jsx';

const short = (name) => name.replace('Jekaplay ', '');
const logoFor = (theme) => (theme === 'light' ? '/jekaplay-wordmark-black.png' : '/jekaplay-wordmark-green.png');
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const STATUS = {
  received: 'We have your order',
  pending_payment: 'Waiting for payment',
  preparing: 'Being prepared',
  ready: 'Ready! Come and collect',
  out_for_delivery: 'On its way',
  completed: 'Collected. Enjoy!',
  cancelled: 'Cancelled',
};

export default function CustomerApp({ me, theme, setTheme }) {
  const [tab, setTab] = useState('order');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(() => read('jekaplay_branch'));
  const [step, setStep] = useState('outlet');
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('');
  const [cart, setCart] = useState({});
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('pickup');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [toast, setToast] = useState('');
  const [orders, setOrders] = useState(null);
  const [profile, setProfile] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [birthday, setBirthday] = useState('');
  const [skipName, setSkipName] = useState(!!read('jekaplay_name_skipped'));
  const [del, setDel] = useState(false);
  const [delPin, setDelPin] = useState('');
  const [delError, setDelError] = useState('');

  const nextStep = () => (read('jekaplay_offer_day') === today() ? 'menu' : 'offer');

  useEffect(() => {
    api('/api/public/branches', { auth: false }).then((d) => {
      setBranches(d.branches);
      if (d.branches.some((b) => b.id === branchId)) setStep(nextStep());
      else setBranchId('');
    }).catch((e) => setError(e.message));
    api('/api/me/profile').then((d) => { setProfile(d.profile); setBirthday(d.profile.birthday ? String(d.profile.birthday).slice(0, 10) : ''); }).catch(() => {});
    api('/api/me/orders').then((d) => setOrders(d.orders)).catch(() => {});
  }, []);

  const branch = branches.find((b) => b.id === branchId);

  useEffect(() => {
    if (!branch) return;
    setMenu(null);
    api('/api/public/menu?branch_code=' + branch.code, { auth: false })
      .then((d) => { setMenu(d.menu); setCat(d.menu[0]?.category || ''); })
      .catch((e) => setError(e.message));
  }, [branch?.id]);

  useEffect(() => {
    if (step === 'offer') write('jekaplay_offer_day', today());
  }, [step]);

  useEffect(() => {
    if (tab !== 'orders') return;
    const load = () => api('/api/me/orders').then((d) => setOrders(d.orders)).catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const categories = useMemo(() => [...new Set((menu || []).map((m) => m.category))], [menu]);
  const byId = useMemo(() => Object.fromEntries((menu || []).map((m) => [m.id, m])), [menu]);
  const lifeSavers = (menu || []).filter((m) => m.name.includes('Life Saver') && m.is_available);
  const lines = Object.entries(cart).filter(([, n]) => n > 0).map(([id, n]) => ({ ...byId[id], n }));
  const count = lines.reduce((a, l) => a + l.n, 0);
  const total = lines.reduce((a, l) => a + l.price_kobo * l.n, 0);
  const change = (id, d) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));
  const last = orders && orders[0];
  const reorderable = last ? (last.items || []).filter((i) => byId[i.menu_item_id]?.is_available) : [];
  const defaultName = profile && profile.full_name === 'Jekaplay customer';

  function chooseBranch(b) {
    setBranchId(b.id);
    write('jekaplay_branch', b.id);
    setCart({});
    setStep(nextStep());
  }

  function reorder() {
    const c = {};
    reorderable.forEach((i) => { c[i.menu_item_id] = i.quantity; });
    setCart(c);
    setOpen(true);
  }

  async function place() {
    setBusy(true); setSheetError('');
    try {
      const d = await api('/api/me/orders', {
        method: 'POST',
        body: { branch_id: branch.id, order_type: type, notes: notes || null, items: lines.map((l) => ({ menu_item_id: l.id, quantity: l.n })) },
      });
      setToast('Order #' + d.order.order_no + ' received. Pay when you collect.');
      setCart({}); setNotes(''); setOpen(false); setTab('orders'); setOrders(null);
    } catch (e) { setSheetError(e.message); } finally { setBusy(false); }
  }

  async function saveProfile() {
    setError('');
    try {
      const body = {};
      if (nameInput.trim()) body.full_name = nameInput.trim();
      if (birthday) body.birthday = birthday;
      const d = await api('/api/me/profile', { method: 'PATCH', body });
      setProfile(d.profile); setNameInput('');
      setToast('Saved');
    } catch (e) { setError(e.message); }
  }

  async function deleteAccount() {
    setDelError('');
    try {
      await api('/api/me/delete-account', { method: 'POST', body: { pin: delPin } });
      try { localStorage.removeItem('jekaplay_phone'); localStorage.removeItem('jekaplay_branch'); } catch { /* ignore */ }
      await logout();
    } catch (e) { setDelError(e.message); }
  }

  const first = defaultName ? 'there' : (profile?.full_name || me.full_name).split(' ')[0];

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <header className="top">
        <img className="logo" src={logoFor(theme)} alt="Jekaplay" />
        <span className="grow" />
        {branch && step !== 'outlet' && tab === 'order' && <button className="pill" onClick={() => setStep('outlet')}><MapPin size={13} style={{ verticalAlign: -2 }} /> {short(branch.name)}</button>}
        <button className="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Switch light or dark">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      </header>
      {error && <div className="err">{error}</div>}

      {tab === 'account' ? (
        <div>
          <div className="eyebrow">Your account</div>
          <h1 className="h1">Hi <b>{first}</b></h1>
          <div className="card">
            <label>Your name</label>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={defaultName ? 'What should we call you?' : profile?.full_name} />
            <label>Birthday (for birthday treats)</label>
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
            <button className="btn" style={{ marginTop: 12 }} onClick={saveProfile}>Save</button>
          </div>
          <div className="card">
            <div className="mu">WhatsApp number</div><b>{profile?.phone || me.phone}</b>
          </div>
          <div className="card links-card">
            <a href="#/terms">Terms &amp; Conditions</a>
            <a href="#/privacy">Privacy Policy</a>
            <a href="#/contact">Contact us</a>
          </div>
          <button className="btn ghost" onClick={logout}><LogOut size={18} /> Log out</button>
          <button className="link danger" onClick={() => setDel(true)}>Delete my account</button>
        </div>
      ) : tab === 'orders' ? (
        <div>
          <div className="eyebrow">Your orders</div>
          <h1 className="h1">Order <b>status</b></h1>
          {!orders && !error && <div className="center">Loading…</div>}
          {orders && orders.length === 0 && <div className="card center">No orders yet. Pick something tasty.</div>}
          {orders && orders.map((o) => (
            <div className={'card' + (o.status === 'ready' ? ' ready' : '')} key={o.id}>
              <div className="row"><b>Order #{o.order_no}</b><span className={'badge' + (o.status === 'ready' ? ' go' : '')}>{STATUS[o.status] || o.status}</span></div>
              <div className="mu">{lagosTime(o.placed_at)} · {short(o.branch)} · {o.order_type.replace('_', ' ')}</div>
              <div style={{ margin: '8px 0' }}>{(o.items || []).map((i) => i.quantity + '× ' + i.name).join(', ')}</div>
              <div className="row total"><span>Total</span><span>{naira(o.total_kobo)}</span></div>
            </div>
          ))}
        </div>
      ) : step === 'outlet' ? (
        <div>
          <div className="eyebrow">Hi {first}</div>
          <h1 className="h1">Which outlet do you want to <b>order from?</b></h1>
          {branches.map((b) => (
            <button key={b.id} className="outlet" onClick={() => chooseBranch(b)}><MapPin size={22} /><span><b>{short(b.name)}</b></span></button>
          ))}
        </div>
      ) : step === 'offer' ? (
        <div>
          <div className="eyebrow">{short(branch?.name || '')} outlet</div>
          <div className="offer">
            <div className="badge go">Today’s offer</div>
            <h1 className="h1">Get a <b>₦1,000 meal</b> plus free Beef!</h1>
            <p className="sub">4 portions of rice or spaghetti, with free beef on the side.</p>
            <button className="btn" onClick={() => setStep('pick')}>Yes, I’ll take it</button>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setStep('menu')}>No, show me the full menu</button>
          </div>
        </div>
      ) : step === 'pick' ? (
        <div>
          <div className="eyebrow">Your ₦1,000 meal</div>
          <h1 className="h1">Which one will you <b>take?</b></h1>
          {!menu && <div className="center">Loading…</div>}
          {lifeSavers.map((m) => (
            <button key={m.id} className="outlet" onClick={() => { setCart({ [m.id]: 1 }); setStep('menu'); }}>
              <UtensilsCrossed size={22} /><span><b>{m.name}</b><div className="mu">{m.description}</div></span><b>{naira(m.price_kobo)}</b>
            </button>
          ))}
          {menu && lifeSavers.length === 0 && <div className="card center">The ₦1,000 meals are not available right now.</div>}
          <button className="link" onClick={() => setStep('menu')}>Skip, show me the menu</button>
        </div>
      ) : (
        <div>
          <div className="eyebrow">{short(branch?.name || '')} menu</div>
          <h1 className="h1">{lines.some((l) => l.name.includes('Life Saver')) ? <>Which of these will you <b>add?</b></> : <>What are you <b>having?</b></>}</h1>
          {defaultName && !skipName && (
            <div className="card">
              <b>What should we call you?</b>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your name" />
                <button className="pill" onClick={saveProfile}>Save</button>
              </div>
              <button className="link" onClick={() => { write('jekaplay_name_skipped', '1'); setSkipName(true); }}>Skip for now</button>
            </div>
          )}
          {reorderable.length > 0 && count === 0 && (
            <button className="reorder" onClick={reorder}>
              <RotateCcw size={20} />
              <span><b>Order again</b><div className="mu">{reorderable.map((i) => i.quantity + '× ' + i.name).join(', ')}</div></span>
            </button>
          )}
          {!menu && <div className="center">Loading the menu…</div>}
          {menu && (<>
            <div className="chips">{categories.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
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
          </>)}
        </div>
      )}

      {tab === 'order' && step === 'menu' && count > 0 && !open && (
        <div className="cartbar"><button onClick={() => setOpen(true)}><span><ShoppingBag size={18} style={{ verticalAlign: -3 }} /> {count} item{count > 1 ? 's' : ''}</span><span>{naira(total)}</span></button></div>
      )}

      {open && (
        <div className="scrim" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Your order</h2><button className="icon" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></div>
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
            <label>How will you have it?</label>
            <div className="seg">{[['pickup', 'Pick-up'], ['eat_in', 'Eat-in']].map(([v, l]) => <button key={v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>{l}</button>)}</div>
            <label>Note for the kitchen (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. no pepper" />
            <div className="row total"><span>Total</span><span>{naira(total)}</span></div>
            <p className="mu">Pay at the outlet when you collect. Online payment is coming soon.</p>
            {sheetError && <div className="err">{sheetError}</div>}
            <button className="btn" disabled={busy} onClick={place}>{busy ? 'Placing…' : 'Place order'}</button>
          </div>
        </div>
      )}

      {del && (
        <div className="scrim" onClick={() => setDel(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>Delete your account?</h2><button className="icon" onClick={() => setDel(false)} aria-label="Close"><X size={18} /></button></div>
            <p>This removes your name, number and birthday. Your past orders stay in Jekaplay’s records, but are no longer linked to you. You cannot undo this.</p>
            <label>Enter your PIN to confirm</label>
            <input type="password" inputMode="numeric" maxLength={4} value={delPin} onChange={(e) => setDelPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4-digit PIN" />
            {delError && <div className="err">{delError}</div>}
            <button className="btn danger" disabled={delPin.length !== 4} onClick={deleteAccount}>Delete my account</button>
          </div>
        </div>
      )}

      {tab === 'order' && <LegalLinks />}

      <nav className="nav">
        <div>
          <button className={tab === 'order' ? 'on' : ''} onClick={() => setTab('order')}><ShoppingBag size={20} />Order</button>
          <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}><ReceiptText size={20} />My orders</button>
          <button className={tab === 'account' ? 'on' : ''} onClick={() => setTab('account')}><User size={20} />Account</button>
        </div>
      </nav>
    </div>
  );
}
