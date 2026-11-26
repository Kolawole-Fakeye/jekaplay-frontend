import { useEffect, useState } from 'react';
import { ShoppingBag, ReceiptText, LogOut, Sun, Moon, ClipboardList, Users } from 'lucide-react';
import { api, getSession, onSession, logout } from './api.js';
import { Auth, SetPin } from './Login.jsx';
import { LegalPage } from './Legal.jsx';
import CustomerApp from './CustomerApp.jsx';
import TakeOrder from './TakeOrder.jsx';
import MySales from './MySales.jsx';
import Board from './Board.jsx';
import StaffCustomers from './StaffCustomers.jsx';

const ROLE_LABEL = { owner: 'Overall admin', admin: 'Admin', supervisor: 'Supervisor', staff: 'Staff' };

function Main() {
  const [session, setSession] = useState(getSession());
  const [me, setMe] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('jekaplay_theme') || 'dark');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [tab, setTab] = useState('board');
  const [toast, setToast] = useState('');

  useEffect(() => onSession(setSession), []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('jekaplay_theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (!session) { setMe(null); return; }
    api('/api/auth/me').then((d) => setMe(d.user)).catch(() => {});
  }, [session?.refreshToken]);

  useEffect(() => {
    if (!me || me.role === 'customer' || me.must_change_pin) return;
    api('/api/ops/branches').then((d) => {
      setBranches(d.branches);
      setBranchId((b) => (d.branches.some((x) => x.id === b) ? b : d.branches[0]?.id || ''));
    }).catch(() => {});
  }, [me?.id, me?.must_change_pin]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!session) return <Auth theme={theme} />;
  if (!me) return <div className="center" style={{ paddingTop: '40vh' }}>Loading…</div>;
  if (me.must_change_pin) return <SetPin digits={me.role === 'customer' ? 4 : 6} onDone={() => setMe({ ...me, must_change_pin: false })} />;
  if (me.role === 'customer') return <CustomerApp me={me} theme={theme} setTheme={setTheme} />;

  const branch = branches.find((b) => b.id === branchId);
  const logo = theme === 'light' ? '/jekaplay-wordmark-black.png' : '/jekaplay-wordmark-green.png';
  const canHelp = ['owner', 'admin', 'supervisor'].includes(me.role);
  const tabs = [
    ['board', 'Orders', ClipboardList],
    ['order', 'New order', ShoppingBag],
    ['sales', 'My sales', ReceiptText],
    ...(canHelp ? [['customers', 'Customers', Users]] : []),
  ];

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <header className="top">
        <img className="logo" src={logo} alt="Jekaplay" />
        <span className="grow" />
        {branches.length > 1 && (
          <select className="pill" value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label="Outlet">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name.replace('Jekaplay ', '')}</option>)}
          </select>
        )}
        <button className="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Switch light or dark">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
      </header>
      <div className="mu" style={{ marginBottom: 4 }}>{me.full_name} · {ROLE_LABEL[me.role] || me.role}</div>

      {!branch ? (
        <div className="card center">You are not placed at an outlet yet. Ask the overall admin to place you.</div>
      ) : tab === 'board' ? (
        <Board branch={branch} role={me.role} onToast={setToast} />
      ) : tab === 'order' ? (
        <TakeOrder branch={branch} onToast={setToast} />
      ) : tab === 'sales' ? (
        <MySales />
      ) : (
        <StaffCustomers />
      )}

      <nav className="nav staffnav">
        <div>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}><Icon size={24} />{label}</button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const page = { '#/terms': 'terms', '#/privacy': 'privacy', '#/contact': 'contact' }[hash] || null;
  return (
    <>
      <Main />
      {page && <LegalPage page={page} theme={document.documentElement.dataset.theme || 'dark'} />}
    </>
  );
}
