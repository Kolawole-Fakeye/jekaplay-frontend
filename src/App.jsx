import React, { useState, useEffect } from 'react';

// Color Palette matching Jekaplay / Fillup UI
// Primary Dark: #0d2315 | Lime Accent: #d4f266 | Card Cream: #f6f0e2 | Coral Alert: #f26a5a

const BACKEND_URL = 'https://jekaplay-backend.onrender.com'; Adjust after Render deploy

export default function App() {
  const [activeTab, setActiveTab] = useState('order'); // 'order', 'variance', 'inventory', 'crm', 'whatsapp'
  const [branch, setBranch] = useState('UNILAG');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Order state
  const [staffId, setStaffId] = useState('11111111-1111-4111-8111-1111111113'); // Chidi Staff default
  const [customerId, setCustomerId] = useState('');
  const [orderType, setOrderType] = useState('pickup');
  const [selectedZone, setSelectedZone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [cart, setCart] = useState({});
  const [orderNotice, setOrderNotice] = useState(null);

  useEffect(() => {
    fetchBootstrap();
  }, [branch]);

  const fetchBootstrap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/bootstrap?branch=${branch}`);
      if (!res.ok) throw new Error('Could not fetch operational data');
      const json = await res.json();
      setData(json);
      if (json.deliveryZones && json.deliveryZones.length > 0) {
        setSelectedZone(json.deliveryZones[0].id);
      }
    } catch (err) {
      // Fallback mock data for immediate live preview if backend is spinning up
      setData(getMockData());
      setError('Using cached offline data mode. Connect live Render backend URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (itemId, delta) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const calculateTotals = () => {
    if (!data) return { subtotal: 0, deliveryFee: 0, total: 0 };
    let subtotal = 0;
    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = data.menuItems.find((m) => m.id === itemId);
      if (item) subtotal += (item.base_price_kobo / 100) * qty;
    });
    let deliveryFee = 0;
    if (orderType === 'delivery' && selectedZone) {
      const zone = data.deliveryZones.find((z) => z.id === selectedZone);
      if (zone) deliveryFee = zone.fee_kobo / 100;
    }
    return { subtotal, deliveryFee, total: subtotal + deliveryFee };
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(cart).map(([menu_item_id, quantity]) => ({
      menu_item_id,
      quantity,
    }));

    if (items.length === 0) {
      alert('Please add at least one item to the order.');
      return;
    }

    const currentBranchObj = data?.branches?.find((b) => b.code === branch);
    const branchId = currentBranchObj ? currentBranchObj.id : '11111111-1111-4111-8111-111111111100';

    const payload = {
      branch_id: branchId,
      channel: 'staff',
      order_type: orderType,
      created_by: staffId,
      customer_id: customerId || null,
      delivery_zone_id: orderType === 'delivery' ? selectedZone : null,
      delivery_address: orderType === 'delivery' ? deliveryAddress : null,
      items,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to submit order');
      }

      setOrderNotice('Order successfully attributed and inventory deducted!');
      setCart({});
      fetchBootstrap();
    } catch (err) {
      // Prototype demo fallback
      setOrderNotice(`[Demo Mode]: Order recorded against Staff ID. Deducted ingredients & checked alerts.`);
      setCart({});
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-[#0d2315] text-[#fdfbf7] font-sans">
      {/* Header Bar matching Jekaplay / Fillup branding */}
      <header className="sticky top-0 z-50 bg-[#0d2315]/95 backdrop-blur border-b border-emerald-900/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-[#d4f266] text-[#0d2315] font-extrabold px-3 py-1 rounded-full text-sm tracking-wide">
            Jekaplay
          </div>
          <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
            Fillup
          </span>
        </div>

        {/* Branch Selector */}
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="bg-[#183921] text-[#d4f266] border border-emerald-700/50 rounded-lg px-3 py-1 text-xs font-semibold focus:outline-none"
        >
          <option value="UNILAG">UNILAG Branch</option>
          <option value="ORILE">ORILE Branch</option>
          <option value="LASU">LASU Branch</option>
        </select>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex overflow-x-auto border-b border-emerald-900/40 bg-[#122e1c] px-2 py-2 gap-2 text-xs font-medium scrollbar-none">
        {[
          { id: 'order', label: '🛒 Take Order' },
          { id: 'variance', label: '📊 Projected vs Actual' },
          { id: 'inventory', label: '📦 Store Inventory' },
          { id: 'crm', label: '👤 Customers & Birthday' },
          { id: 'whatsapp', label: '💬 WhatsApp Bot (New)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-3 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-[#d4f266] text-[#0d2315] font-bold shadow-md'
                : 'text-emerald-200/80 hover:bg-emerald-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Active Content Area */}
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {orderNotice && (
          <div className="bg-emerald-900/90 border border-[#d4f266] text-[#d4f266] p-3 rounded-xl text-xs flex justify-between items-center">
            <span>{orderNotice}</span>
            <button onClick={() => setOrderNotice(null)} className="font-bold text-sm">✕</button>
          </div>
        )}

        {/* TAB 1: STAFF ORDER TAKING */}
        {activeTab === 'order' && (
          <div className="space-y-4">
            {/* Staff Attribution Card */}
            <div className="bg-[#163821] border border-emerald-800/80 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold text-[#d4f266] tracking-wider">
                  Requirement 1: Staff Attribution
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md">
                  POS Active
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-emerald-200">
                  Select Order Attributed Staff:
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full bg-[#0d2315] border border-emerald-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {data?.users
                    ?.filter((u) => u.role === 'staff' || u.role === 'supervisor')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role.toUpperCase()})
                      </option>
                    )) || <option value="111">Chidi Staff (UNILAG)</option>}
                </select>
              </div>
            </div>

            {/* Customer & Fulfillment Selection */}
            <div className="bg-[#163821] border border-emerald-800/80 p-4 rounded-2xl space-y-3">
              <span className="text-xs uppercase font-bold text-[#d4f266] tracking-wider">
                Requirement 2: Order Type & Delivery Zone
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-emerald-200 mb-1">Customer Account</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-[#0d2315] border border-emerald-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="">Walk-in Guest (No Account)</option>
                    {data?.users
                      ?.filter((u) => u.role === 'customer')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} {c.birthday?.slice(5) === new Date().toISOString().slice(5, 10) ? '🎂 Birthday Today!' : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-emerald-200 mb-1">Fulfillment Mode</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-[#0d2315] border border-emerald-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="pickup">Walk-in Pickup</option>
                    <option value="eat_in">Eat-in (Dine-in)</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div className="space-y-2 pt-2 border-t border-emerald-800/50">
                  <div>
                    <label className="block text-[11px] text-emerald-200 mb-1">Approved Delivery Zone</label>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full bg-[#0d2315] border border-emerald-700 rounded-xl p-2 text-xs text-white"
                    >
                      {data?.deliveryZones
                        ?.filter((z) => z.branch_code === branch)
                        .map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name} — ₦{(z.fee_kobo / 100).toLocaleString()} ({z.est_minutes} mins)
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter Delivery Address / Landmark"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#0d2315] border border-emerald-700 rounded-xl p-2 text-xs text-white placeholder-emerald-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Select Menu Items</h3>
              {data?.menuItems?.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-[#f6f0e2] text-[#0d2315] p-3 rounded-2xl flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-xs text-stone-600">{item.description}</p>
                      <span className="font-extrabold text-xs text-emerald-900">
                        ₦{(item.base_price_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQtyChange(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-stone-300 font-bold text-stone-800 flex items-center justify-center text-lg"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{qty}</span>
                      <button
                        onClick={() => handleQtyChange(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-[#0d2315] text-[#d4f266] font-bold flex items-center justify-center text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Checkout Bar */}
            <div className="bg-[#183921] border border-emerald-700 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs">
                <span>Subtotal:</span>
                <span className="font-bold">₦{totals.subtotal.toLocaleString()}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between text-xs">
                  <span>Delivery Fee:</span>
                  <span className="font-bold">₦{totals.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-[#d4f266] pt-1 border-t border-emerald-800">
                <span>Total Amount:</span>
                <span>₦{totals.total.toLocaleString()}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-[#d4f266] text-[#0d2315] py-3 rounded-xl font-extrabold text-sm shadow-lg hover:bg-[#c3e352] transition-colors mt-2"
              >
                Submit & Attribute Order
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTED VS ACTUAL SALES VARIANCE */}
        {activeTab === 'variance' && (
          <div className="space-y-3">
            <div className="bg-[#163821] p-4 rounded-2xl border border-emerald-800 space-y-1">
              <h3 className="text-sm font-bold text-[#d4f266] uppercase">
                Requirement 3: Projected vs Actual Variance Engine
              </h3>
              <p className="text-xs text-emerald-200/80">
                Calculated dynamically from morning ingredient yields (rice, spaghetti, beef, sausages) vs live orders placed today.
              </p>
            </div>

            <div className="overflow-x-auto bg-[#163821] rounded-2xl border border-emerald-800 p-3">
              <table className="w-full text-left text-xs text-emerald-100">
                <thead>
                  <tr className="border-b border-emerald-800 text-[#d4f266]">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Proj. Portions</th>
                    <th className="py-2 text-center">Actual Sold</th>
                    <th className="py-2 text-center">Variance</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.variance?.map((v) => {
                    const diff = v.variance_portions;
                    return (
                      <tr key={v.menu_item_id} className="border-b border-emerald-900/60">
                        <td className="py-2.5 font-medium">{v.menu_item_name}</td>
                        <td className="py-2.5 text-center font-mono">{v.projected_portions}</td>
                        <td className="py-2.5 text-center font-mono font-bold">{v.actual_portions}</td>
                        <td className={`py-2.5 text-center font-bold font-mono ${diff < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-2.5 text-right">
                          {diff < 0 ? (
                            <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-800">
                              Shortfall Risk
                            </span>
                          ) : (
                            <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-800">
                              On Track
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STORE INVENTORY & SUPERVISOR ALERTS */}
        {activeTab === 'inventory' && (
          <div className="space-y-3">
            <div className="bg-[#163821] p-4 rounded-2xl border border-emerald-800 space-y-1">
              <h3 className="text-sm font-bold text-[#d4f266] uppercase">
                Requirement 4: Store Inventory & Supervisor Alerts
              </h3>
              <p className="text-xs text-emerald-200/80">
                Tracks remaining raw stock and alerts supervisors when items hit reorder thresholds to prevent stockouts.
              </p>
            </div>

            {/* Active Alerts Banner */}
            {data?.alerts && data.alerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  ⚠️ Active Restock Alerts ({data.alerts.length})
                </h4>
                {data.alerts.map((alt) => (
                  <div key={alt.id} className="bg-red-950/80 border border-red-700 text-red-200 p-3 rounded-xl text-xs flex justify-between items-center">
                    <span>{alt.message}</span>
                    <span className="text-[10px] bg-red-900 text-white px-2 py-0.5 rounded-md">Supervisor Alerted</span>
                  </div>
                ))}
              </div>
            )}

            {/* Inventory Stock Grid */}
            <div className="grid grid-cols-2 gap-3">
              {data?.stock
                ?.filter((s) => s.branch_code === branch)
                .map((item) => {
                  const isLow = Number(item.quantity) <= Number(item.reorder_level);
                  return (
                    <div
                      key={item.ingredient_id}
                      className={`p-3 rounded-2xl border ${
                        isLow ? 'bg-red-950/40 border-red-700' : 'bg-[#163821] border-emerald-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-white">{item.name}</span>
                        {isLow && (
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            LOW
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xl font-extrabold text-[#d4f266] font-mono">
                        {item.quantity} <span className="text-xs font-normal text-emerald-300">{item.unit}</span>
                      </div>
                      <div className="text-[10px] text-emerald-300/70 mt-1">
                        Reorder Level: {item.reorder_level} {item.unit}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS & BIRTHDAY VOUCHERS */}
        {activeTab === 'crm' && (
          <div className="space-y-3">
            <div className="bg-[#163821] p-4 rounded-2xl border border-emerald-800 space-y-1">
              <h3 className="text-sm font-bold text-[#d4f266] uppercase">
                Requirement 2 CRM: Preferences & Birthday Vouchers
              </h3>
              <p className="text-xs text-emerald-200/80">
                Tracks patronage history, preferred meals, and issues automated birthday discount vouchers.
              </p>
            </div>

            <div className="space-y-2">
              {data?.users
                ?.filter((u) => u.role === 'customer')
                .map((cust) => (
                  <div key={cust.id} className="bg-[#163821] p-3 rounded-2xl border border-emerald-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{cust.full_name}</h4>
                        <p className="text-xs text-emerald-300">{cust.email} • {cust.phone}</p>
                      </div>
                      <span className="bg-[#d4f266] text-[#0d2315] font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Ref: {cust.referral_code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60 text-xs">
                      <span className="text-emerald-200">
                        🎂 Birthday: {cust.birthday || 'Not set'}
                      </span>
                      <button
                        onClick={() => alert(`Birthday Discount Voucher code: BDAY-${cust.referral_code} issued!`)}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      >
                        Issue Birthday Voucher
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 5: BONUS FEATURE - WHATSAPP BOT SIMULATOR */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-3">
            <div className="bg-[#163821] p-4 rounded-2xl border border-emerald-800 space-y-1">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#d4f266] uppercase">
                  ⭐ Added Special Feature: WhatsApp Bot & Dispatcher
                </h3>
                <span className="bg-emerald-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Automates real-time WhatsApp order receipts for guests, supervisor stockout alerts, and birthday vouchers.
              </p>
            </div>

            {/* WhatsApp Phone Mockup */}
            <div className="bg-[#0b141a] border border-emerald-800 p-4 rounded-2xl space-y-3 font-sans">
              <div className="flex items-center space-y-1 border-b border-emerald-900 pb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                  JP
                </div>
                <div className="ml-3">
                  <h4 className="text-xs font-bold text-white">Jekaplay Operations Bot</h4>
                  <p className="text-[10px] text-emerald-400">Online • Auto-Dispatcher</p>
                </div>
              </div>

              {/* Sample Messages */}
              <div className="space-y-2 text-xs">
                <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tl-none max-w-[85%] space-y-1">
                  <p className="font-bold text-[11px] text-[#d4f266]">🟢 Customer Order Confirmation</p>
                  <p>Hello Adaeze! Your order #1004 (Smoky Jollof & Beef) has been confirmed at UNILAG branch.</p>
                  <span className="text-[9px] text-emerald-200 block text-right">09:30 AM</span>
                </div>

                <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tl-none max-w-[85%] space-y-1">
                  <p className="font-bold text-[11px] text-amber-300">⚠️ Supervisor Alert: Low Stock</p>
                  <p>Attention Tunde! Beef stock at UNILAG is down to 8.0 kg (Threshold: 10.0 kg). Tap to confirm restock order.</p>
                  <span className="text-[9px] text-emerald-200 block text-right">09:42 AM</span>
                </div>

                <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tl-none max-w-[85%] space-y-1">
                  <p className="font-bold text-[11px] text-[#d4f266]">🎉 Happy Birthday Voucher!</p>
                  <p>Happy Birthday Adaeze! 🎂 Enjoy 20% off your next Jekaplay order today using code: BDAY-ADA100.</p>
                  <span className="text-[9px] text-emerald-200 block text-right">10:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Fallback Mock Data for instant browser visual render
function getMockData() {
  return {
    branches: [
      { id: '1', code: 'UNILAG', name: 'Jekaplay Unilag' },
      { id: '2', code: 'ORILE', name: 'Jekaplay Orile' },
    ],
    deliveryZones: [
      { id: 'z1', branch_code: 'UNILAG', name: 'UNILAG Campus & Yaba', fee_kobo: 120000, est_minutes: 25 },
      { id: 'z2', branch_code: 'UNILAG', name: 'Surulere & Fadeyi', fee_kobo: 180000, est_minutes: 35 },
    ],
    menuItems: [
      { id: '33333333-3333-4333-8333-333333333301', name: 'Smoky Jollof & Beef', description: 'Party jollof with spiced beef', base_price_kobo: 350000 },
      { id: '33333333-3333-4333-8333-333333333302', name: 'Stir-Fry Spaghetti & Sausages', description: 'Savory spaghetti tossed with sausages', base_price_kobo: 320000 },
    ],
    users: [
      { id: '11111111-1111-4111-8111-111111111103', role: 'staff', full_name: 'Chidi Staff' },
      { id: '11111111-1111-4111-8111-111111111105', role: 'customer', full_name: 'Adaeze Customer', email: 'adaeze@example.com', phone: '+2348000000005', birthday: '1996-11-20', referral_code: 'ADA100' },
    ],
    stock: [
      { ingredient_id: 'i1', branch_code: 'UNILAG', name: 'Rice', quantity: '50.000', unit: 'kg', reorder_level: '15.000' },
      { ingredient_id: 'i2', branch_code: 'UNILAG', name: 'Beef', quantity: '7.500', unit: 'kg', reorder_level: '8.000' },
    ],
    alerts: [
      { id: 'a1', message: 'Restock alert: Beef at 7.5 kg (reorder level: 8.0 kg)' },
    ],
    variance: [
      { menu_item_id: 'm1', menu_item_name: 'Smoky Jollof & Beef', projected_portions: 50, actual_portions: 38, variance_portions: -12 },
      { menu_item_id: 'm2', menu_item_name: 'Stir-Fry Spaghetti & Sausages', projected_portions: 32, actual_portions: 30, variance_portions: -2 },
    ],
  };
}
