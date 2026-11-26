import { useState } from 'react';
import { Delete, ArrowLeft } from 'lucide-react';
import { api, login, changePin } from './api.js';
import { LegalLinks } from './Legal.jsx';

const logoFor = (theme) => (theme === 'light' ? '/jekaplay-wordmark-black.png' : '/jekaplay-wordmark-green.png');
const read = (k, d = '') => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const mask = (p) => { const d = p.replace(/\D/g, ''); return d.length >= 8 ? '0' + d.slice(-10, -7) + ' ••• ' + d.slice(-4) : p; };
const isRun = (p) => { const d = p.split('').map(Number); return d.every((x, i) => i === 0 || x - d[i - 1] === 1) || d.every((x, i) => i === 0 || d[i - 1] - x === 1); };
const weak = (p) => /^(\d)\1+$/.test(p) || ['1234', '4321', '1212', '2580', '0852', '1004', '2000', '6969', '1122', '1313'].includes(p) || isRun(p);

function PinPad({ length, value, onChange, onDone, busy }) {
  function press(d) {
    if (busy) return;
    const next = (value + d).slice(0, length);
    onChange(next);
    if (next.length === length) onDone(next);
  }
  return (
    <div>
      <div className="dots" aria-label="PIN entered so far">
        {Array.from({ length }, (_, i) => <i key={i} className={i < value.length ? 'f' : ''} />)}
      </div>
      <div className="pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <button type="button" key={n} onClick={() => press(String(n))} disabled={busy}>{n}</button>)}
        <span />
        <button type="button" onClick={() => press('0')} disabled={busy}>0</button>
        <button type="button" onClick={() => onChange(value.slice(0, -1))} aria-label="Delete last digit"><Delete size={22} /></button>
      </div>
    </div>
  );
}

export function Auth({ theme }) {
  const [view, setView] = useState(read('jekaplay_phone') ? 'login' : 'welcome');
  const [mode, setMode] = useState(read('jekaplay_mode', 'customer'));
  const pick = (m) => { setMode(m); write('jekaplay_mode', m); };
  if (view === 'welcome') {
    return (
      <div className="welcome">
        <div className="glow" />
        <img className="w-logo" src={logoFor(theme)} alt="Jekaplay, the Streets’ Food HQ" />
        <div className="sticker">₦1,000 meal<br />+ free beef</div>
        <h1 className="w-h1">Real street food.<br /><b>Zero queue.</b></h1>
        <p className="sub">Order from Unilag, LASU or Orile-Iganmu. Pay when you collect.</p>
        <button className="btn big" onClick={() => setView('signup')}>Order now</button>
        <button className="btn ghost" onClick={() => { pick('customer'); setView('login'); }}>I already have an account</button>
        <button className="link" onClick={() => { pick('staff'); setView('login'); }}>Staff login</button>
        <LegalLinks />
      </div>
    );
  }
  return (
    <div className="login">
      <img src={logoFor(theme)} alt="Jekaplay" />
      {view === 'login' && <LoginForm go={setView} mode={mode} pick={pick} />}
      {view === 'signup' && <Signup go={setView} />}
      <LegalLinks />
    </div>
  );
}

function LoginForm({ go, mode, pick }) {
  const saved = read('jekaplay_phone');
  const [phone, setPhone] = useState(saved);
  const [editing, setEditing] = useState(!saved);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const staff = mode === 'staff';

  async function submit(p) {
    if (busy) return;
    if (!phone.trim()) { setPin(''); return setError('Enter your WhatsApp number first'); }
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
      <div className="toggle" role="tablist">
        <button className={!staff ? 'on' : ''} onClick={() => { pick('customer'); setPin(''); setError(''); }}>Customer</button>
        <button className={staff ? 'on' : ''} onClick={() => { pick('staff'); setPin(''); setError(''); }}>Staff</button>
      </div>
      {!editing ? (
        <div>
          <h1 className="h1">Welcome <b>back</b></h1>
          <p className="sub">{mask(phone)} · <button className="link inline" onClick={() => { setEditing(true); setPhone(''); }}>Not you?</button></p>
        </div>
      ) : (
        <div className="stack">
          <h1 className="h1">{staff ? 'Staff ' : 'Log '}<b>in</b></h1>
          <input inputMode="tel" autoComplete="tel" placeholder="WhatsApp number, e.g. 0801 234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="WhatsApp number" />
        </div>
      )}
      {error && <div className="err">{error}</div>}
      <PinPad length={staff ? 6 : 4} value={pin} onChange={(v) => { setError(''); setPin(v); }} onDone={submit} busy={busy} />
      <p className="mu">{busy ? 'Signing you in…' : staff ? 'Enter your 6-digit PIN' : 'Enter your 4-digit PIN'}</p>
      <p className="mu small">Forgot your PIN? {staff ? 'Ask your admin to reset it.' : 'Ask any supervisor at the outlet to reset it for you.'}</p>
      {!staff && <button className="link" onClick={() => go('signup')}>New here? Create an account</button>}
    </>
  );
}

function Signup({ go }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [offers, setOffers] = useState(false);
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function toPin() {
    if (phone.replace(/\D/g, '').length < 10) return setError('Enter your full WhatsApp number');
    setError('');
    setStep('pin');
  }
  function chosen(p) {
    if (weak(p)) { setPin(''); return setError('That PIN is too easy to guess. Try another.'); }
    setError(''); setFirst(p); setPin(''); setStep('confirm');
  }
  async function finish(second) {
    if (second !== first) { setError('Those PINs did not match. Try again.'); setPin(''); setFirst(''); return setStep('pin'); }
    setBusy(true);
    setError('');
    try {
      await api('/api/public/signup', { method: 'POST', auth: false, body: { phone, pin: second, marketing_consent: offers, accepted_terms: true } });
      await login(phone, second);
    } catch (e) {
      setError(e.message); setPin(''); setFirst('');
      setStep(/number|account/i.test(e.message) ? 'phone' : 'pin');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="back" onClick={() => (step === 'phone' ? go('welcome') : setStep('phone'))}><ArrowLeft size={16} /> Back</button>
      {step === 'phone' && (
        <div className="stack">
          <h1 className="h1">Join <b>Jekaplay</b></h1>
          <p className="sub">Just your WhatsApp number and a 4-digit PIN. That’s it.</p>
          <input inputMode="tel" autoComplete="tel" autoFocus placeholder="Your WhatsApp number" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && toPin()} />
          <label className="check">
            <input type="checkbox" checked={offers} onChange={(e) => setOffers(e.target.checked)} />
            <span>Send me offers and rewards on WhatsApp (optional)</span>
          </label>
          {error && <div className="err">{error}</div>}
          <button className="btn big" onClick={toPin}>Continue</button>
          <p className="mu small" style={{ textAlign: 'center' }}>By continuing you agree to our <a href="#/terms">Terms</a> and <a href="#/privacy">Privacy Policy</a>.</p>
          <button className="link" onClick={() => go('login')}>I already have an account</button>
        </div>
      )}
      {step === 'pin' && (
        <>
          <h1 className="h1">Choose a <b>4-digit PIN</b></h1>
          <p className="sub">You’ll use it to log in. Keep it to yourself.</p>
          {error && <div className="err">{error}</div>}
          <PinPad length={4} value={pin} onChange={(v) => { setError(''); setPin(v); }} onDone={chosen} busy={busy} />
        </>
      )}
      {step === 'confirm' && (
        <>
          <h1 className="h1">Type it <b>once more</b></h1>
          <p className="sub">{busy ? 'Creating your account…' : 'Just to be sure it is right.'}</p>
          {error && <div className="err">{error}</div>}
          <PinPad length={4} value={pin} onChange={(v) => { setError(''); setPin(v); }} onDone={finish} busy={busy} />
        </>
      )}
    </>
  );
}

export function SetPin({ digits, onDone }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (next.length !== digits) return setError(`Your new PIN must be exactly ${digits} digits`);
    if (weak(next)) return setError('That PIN is too easy to guess');
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

  const only = (setter) => (e) => setter(e.target.value.replace(/\D/g, '').slice(0, 6));
  return (
    <form className="login" onSubmit={submit}>
      <h1 className="h1">Choose your <b>own PIN</b></h1>
      <p className="sub">You are using a temporary PIN. Pick a new {digits}-digit PIN that only you know.</p>
      <input type="password" inputMode="numeric" placeholder="Temporary PIN" value={cur} onChange={only(setCur)} />
      <input type="password" inputMode="numeric" placeholder={`New ${digits}-digit PIN`} value={next} onChange={only(setNext)} />
      <input type="password" inputMode="numeric" placeholder="Repeat new PIN" value={again} onChange={only(setAgain)} />
      {error && <div className="err">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save my PIN'}</button>
    </form>
  );
}
