import { useState } from 'react'
import { Plus, X, AlertTriangle, CheckCircle } from 'lucide-react'
import useAppStore from '../store/useAppStore'

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date(new Date().toDateString())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function statusColor(days) {
  if (days <= 0)  return { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' }
  if (days <= 2)  return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' }
  if (days <= 5)  return { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' }
  return           { bg: 'bg-white',           border: 'border-gray-100',   text: 'text-gray-500',   badge: 'bg-gray-100 text-gray-600' }
}

function expiryLabel(days) {
  if (days <= 0)  return 'Expired'
  if (days === 1) return 'Tomorrow'
  if (days <= 5)  return `${days} days`
  return new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ExpiringFoods() {
  const { pantry, addPantryItem, removePantryItem } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', expiresOn: '', quantity: '', unit: 'item' })

  const sorted = [...pantry].sort((a, b) => new Date(a.expiresOn) - new Date(b.expiresOn))
  const expiringSoon = sorted.filter(i => daysUntil(i.expiresOn) <= 3)
  const good = sorted.filter(i => daysUntil(i.expiresOn) > 3)

  function handleAdd() {
    if (!form.name || !form.expiresOn) return
    addPantryItem({ ...form, quantity: Number(form.quantity) || 1 })
    setForm({ name: '', expiresOn: '', quantity: '', unit: 'item' })
    setShowForm(false)
  }

  return (
    <div className="pb-28">
      <div className="bg-brand-600 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Pantry</h1>
        <p className="text-brand-100 text-sm mt-0.5">Track expiring foods</p>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {expiringSoon.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-semibold text-gray-700 text-sm">Use Soon</h2>
            </div>
            <div className="space-y-2">
              {expiringSoon.map(item => <PantryItem key={item.id} item={item} onRemove={removePantryItem} />)}
            </div>
          </div>
        )}

        {good.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-brand-500" />
              <h2 className="font-semibold text-gray-700 text-sm">Good to Go</h2>
            </div>
            <div className="space-y-2">
              {good.map(item => <PantryItem key={item.id} item={item} onRemove={removePantryItem} />)}
            </div>
          </div>
        )}

        {pantry.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No items yet. Add pantry items to track expiry.</p>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            <Plus size={20} /> Add Item
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">New Pantry Item</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input placeholder="Item name" className="input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expires On</label>
                <input type="date" className="input" value={form.expiresOn}
                  onChange={e => setForm(p => ({ ...p, expiresOn: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                <div className="flex gap-1">
                  <input type="number" placeholder="1" className="input w-16" value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                  <input placeholder="cups" className="input flex-1" value={form.unit}
                    onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
                </div>
              </div>
            </div>
            <button onClick={handleAdd} className="w-full bg-brand-600 text-white font-semibold py-3 rounded-2xl">
              Add to Pantry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PantryItem({ item, onRemove }) {
  const days = daysUntil(item.expiresOn)
  const c = statusColor(days)
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div>
        <p className="font-medium text-gray-800 text-sm">{item.name}</p>
        <p className="text-xs text-gray-400">{item.quantity} {item.unit}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
          {expiryLabel(days)}
        </span>
        <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-gray-500">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
