import { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { api } from './api.js';

const naira = (kobo) => '₦' + (Number(kobo) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 });
const EMPTY = { id: null, name: '', category: '', price: '', description: '', is_active: true, recipe: [] };

export default function Menu({ onToast }) {
  const [items, setItems] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newIng, setNewIng] = useState(null);

  async function load() {
    try {
      const [a, b] = await Promise.all([api('/api/menu-admin/items'), api('/api/menu-admin/ingredients')]);
      setItems(a.items);
      setIngredients(b.ingredients.filter((i) => i.is_active));
      setError('');
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  const categories = [...new Set((items || []).map((i) => i.category).filter(Boolean))];

  function openEdit(it) {
    setFormError('');
    setForm({
      id: it.id,
      name: it.name,
      category: it.category || '',
      price: String(Number(it.base_price_kobo) / 100),
      description: it.description || '',
      is_active: it.is_active,
      recipe: it.recipe.map((r) => ({ ingredient_id: r.ingredient_id, qty: String(Number(r.qty_per_portion)) })),
    });
  }

  function setLine(idx, patch) {
    setForm((f) => ({ ...f, recipe: f.recipe.map((l, i) => (i === idx ? { ...l, ...patch } : l)) }));
  }

  async function toggle(it) {
    try {
      await api('/api/menu-admin/items/' + it.id, { method: 'PATCH', body: { is_active: !it.is_active } });
      onToast(it.name + (it.is_active ? ' switched off' : ' switched on'));
      await load();
    } catch (e) { onToast(e.message); }
  }

  async function save() {
    setFormError('');
    const priceKobo = Math.round(Number(form.price) * 100);
    if (form.name.trim().length < 2) return setFormError('Enter the dish name');
    if (!form.id && form.category.trim().length < 2) return setFormError('Choose or type a category');
    if (!Number.isFinite(priceKobo) || priceKobo < 0 || form.price === '') return setFormError('Enter the price in naira');
    const lines = form.recipe.filter((l) => l.ingredient_id);
    if (lines.some((l) => !(Number(l.qty) > 0))) return setFormError('Each ingredient needs an amount above zero');
    if (new Set(lines.map((l) => l.ingredient_id)).size !== lines.length) return setFormError('An ingredient is listed twice');
    const recipe = lines.map((l) => ({ ingredient_id: l.ingredient_id, qty_per_portion: Number(l.qty) }));
    setBusy(true);
    try {
      if (form.id) {
        await api('/api/menu-admin/items/' + form.id, {
          method: 'PATCH',
          body: { name: form.name.trim(), price_kobo: priceKobo, description: form.description.trim(), is_active: form.is_active },
        });
        await api('/api/menu-admin/items/' + form.id + '/recipe', { method: 'PUT', body: { lines: recipe } });
        onToast('Dish updated');
      } else {
        await api('/api/menu-admin/items', {
          method: 'POST',
          body: { name: form.name.trim(), category: form.category.trim(), price_kobo: priceKobo, description: form.description.trim() || null, recipe },
        });
        onToast('Dish added');
      }
      setForm(null);
      await load();
    } catch (e) { setFormError(e.message); } finally { setBusy(false); }
  }

  async function addIngredient() {
    setFormError('');
    try {
      const d = await api('/api/menu-admin/ingredients', { method: 'POST', body: { name: newIng.name.trim(), unit: newIng.unit.trim() } });
      setIngredients((list) => [...list, { ...d.ingredient, is_active: true }].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...f, recipe: [...f.recipe, { ingredient_id: d.ingredient.id, qty: '' }] }));
      setNewIng(null);
    } catch (e) { setFormError(e.message); }
  }

  const unitOf = (id) => ingredients.find((i) => i.id === id)?.unit || '';
  const groups = {};
  (items || []).forEach((it) => { (groups[it.category || 'Other'] ||= []).push(it); });

  return (
    <div>
      <div className="eyebrow">Menu</div>
      <h1 className="h1">Dishes and <b>recipes</b></h1>
      <p className="sub">Change prices, switch dishes off and set how much of each ingredient goes into one portion. The stock check uses these amounts.</p>
      <button className="btn" onClick={() => { setFormError(''); setForm({ ...EMPTY }); }}><Plus size={16} style={{ verticalAlign: -3 }} /> Add a dish</button>
      {error && <div className="err">{error}</div>}
      {!items && !error && <div className="center">Loading…</div>}

      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat}>
          <h2 className="group">{cat}</h2>
          {list.map((it) => (
            <div className={'card' + (it.is_active ? '' : ' late')} key={it.id}>
              <div className="row">
                <b>{it.name}</b>
                <span className={'badge' + (it.is_active ? ' go' : ' warn')}>{it.is_active ? 'On the menu' : 'Switched off'}</span>
              </div>
              <div className="row">
                <span className="big">{naira(it.base_price_kobo)}</span>
                <span className="mu">{it.recipe.length === 0 ? 'No recipe yet' : it.recipe.length + ' ingredient' + (it.recipe.length > 1 ? 's' : '')}</span>
              </div>
              <div className="seg" style={{ marginTop: 10 }}>
                <button onClick={() => openEdit(it)}>Edit</button>
                <button onClick={() => toggle(it)}>{it.is_active ? 'Switch off' : 'Switch on'}</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {form && (
        <div className="scrim" onClick={() => !busy && setForm(null)}>
          <div className="sheet" style={{ maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="row"><h2>{form.id ? 'Edit dish' : 'Add a dish'}</h2><button className="icon" onClick={() => setForm(null)}><X size={18} /></button></div>

            <label>Dish name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            {!form.id && (<>
              <label>Category</label>
              <input list="menu-cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Rice dishes" />
              <datalist id="menu-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </>)}

            <label>Price (₦)</label>
            <input type="number" inputMode="decimal" min="0" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

            <label>Description (optional)</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <h2 className="group">Recipe for one portion</h2>
            {form.recipe.length === 0 && <div className="mu">No ingredients yet. Add the ones this dish uses.</div>}
            {form.recipe.map((l, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <select value={l.ingredient_id} onChange={(e) => setLine(idx, { ingredient_id: e.target.value })}>
                  <option value="">Choose ingredient</option>
                  {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input type="number" inputMode="decimal" min="0" step="any" placeholder="Amount" value={l.qty} onChange={(e) => setLine(idx, { qty: e.target.value })} />
                <span className="mu">{unitOf(l.ingredient_id)}</span>
                <button className="icon" aria-label="Remove ingredient" onClick={() => setForm({ ...form, recipe: form.recipe.filter((_, i) => i !== idx) })}><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="seg" style={{ marginTop: 10 }}>
              <button disabled={form.recipe.length >= 20} onClick={() => setForm({ ...form, recipe: [...form.recipe, { ingredient_id: '', qty: '' }] })}>Add ingredient</button>
              <button onClick={() => setNewIng({ name: '', unit: '' })}>New ingredient</button>
            </div>

            {newIng && (
              <div className="card" style={{ marginTop: 10 }}>
                <label>Ingredient name</label>
                <input value={newIng.name} onChange={(e) => setNewIng({ ...newIng, name: e.target.value })} placeholder="e.g. Plantain" />
                <label>Unit</label>
                <input value={newIng.unit} onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })} placeholder="kg, litres, pieces" />
                <button className="btn" disabled={newIng.name.trim().length < 2 || !newIng.unit.trim()} onClick={addIngredient}>Save ingredient</button>
              </div>
            )}

            {formError && <div className="err">{formError}</div>}
            <button className="btn" style={{ marginTop: 12 }} disabled={busy} onClick={save}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add dish'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
