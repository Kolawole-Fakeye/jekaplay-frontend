import { useState } from 'react';
import { Delete, Check, ArrowLeft } from 'lucide-react';
import { api, login, changePin } from './api.js';
import { LegalLinks } from './Legal.jsx';

const logoFor = (theme) => (theme === 'light' ? '/jekaplay-wordmark-black.png' : '/jekaplay-wordmark-green.png');

function PinPad({ value, onChange, onSubmit, busy }) {
  function press(d) {
    if (busy) return;
    const next = (value + d).slice(0, 6);
    onChange(next);
    if (next.length === 6) onSubmit(next);
  }
  return (
    <div>
      <div className="dots" aria-label="PIN entered so far">
        {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i < value.length ? 'f' : ''} />)}
      </div>
      <div className="pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button type="button" key={n} onClick={() => press(String(n))} disabled={busy}>{n}</button>
        ))}
        <button type="button" onClick={() => onChange(value.slice(0, -1))} aria-label="Delete last digit"><Delete size={22} /></button>
        <button type="button" onClick={() => press('0')} disabled={busy}>0</button>
        <button type="button" className="go" onClick={() => onSubmit(value)} disabled={busy || value.length < 4} aria-label="Log in"><Check size={24} /></button>
      </div>
    </div>
  );
}

export function Auth({ theme }) {
  const [view, setView] = useState('welcome');
  return (
    <div className="login">
      <img src={logoFor(theme)} alt="Jekaplay, the Streets’ Food HQ" />
      {view === 'welcome' && <Welcome go={setView} />}
      {view === 'login' && <LoginForm go={setView} />}
      {view === 'signup' && <Signup go={setView} />}
      <LegalLinks />
    </div>
  );
}

function Welcome({ go }) {
  return (
    <>
      <div className="eyebrow" style={{ justifyContent: 'center' }}>The Streets’ Food HQ</div>
      <h1 className="h1">Welcome to <b>Jekaplay</b></h1>
      <p className="sub">Order your favourite street food, earn rewards and skip the queue. Staff log in here too.</p>
      <button className="btn" onClick={() => go('signup')}>Create your account</button>
      <button className="btn ghost" onClick={() => go('login')}>I already have an account</button>
    </>
  );
}

function LoginForm({ go }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(p) {
    if (busy) return;
    if (!phone.trim()) return setError('Enter your WhatsApp number first');
    setBusy(true);
    setError('');
    try {
      await login(phone, p);
    } catch (e) {
      setError(e.message);
      setPin('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="back" onClick={() => go('welcome')}><ArrowLeft size={16} /> Back</button>
      <h1 className="h1">Log <b>in</b></h1>
      <input inputMode="tel" autoComplete="tel" placeholder="WhatsApp number, e.g. 0801 234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="WhatsApp number" />
      {error && <div className="err">{error}</div>}
      <PinPad value={pin} onChange={(v) => { setError(''); setPin(v); }} onSubmit={submit} busy={busy} />
      <p className="mu">{busy ? 'Signing you in…' : 'Enter your PIN, then tap the tick if it has fewer than 6 digits'}</p>
      <button className="link" onClick={() => go('signup')}>New here? Create an account</button>
    </>
  );
}

function Signup({ go }) {
  const [f, setF] = useState({ name: '', phone: '', pin: '', again: '', consent: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const digits = (k) => (e) => setF({ ...f, [k]: e.target.value.replace(/\D/g, '').slice(0, 6) });

  async function submit(e) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setError('Enter your name');
    if (!f.phone.trim()) return setError('Enter your WhatsApp number');
    if (!/^\d{4,6}$/.test(f.pin)) return setError('Your PIN must be 4 to 6 digits');
    if (f.pin !== f.again) return setError('The two PINs do not match');
    setBusy(true);
    setError('');
    try {
      await api('/api/public/signup', { method: 'POST', auth: false, body: { full_name: f.name, phone: f.phone, pin: f.pin, marketing_consent: f.consent } });
      await login(f.phone, f.pin);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack">
      <button type="button" className="back" onClick={() => go('welcome')}><ArrowLeft size={16} /> Back</button>
      <h1 className="h1">Join <b>Jekaplay</b></h1>
      <p className="sub">Fill this in to get great rewards.</p>
      <input placeholder="Your name" value={f.name} onChange={set('name')} autoComplete="name" />
      <input inputMode="tel" placeholder="WhatsApp number" value={f.phone} onChange={set('phone')} autoComplete="tel" />
      <input type="password" inputMode="numeric" placeholder="Choose a PIN (4 to 6 digits)" value={f.pin} onChange={digits('pin')} />
      <input type="password" inputMode="numeric" placeholder="Repeat your PIN" value={f.again} onChange={digits('again')} />
      <label className="check">
        <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
        <span>Send me offers and rewards on WhatsApp. I can stop any time.</span>
      </label>
      <p className="mu" style={{ textAlign: 'center', margin: '2px 0' }}>By creating an account you agree to our <a href="#/terms">Terms &amp; Conditions</a>.</p>
      {error && <div className="err">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Creating your account…' : 'Create my account'}</button>
      <button type="button" className="link" onClick={() => go('login')}>I already have an account</button>
    </form>
  );
}

export function SetPin({ onDone }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(next)) return setError('Your new PIN must be 4 to 6 digits (staff PINs: exactly 6)');
    if (next !== again) return setError('The two new PINs do not match');
    setBusy(true);
    setError('');
    try {
      await changePin(cur, next);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const digits = (setter) => (e) => setter(e.target.value.replace(/\D/g, '').slice(0, 6));
  return (
    <form className="login" onSubmit={submit}>
      <h1 className="h1">Choose your <b>own PIN</b></h1>
      <p className="sub">You are using a temporary PIN. Pick a new PIN that only you know.</p>
      <input type="password" inputMode="numeric" placeholder="Temporary PIN" value={cur} onChange={digits(setCur)} />
      <input type="password" inputMode="numeric" placeholder="New PIN" value={next} onChange={digits(setNext)} />
      <input type="password" inputMode="numeric" placeholder="Repeat new PIN" value={again} onChange={digits(setAgain)} />
      {error && <div className="err">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save my PIN'}</button>
    </form>
  );
}
