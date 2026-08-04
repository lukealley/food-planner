import { useState, useRef } from 'react'
import {
  Wallet, ChevronLeft, ChevronRight, Upload, Trash2, Plus,
  ChevronDown, ChevronUp, Settings, X, Check,
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'

// ─── Wells Fargo CSV parser ────────────────────────────────────────────────────

function parseCSVLine(line) {
  const cols = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQ = !inQ }
    else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
    else cur += c
  }
  cols.push(cur.trim())
  return cols
}

function parseWellsFargoCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  const txns = []

  for (const line of lines) {
    // Skip header row
    if (/^"?date"?/i.test(line.trim())) continue
    const cols = parseCSVLine(line)
    if (cols.length < 5) continue

    const [rawDate, rawAmount, , , rawDesc] = cols
    const amount = parseFloat(rawAmount)
    if (isNaN(amount) || !rawDate) continue

    // MM/DD/YYYY → YYYY-MM-DD
    const parts = rawDate.split('/')
    if (parts.length !== 3) continue
    const [m, d, y] = parts
    const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`

    const description = rawDesc.replace(/\s+/g, ' ').trim()
    // Stable dedup key
    const id = `${date}|${amount}|${description}`.replace(/\s/g, '_')

    txns.push({ id, date, description, amount: Math.abs(amount), isCredit: amount > 0, categoryId: null, source: 'csv' })
  }
  return txns
}

// ─── Auto-categorise by keyword ────────────────────────────────────────────────

const KEYWORD_MAP = {
  'Groceries':     ['SAFEWAY', 'KROGER', 'KING SOOPERS', 'COSTCO', 'WALMART', 'WHOLE FOODS', 'TRADER JOE', 'SPROUTS', 'ALBERTSONS', 'SMITHS', 'WINCO', 'ALDI', 'NATURAL GROCERS', 'GROCERY'],
  'Dining Out':    ['MCDONALD', 'STARBUCKS', 'CHIPOTLE', 'SUBWAY', 'DOMINO', 'PIZZA', 'BURGER', 'TACO', 'WENDY', 'CHICK-FIL', 'PANERA', 'DOORDASH', 'GRUBHUB', 'UBER EATS', 'RESTAURANT', 'CAFE ', 'DINER', 'SUSHI', 'PANDA', 'SONIC ', 'CULVER', 'IN-N-OUT', 'FIVE GUYS', 'JIMMY JOHN'],
  'Gas':           ['SHELL', 'CHEVRON', 'EXXON', 'BP GAS', 'CONOCO', 'SINCLAIR', 'CIRCLE K', '76 GAS', 'FUEL', 'PILOT TRAVEL', 'LOVES TRAVEL', 'MAVERICK'],
  'Entertainment': ['NETFLIX', 'SPOTIFY', 'HULU', 'DISNEY', 'AMC THEATRE', 'REGAL', 'MOVIE', 'STEAM ', 'NINTENDO', 'TICKETMASTER', 'APPLE.COM/BILL', 'YOUTUBE', 'PRIME VIDEO', 'HBO', 'PLAYSTATION'],
  'Shopping':      ['AMAZON', 'EBAY', 'ETSY', 'NORDSTROM', 'MACYS', 'GAP ', 'OLD NAVY', 'TJ MAXX', 'ROSS ', 'MARSHALLS', 'HOME DEPOT', 'LOWES', 'IKEA', 'BED BATH', 'DICK\'S SPORT', 'BEST BUY', 'APPLE STORE'],
  'Bills & Utils': ['COMCAST', 'XFINITY', 'AT&T', 'VERIZON', 'T-MOBILE', 'XCEL ENERGY', 'CENTURYLINK', 'DISH NETWORK', 'DIRECTV', 'INSURANCE', 'ELECTRIC', 'ALLSTATE', 'PROGRESSIVE', 'GEICO', 'STATE FARM'],
  'Healthcare':    ['WALGREENS', 'CVS PHARMACY', 'RITE AID', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'DENTAL', 'URGENT CARE', 'OPTOMETRIST', 'KAISER'],
}

function autoCategorize(description, categories) {
  const upper = description.toUpperCase()
  for (const [catName, words] of Object.entries(KEYWORD_MAP)) {
    if (words.some(w => upper.includes(w))) {
      const cat = categories.find(c => c.name === catName)
      if (cat) return cat.id
    }
  }
  const other = categories.find(c => c.name === 'Other')
  return other?.id ?? null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtCents(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Category settings modal ──────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🛒','🍽️','⛽','🎬','🛍️','💡','🏥','📦','🏠','✈️','🐾','🎓','💪','🎁','📱','🚗','👕','🍺','☕','💄','🧴','🔧','🌿','🎵']

function CategorySheet({ categories, onClose, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null) // category id being edited
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ name: '', limit: '', color: '#6b7280', emoji: '📦' })

  function startEdit(cat) {
    setEditing(cat.id)
    setForm({ name: cat.name, limit: String(cat.limit), color: cat.color, emoji: cat.emoji })
    setAdding(false)
  }

  function saveEdit() {
    if (!form.name.trim() || !form.limit) return
    onUpdate(editing, { name: form.name.trim(), limit: Number(form.limit), color: form.color, emoji: form.emoji })
    setEditing(null)
  }

  function saveAdd() {
    if (!form.name.trim() || !form.limit) return
    onAdd({ name: form.name.trim(), limit: Number(form.limit), color: form.color, emoji: form.emoji })
    setAdding(false)
    setForm({ name: '', limit: '', color: '#6b7280', emoji: '📦' })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="mt-auto bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Manage Categories</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-4 py-3 space-y-2">
          {categories.map(cat => (
            <div key={cat.id}>
              {editing === cat.id ? (
                <CategoryForm form={form} setForm={setForm} onSave={saveEdit} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <span className="text-xl w-7 text-center">{cat.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-400">{fmt(cat.limit)} / mo</p>
                  </div>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                  <button onClick={() => startEdit(cat)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Edit</button>
                  <button onClick={() => onDelete(cat.id)} className="text-gray-200 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}

          {adding ? (
            <CategoryForm form={form} setForm={setForm} onSave={saveAdd} onCancel={() => setAdding(false)} isNew />
          ) : (
            <button
              onClick={() => { setAdding(true); setEditing(null); setForm({ name: '', limit: '', color: '#22c55e', emoji: '📦' }) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-emerald-600 border-2 border-dashed border-emerald-200 hover:border-emerald-400 transition-colors"
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
        <div className="h-6" />
      </div>
    </div>
  )
}

function CategoryForm({ form, setForm, onSave, onCancel, isNew }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Category name"
          className="input flex-1 text-sm"
        />
        <input
          type="number"
          value={form.limit}
          onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
          placeholder="$/mo"
          className="input w-20 text-sm text-center"
        />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">Emoji</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_OPTIONS.map(em => (
            <button
              key={em}
              onClick={() => setForm(f => ({ ...f, emoji: em }))}
              className="text-lg rounded-lg p-1 transition-colors"
              style={{ background: form.emoji === em ? '#e5e7eb' : 'transparent' }}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">Color</p>
        <div className="flex gap-2 flex-wrap">
          {['#22c55e','#f97316','#3b82f6','#8b5cf6','#ec4899','#6366f1','#ef4444','#f59e0b','#6b7280','#14b8a6','#0ea5e9','#a855f7'].map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-6 h-6 rounded-full transition-transform"
              style={{ background: c, transform: form.color === c ? 'scale(1.25)' : 'scale(1)', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500">
          <Check size={14} /> {isNew ? 'Add' : 'Save'}
        </button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main Budget page ─────────────────────────────────────────────────────────

export default function Budget() {
  const {
    activeUser,
    budget,
    importTransactions,
    deleteTransaction,
    categorizeTransaction,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
  } = useAppStore()

  const t = themes[activeUser]
  const { categories, transactions } = budget

  const [viewMonth, setViewMonth]   = useState(currentMonthYM)
  const [showSettings, setShowSettings] = useState(false)
  const [txnExpanded, setTxnExpanded]   = useState(true)
  const [showCredits, setShowCredits]   = useState(false)
  const [uploadMsg, setUploadMsg]       = useState('')
  const fileRef = useRef()

  const isCurrentMonth = viewMonth === currentMonthYM()

  // Transactions for this month (debits only unless showCredits)
  const monthTxns = transactions
    .filter(t => t.date.startsWith(viewMonth) && (showCredits || !t.isCredit))
    .sort((a, b) => b.date.localeCompare(a.date))

  // Spend per category
  const spendMap = {}
  monthTxns.filter(t => !t.isCredit).forEach(t => {
    if (t.categoryId) spendMap[t.categoryId] = (spendMap[t.categoryId] || 0) + t.amount
  })

  const totalBudget = categories.reduce((s, c) => s + c.limit, 0)
  const totalSpent  = Object.values(spendMap).reduce((s, v) => s + v, 0)
  const uncategorizedTxns = monthTxns.filter(t => !t.isCredit && !t.categoryId)

  function handleCSV(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = parseWellsFargoCSV(e.target.result)
        // Auto-categorize
        const withCats = parsed.map(t => ({ ...t, categoryId: autoCategorize(t.description, categories) }))
        importTransactions(withCats)
        const newCount = withCats.length
        setUploadMsg(`Imported ${newCount} transaction${newCount !== 1 ? 's' : ''}`)
        setTimeout(() => setUploadMsg(''), 4000)
      } catch {
        setUploadMsg('Could not parse file. Make sure it\'s a Wells Fargo CSV export.')
        setTimeout(() => setUploadMsg(''), 5000)
      }
    }
    reader.readAsText(file)
    fileRef.current.value = ''
  }

  const overBudget = totalSpent > totalBudget
  const pct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0

  // Group transactions by date for display
  const byDate = {}
  monthTxns.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = []
    byDate[t.date].push(t)
  })
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: t.headerBg }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={22} style={{ color: t.headerText }} />
            <h1 className="text-2xl font-bold" style={{ color: t.headerText }}>Family Budget</h1>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ color: t.headerText }} className="p-1 opacity-70 hover:opacity-100">
            <Settings size={20} />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMonth(prevMonth)}
            className="p-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: t.headerText }}
          >
            <ChevronLeft size={16} />
          </button>
          <span
            className="flex-1 text-center text-sm font-semibold py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: t.headerText }}
          >
            {monthLabel(viewMonth)}
          </span>
          <button
            onClick={() => setViewMonth(nextMonth)}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.15)', color: t.headerText }}
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setViewMonth(currentMonthYM())}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
              style={{ background: t.accent, color: t.headerBg }}
            >
              Now
            </button>
          )}
        </div>

        {/* Upload row */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', color: t.headerText }}
          >
            <Upload size={15} /> Upload WF CSV
          </button>
          {uploadMsg && (
            <span className="text-xs font-medium" style={{ color: t.headerText, opacity: 0.85 }}>
              {uploadMsg}
            </span>
          )}
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files[0] && handleCSV(e.target.files[0])} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4" style={{ backgroundColor: activeUser === 'hers' ? '#fdf8f5' : '#f9fafb', minHeight: '100vh' }}>

        {/* ── Total overview ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-baseline mb-3">
            <span className="font-semibold text-gray-800">Monthly Total</span>
            <span className="text-sm" style={{ color: overBudget ? '#ef4444' : '#6b7280' }}>
              {fmt(totalBudget)} budget
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: overBudget ? '#ef4444' : '#111827' }}>
              {fmt(totalSpent)}
            </span>
            <span className="text-sm text-gray-400">spent</span>
            {totalBudget > 0 && (
              <span className="text-sm ml-auto font-semibold" style={{ color: overBudget ? '#ef4444' : '#22c55e' }}>
                {overBudget ? `${fmt(totalSpent - totalBudget)} over` : `${fmt(totalBudget - totalSpent)} left`}
              </span>
            )}
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct * 100}%`, background: overBudget ? '#ef4444' : t.accent || '#22c55e' }}
            />
          </div>
          {uncategorizedTxns.length > 0 && (
            <p className="text-xs text-amber-500 mt-2">
              ⚠ {uncategorizedTxns.length} uncategorized transaction{uncategorizedTxns.length !== 1 ? 's' : ''} not included in total
            </p>
          )}
        </div>

        {/* ── Category breakdown ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">By Category</h2>
          {categories.map(cat => {
            const spent = spendMap[cat.id] || 0
            const catPct = cat.limit > 0 ? Math.min(spent / cat.limit, 1) : 0
            const over = spent > cat.limit
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: over ? '#ef4444' : '#6b7280' }}>
                    {fmtCents(spent)} <span className="font-normal text-gray-300">/ {fmt(cat.limit)}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${catPct * 100}%`, background: over ? '#ef4444' : cat.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Transactions ── */}
        <div className="bg-white rounded-2xl shadow-sm">
          <button
            onClick={() => setTxnExpanded(v => !v)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">Transactions</span>
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
                {monthTxns.filter(t => !t.isCredit).length}
              </span>
              {uncategorizedTxns.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-600 rounded-full px-2 py-0.5 font-medium">
                  {uncategorizedTxns.length} uncategorized
                </span>
              )}
            </div>
            {txnExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {txnExpanded && (
            <div className="px-4 pb-4 space-y-1">
              {/* Show credits toggle */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50">
                <span className="text-xs text-gray-400">Showing expenses only</span>
                <button
                  onClick={() => setShowCredits(v => !v)}
                  className="text-xs font-medium"
                  style={{ color: showCredits ? t.accent : '#9ca3af' }}
                >
                  {showCredits ? 'Hide' : 'Show'} credits
                </button>
              </div>

              {monthTxns.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">No transactions for this month.</p>
                  <p className="text-gray-300 text-xs mt-1">Upload a Wells Fargo CSV to get started.</p>
                </div>
              ) : (
                sortedDates.map(date => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1">
                      {formatDate(date)}
                    </p>
                    {byDate[date].map(txn => (
                      <TransactionRow
                        key={txn.id}
                        txn={txn}
                        categories={categories}
                        onCategorize={categorizeTransaction}
                        onDelete={deleteTransaction}
                        accent={t.accent}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <CategorySheet
          categories={categories}
          onClose={() => setShowSettings(false)}
          onAdd={addBudgetCategory}
          onUpdate={updateBudgetCategory}
          onDelete={deleteBudgetCategory}
        />
      )}
    </div>
  )
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({ txn, categories, onCategorize, onDelete, accent }) {
  const [open, setOpen] = useState(false)
  const cat = categories.find(c => c.id === txn.categoryId)

  return (
    <div className="rounded-xl mb-1 overflow-hidden" style={{ border: '1px solid #f3f4f6' }}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Category emoji or ? */}
        <span className="text-base w-6 text-center shrink-0">
          {txn.isCredit ? '💰' : (cat ? cat.emoji : '❓')}
        </span>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{txn.description}</p>
          {cat && <p className="text-xs" style={{ color: cat.color }}>{cat.name}</p>}
          {!cat && !txn.isCredit && <p className="text-xs text-amber-500">Uncategorized</p>}
          {txn.isCredit && <p className="text-xs text-emerald-500">Credit / deposit</p>}
        </div>

        {/* Amount */}
        <span className="text-sm font-bold shrink-0" style={{ color: txn.isCredit ? '#22c55e' : '#111827' }}>
          {txn.isCredit ? '+' : ''}{fmtCents(txn.amount)}
        </span>

        {/* Expand to categorize */}
        {!txn.isCredit && (
          <button onClick={() => setOpen(v => !v)} className="p-1 text-gray-300 hover:text-gray-500 shrink-0">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        <button onClick={() => onDelete(txn.id)} className="p-1 text-gray-200 hover:text-red-400 shrink-0 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {open && !txn.isCredit && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-50">
          <p className="text-xs text-gray-400 mb-2">Assign category:</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { onCategorize(txn.id, c.id); setOpen(false) }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={
                  txn.categoryId === c.id
                    ? { background: c.color, color: '#fff' }
                    : { background: '#f3f4f6', color: '#374151' }
                }
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
