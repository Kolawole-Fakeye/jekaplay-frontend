import { ArrowLeft, Phone, Mail, MapPin, Clock, AtSign } from 'lucide-react';
import { company as c } from './config.js';

const J = c.restaurant.name;
const owner = c.restaurant.legalName || J;

export function LegalLinks() {
  return (
    <footer className="legal-links">
      <a href="#/terms">Terms</a><span>·</span><a href="#/privacy">Privacy</a><span>·</span><a href="#/contact">Contact us</a>
    </footer>
  );
}

function Sec({ n, title, children }) {
  return (
    <section className="legal-sec">
      <h2>{n}. {title}</h2>
      {children}
    </section>
  );
}

function Terms() {
  return (
    <>
      <div className="eyebrow">Legal</div>
      <h1 className="h1">Terms &amp; <b>Conditions</b></h1>
      <p className="mu">Last updated {c.termsUpdated}</p>

      <Sec n="1" title="Who we are">
        <ul>
          <li>This ordering app (the “App”) is owned and run by <b>{owner}</b> (“{J}”, “we”, “us”). The food, drinks and outlets you order from are also run by {J}.</li>
          <li>By creating an account or placing an order you agree to these Terms. If you do not agree, please do not use the App.</li>
        </ul>
      </Sec>

      <Sec n="2" title="Your account">
        <ul>
          <li>You must be 18 or older, or have a parent or guardian’s permission.</li>
          <li>Use a WhatsApp number that belongs to you, and keep your details correct.</li>
          <li>Your PIN is personal to you. Do not share it. Tell us straight away if you think someone else knows it.</li>
          <li>One account per person. We may suspend or close an account that is misused, used for fake or fraudulent orders, or created with false details.</li>
          <li>You can ask us to delete your account at any time (see section 10).</li>
        </ul>
      </Sec>

      <Sec n="3" title="What we are responsible for">
        <ul>
          <li>Preparing the food and drinks, and their quality, freshness and safety.</li>
          <li>The menu, prices, availability, offers, rewards and vouchers.</li>
          <li>Accepting, preparing and handing over your order at our outlets, and the conduct of our staff.</li>
          <li>Cancellations, replacements, refunds and complaints about your order.</li>
          <li>Allergen information.</li>
          <li>Running and securing the App, protecting your account and personal information, and helping with login, PIN and technical problems.</li>
        </ul>
        <p>If there is a problem with an order or the App, contact us using the <a href="#/contact">Contact us</a> page.</p>
      </Sec>

      <Sec n="4" title="Placing orders">
        <ul>
          <li>Your order is a request to buy. The outlet may decline it, for example if an item has run out. If that happens you will be told and you will not pay for that item.</li>
          <li>Prices are in Nigerian naira (₦) and are shown before you confirm. {J} may change prices, menus and availability at any time. Changes do not affect orders already placed.</li>
          <li>For pick-up and eat-in orders, please collect your order when it is ready. {J} may cancel an order that is not collected within a reasonable time.</li>
          <li>Delivery is only available where an outlet offers it, in approved areas, with the delivery fee shown at checkout.</li>
        </ul>
      </Sec>

      <Sec n="5" title="Payment">
        <ul>
          <li>Until online payment is switched on, you pay at the outlet when you collect your order.</li>
          <li>When online payment is available, it is handled by {J}’s licensed payment provider. We do not store your card details.</li>
          <li>You will get a receipt on WhatsApp or in the App.</li>
        </ul>
      </Sec>

      <Sec n="6" title="Offers, rewards and vouchers">
        <ul>
          <li>Offers such as the ₦1,000 meal with free beef are set by {J}. They apply while stocks last and may change or end.</li>
          <li>Reward points and vouchers have no cash value and cannot be transferred. {J} may set limits and expiry dates, and may withdraw rewards that were obtained through misuse.</li>
        </ul>
      </Sec>

      <Sec n="7" title="Cancellations, refunds and complaints">
        <ul>
          <li>Once the kitchen has started preparing an order it may not be possible to cancel it. Please speak to outlet staff straight away.</li>
          <li>If something is wrong, such as a missing item, the wrong order or a quality or safety problem, tell {J} {c.reportWindow}. {J} will decide on a replacement, correction or refund fairly and in line with consumer protection law. Your legal rights are not affected by these Terms.</li>
          <li>We may ask how your experience was. If you tell us it was not good, your message goes to {J}’s management so it can be dealt with quickly.</li>
        </ul>
      </Sec>

      <Sec n="8" title="Food safety and allergies">
        <p>Our kitchens handle common allergens. Please tell staff about any allergy before you order. {J} cannot guarantee that any item is free of allergens.</p>
      </Sec>

      <Sec n="9" title="Messages and WhatsApp">
        <ul>
          <li>We send you service messages about your order, such as confirmation, status updates and receipts.</li>
          <li>We send offers and rewards messages only if you agreed to them. You can stop them at any time by replying STOP or by contacting us.</li>
          <li>Your network or WhatsApp data charges may apply.</li>
        </ul>
      </Sec>

      <Sec n="10" title="Your information">
        <ul>
          <li>{J} uses your name, WhatsApp number, order history and preferences to run your account, process orders, send receipts, provide rewards, improve our service and prevent fraud. Your PIN is stored in a protected form that we cannot read.</li>
          <li>We handle personal information in line with the Nigeria Data Protection Act 2023. We do not sell your personal information. Our <a href="#/privacy">Privacy Policy</a> explains this in full.</li>
          <li>You can ask to see, correct or delete your information, or withdraw your consent, at any time through the <a href="#/contact">Contact us</a> page. We may need to keep some records where the law requires it.</li>
        </ul>
      </Sec>

      <Sec n="11" title="Acceptable use">
        <p>Do not place fake orders, abuse staff, try to access other people’s accounts, interfere with the App or its security, use bots, or resell offers.</p>
      </Sec>

      <Sec n="12" title="Ownership">
        <p>The App and its software, design, name, logo and menu belong to, or are licensed to, {J}. Please do not copy them without permission.</p>
      </Sec>

      <Sec n="13" title="Availability of the App">
        <p>We work to keep the App available, but we cannot promise it will never be interrupted. We may carry out maintenance, and we may change or remove features.</p>
      </Sec>

      <Sec n="14" title="Liability">
        <ul>
          <li>Nothing in these Terms limits any liability that cannot be limited by law, including your statutory consumer rights.</li>
          <li>{J} is responsible to you for the food, your orders and the App, as described in section 3.</li>
          <li>{J} is not responsible for loss caused by events beyond its reasonable control, such as network failures or power cuts, or for indirect losses.</li>
        </ul>
      </Sec>

      <Sec n="15" title="Changes to these Terms">
        <p>We may update these Terms. The “last updated” date above will change, and we will show important changes in the App. If you keep using the App after a change, you accept the updated Terms.</p>
      </Sec>

      <Sec n="16" title="Governing law">
        <p>These Terms are governed by the laws of the Federal Republic of Nigeria, and the courts of Lagos State will deal with any dispute. We encourage you to contact us first so we can try to put things right.</p>
      </Sec>

      <Sec n="17" title="Contact us">
        <p>See the <a href="#/contact">Contact us</a> page for how to reach {J} about your order, the App or your information.</p>
      </Sec>
    </>
  );
}


function Privacy() {
  return (
    <>
      <div className="eyebrow">Legal</div>
      <h1 className="h1">Privacy <b>Policy</b></h1>
      <p className="mu">Last updated {c.termsUpdated}</p>
      <p>This policy explains what personal information we collect when you use the Jekaplay app, why, and the choices you have. We follow the Nigeria Data Protection Act 2023.</p>

      <Sec n="1" title="Who is responsible for your information">
        <p><b>{owner}</b> (“{J}”) runs the app and is responsible for your information. We make sure it is protected and used properly.</p>
      </Sec>

      <Sec n="2" title="What we collect">
        <ul>
          <li>Your WhatsApp number, which is how you log in and how we reach you about your orders.</li>
          <li>Your PIN. It is stored only in a scrambled form, so nobody can read it.</li>
          <li>Your name and birthday, only if you choose to give them.</li>
          <li>Your orders, your chosen outlet, and your messaging choices.</li>
          <li>Technical details such as your device, browser, IP address and login times, to keep the app secure.</li>
          <li>Feedback or complaints you send us.</li>
          <li>When online payment is available, whether a payment succeeded. Card details are handled by the payment provider and are not stored by us.</li>
        </ul>
      </Sec>

      <Sec n="3" title="Why we use it">
        <ul>
          <li>To create and secure your account and to take and prepare your orders. This is needed to provide the service.</li>
          <li>To send service messages such as order updates and receipts.</li>
          <li>To send offers and rewards, only if you agree. You can say no and still use the app.</li>
          <li>To prevent fraud and misuse, keep the app safe, and improve our menu and service.</li>
          <li>To meet legal, accounting and tax duties.</li>
        </ul>
      </Sec>

      <Sec n="4" title="Who we share it with">
        <ul>
          <li>{J} outlet staff, who see your name and order so they can prepare and hand over your food.</li>
          <li>Service providers who help us run the app, such as hosting and database providers, messaging providers and, when it is switched on, the payment provider. They may only use your information to provide their service, and some may handle it outside Nigeria with appropriate safeguards.</li>
          <li>Authorities, where the law requires it.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Sec>

      <Sec n="5" title="How long we keep it">
        <p>We keep your account information while your account is open. If you delete your account, we erase your name, number and birthday. We keep order and payment records, no longer linked to you, for as long as accounting and tax rules require.</p>
      </Sec>

      <Sec n="6" title="Your rights">
        <ul>
          <li>You can ask to see, correct or delete your information, object to how we use it, or withdraw your consent at any time.</li>
          <li>You can delete your account yourself in the app: open the Account tab and choose “Delete my account”.</li>
          <li>You can stop offers and rewards messages by replying STOP or by contacting us.</li>
          <li>You can complain to the Nigeria Data Protection Commission if you think we have handled your information wrongly. We would like the chance to put things right first.</li>
        </ul>
      </Sec>

      <Sec n="7" title="Keeping your information safe">
        <p>Connections to the app are encrypted, PINs are stored in a protected form, and staff can only see what their job needs. No system is perfectly secure, so please keep your PIN private and tell us at once if you think your account has been misused.</p>
      </Sec>

      <Sec n="8" title="Children">
        <p>The app is for people aged 18 and over, or younger people using it with a parent or guardian’s permission. If you believe a child has given us information without permission, contact us and we will delete it.</p>
      </Sec>

      <Sec n="9" title="Changes to this policy">
        <p>We may update this policy. The “last updated” date will change and we will show important changes in the app.</p>
      </Sec>

      <Sec n="10" title="Contact us">
        <p>For any question or request about your information, use the <a href="#/contact">Contact us</a> page.</p>
      </Sec>
    </>
  );
}

function Line({ icon: Icon, label, href, children }) {
  const inner = (<><Icon size={18} /><span><span className="mu">{label}</span><br /><b>{children}</b></span></>);
  return href ? <a className="contact-line" href={href}>{inner}</a> : <div className="contact-line">{inner}</div>;
}

function Contact() {
  const r = c.restaurant;
  return (
    <>
      <div className="eyebrow">We are here to help</div>
      <h1 className="h1">Contact <b>us</b></h1>

      <div className="card">
        <h2>{J}: orders, food and outlets</h2>
        <p className="mu">For anything about your order, your meal, refunds, the app, your PIN or your information.</p>
        <Line icon={Phone} label="Call" href={`tel:${r.phoneIntl}`}>{r.phone}</Line>
        {r.email && <Line icon={Mail} label="Email" href={`mailto:${r.email}`}>{r.email}</Line>}
        {r.hours && <Line icon={Clock} label="Hours">{r.hours}</Line>}
        <Line icon={AtSign} label="Social media and website">{r.handle} · {r.website}</Line>
      </div>

      <div className="card">
        <h2>Our outlets</h2>
        {c.outlets.map((o) => <Line key={o.name} icon={MapPin} label={'Jekaplay ' + o.name}>{o.address || 'Ask at the outlet or call us'}</Line>)}
      </div>

      <p className="mu">Reporting a problem with an order? Tell {J} {c.reportWindow}, and have your order number ready.</p>
    </>
  );
}

export function LegalPage({ page, theme }) {
  const close = () => { window.location.hash = ''; };
  return (
    <div className="legal-overlay">
      <div className="legal">
        <button className="back" onClick={close}><ArrowLeft size={16} /> Back</button>
        <img className="legal-logo" src={theme === 'light' ? '/jekaplay-wordmark-black.png' : '/jekaplay-wordmark-green.png'} alt="Jekaplay" />
        {page === 'terms' ? <Terms /> : page === 'privacy' ? <Privacy /> : <Contact />}
        <div className="legal-switch">
          {page === 'contact' ? <a href="#/terms">Terms &amp; Conditions</a> : <a href="#/contact">Contact us</a>}
        </div>
      </div>
    </div>
  );
}
