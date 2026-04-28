import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Sparkles, CheckSquare, Square, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { callClaude } from '../utils/claudeApi'
import { todayMT, prevDay, nextDay, friendlyDate } from '../utils/dateUtils.js'

const todayStr = todayMT
const nowTime  = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

const STARTER_FOODS = [
  { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Greek Yogurt (1 cup)', calories: 130, protein: 17, carbs: 9, fat: 0 },
  { name: 'Chicken Breast (4oz)', calories: 185, protein: 35, carbs: 0, fat: 4 },
  { name: 'Brown Rice (1 cup)', calories: 215, protein: 5, carbs: 45, fat: 2 },
  { name: 'Eggs (2 large)', calories: 143, protein: 13, carbs: 1, fat: 10 },
  { name: 'Almonds (1oz)', calories: 164, protein: 6, carbs: 6, fat: 14 },
]

// Scans the entire food log and returns foods sorted by use frequency (most used first).
// Ties broken by most recently used. Returns up to `limit` unique foods.
function getRecentFoods(foodLog, limit = 20) {
  const count  = {}  // name → number of times logged
  const latest = {}  // name → { date, entry } most recent occurrence
  const proto  = {}  // name → the entry object to use as the template

  Object.entries(foodLog).forEach(([date, entries]) => {
    entries.forEach(entry => {
      const key = entry.name
      count[key] = (count[key] || 0) + 1
      if (!latest[key] || date > latest[key]) {
        latest[key] = date
        proto[key]  = entry
      }
    })
  })

  return Object.keys(count)
    .sort((a, b) => {
      if (count[b] !== count[a]) return count[b] - count[a]
      return latest[b].localeCompare(latest[a])
    })
    .slice(0, limit)
    .map(name => ({ ...proto[name], count: count[name] }))
}

export default function LogMeal() {
  const { activeUser, users, addFoodEntry } = useAppStore()
  const recentFoods = getRecentFoods(users[activeUser].foodLog)
  const t = themes[activeUser]

  const [params] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') || 'search')
  const [logDate, setLogDate] = useState(params.get('date') || todayStr())

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  // Shared loading/error
  const [loading, setLoading] = useState(false)

  // Photo state
  const [aiResult, setAiResult] = useState(null)
  const fileRef = useRef()

  // Nutrition label state
  const [labelResult, setLabelResult]   = useState(null)   // parsed label per-serving data
  const [labelError, setLabelError]     = useState('')
  const [servings, setServings]         = useState('1')    // how many servings the user is having
  const [labelName, setLabelName]       = useState('')     // editable product name
  const labelRef = useRef()

  // Barcode state
  const [barcodeResult, setBarcodeResult] = useState(null)

  // Manual state
  const [manualEntry, setManualEntry] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' })

  // Describe (AI free-text) state
  const [description, setDescription]   = useState('')
  const [describeResult, setDescribeResult] = useState(null)   // [{ name, calories, protein, carbs, fat }]
  const [describeError, setDescribeError]   = useState('')
  const [selected, setSelected]         = useState(new Set())  // indices of items to log

  async function searchFood(q) {
    if (!q.trim()) return setResults([])
    setLoading(true)
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8`
      )
      const data = await res.json()
      const items = (data.products || [])
        .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
        .map(p => ({
          name:     p.product_name,
          brand:    p.brands || '',
          calories: Math.round((p.nutriments['energy-kcal_100g'] || 0) * (p.serving_quantity || 100) / 100),
          protein:  Math.round(p.nutriments.proteins_100g || 0),
          carbs:    Math.round(p.nutriments.carbohydrates_100g || 0),
          fat:      Math.round(p.nutriments.fat_100g || 0),
        }))
      setResults(items.length ? items : QUICK_FOODS.filter(f => f.name.toLowerCase().includes(q.toLowerCase())))
    } catch {
      setResults(QUICK_FOODS.filter(f => f.name.toLowerCase().includes(q.toLowerCase())))
    }
    setLoading(false)
  }

  async function lookupBarcode(barcode) {
    setLoading(true)
    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      const data = await res.json()
      if (data.status === 1) {
        const p = data.product
        setBarcodeResult({
          name:     p.product_name || 'Unknown',
          brand:    p.brands || '',
          calories: Math.round(p.nutriments?.['energy-kcal_serving'] || p.nutriments?.['energy-kcal_100g'] || 0),
          protein:  Math.round(p.nutriments?.proteins_serving || p.nutriments?.proteins_100g || 0),
          carbs:    Math.round(p.nutriments?.carbohydrates_serving || p.nutriments?.carbohydrates_100g || 0),
          fat:      Math.round(p.nutriments?.fat_serving || p.nutriments?.fat_100g || 0),
        })
      } else {
        alert('Product not found. Try searching by name.')
        setMode('search')
      }
    } catch { alert('Could not look up barcode.') }
    setLoading(false)
  }

  async function analyzePhoto(file) {
    setLoading(true)
    setAiResult(null)
    try {
      const base64 = await toBase64(file)
      const data = await callClaude({
        model: 'claude-opus-4-7',
        max_tokens: 300,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: file.type, data: base64.split(',')[1] } },
          { type: 'text', text: 'Estimate the calories and macros for this meal. Reply with ONLY valid JSON: {"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"notes":"..."}' }
        ]}]
      })
      const text = data.content?.[0]?.text || ''
      setAiResult(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}'))
    } catch (e) {
      setAiResult({ error: e.message || 'Could not analyse photo. Check your API key in Profile.' })
    }
    setLoading(false)
  }

  async function analyzeLabel(file) {
    setLoading(true)
    setLabelResult(null)
    setLabelError('')
    setServings('1')
    try {
      const base64 = await toBase64(file)
      const data = await callClaude({
        model: 'claude-opus-4-7',
        max_tokens: 400,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: file.type, data: base64.split(',')[1] } },
          { type: 'text', text: `Read this nutrition facts label carefully and extract the per-serving values.
Reply with ONLY valid JSON, no extra text:
{
  "productName": "product name if visible, otherwise 'Unknown product'",
  "servingSize": "serving size text exactly as printed (e.g. '1 cup (240ml)')",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "fiber": 0,
  "sugar": 0,
  "sodium": 0
}
All numeric values are per-serving. protein/carbs/fat/fiber/sugar in grams, sodium in mg.` }
        ]}]
      })
      const text = data.content?.[0]?.text || ''
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (!json.calories && json.calories !== 0) throw new Error('Could not read the label. Try a clearer photo.')
      setLabelResult(json)
      setLabelName(json.productName || '')
    } catch (e) {
      setLabelError(e.message || 'Could not read label. Check your API key in Profile.')
    }
    setLoading(false)
  }

  async function analyzeDescription() {
    if (!description.trim()) return
    setLoading(true)
    setDescribeResult(null)
    setDescribeError('')
    setSelected(new Set())

    try {
      const data = await callClaude({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `The user described everything they ate. Break it into individual food items and estimate calories and macros for each one. Be realistic with portion sizes based on what they described.

What they ate:
"${description}"

Reply with ONLY valid JSON in exactly this format — no extra text:
{
  "items": [
    { "name": "Food name with portion", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
  ],
  "notes": "One sentence of context or caveats if needed"
}`,
        }],
      })
      const text = data.content?.[0]?.text || ''
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
      if (!json.items?.length) throw new Error('No items returned')
      setDescribeResult(json)
      setSelected(new Set(json.items.map((_, i) => i)))
    } catch (e) {
      setDescribeError(e.message || 'Could not parse the response. Try rephrasing what you ate.')
    }
    setLoading(false)
  }

  function logEntry(entry) {
    addFoodEntry(activeUser, logDate, { ...entry, time: nowTime() })
    setResults([]); setQuery(''); setBarcodeResult(null); setAiResult(null)
    setManualEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    alert(`Logged: ${entry.name} (${entry.calories} cal) for ${friendlyDate(logDate)}`)
  }

  function logSelected() {
    if (!describeResult || selected.size === 0) return
    const time = nowTime()
    describeResult.items.forEach((item, i) => {
      if (selected.has(i)) {
        addFoodEntry(activeUser, logDate, { ...item, time })
      }
    })
    const total = describeResult.items
      .filter((_, i) => selected.has(i))
      .reduce((s, item) => s + item.calories, 0)
    setDescription('')
    setDescribeResult(null)
    setSelected(new Set())
    alert(`Logged ${selected.size} item${selected.size !== 1 ? 's' : ''} — ${total} cal total`)
  }

  function toggleItem(i) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function logLabel() {
    if (!labelResult) return
    const s = parseFloat(servings) || 1
    const scale = n => Math.round((n || 0) * s)
    const name = labelName.trim() || 'Unknown product'
    const servingLabel = s === 1 ? labelResult.servingSize : `${s} × ${labelResult.servingSize}`
    logEntry({
      name: `${name} (${servingLabel})`,
      calories: scale(labelResult.calories),
      protein:  scale(labelResult.protein),
      carbs:    scale(labelResult.carbs),
      fat:      scale(labelResult.fat),
      fiber:    scale(labelResult.fiber),
    })
    setLabelResult(null)
    setLabelName('')
    setServings('1')
  }

  const modes = [['search','Search'], ['describe','Describe'], ['label','Label'], ['photo','Photo'], ['barcode','Barcode'], ['manual','Manual']]

  const inactiveBg = t.headerBg === '#0d1f0d' ? '#1a3a1a' : '#6b3a45'

  return (
    <div className="pb-28">
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: t.headerBg }}>
        <h1 className="text-2xl font-bold" style={{ color: t.headerText }}>Log Food</h1>

        {/* Date navigator */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setLogDate(d => prevDay(d))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)', color: t.headerText }}
          >
            <ChevronLeft size={16} />
          </button>
          <span
            className="flex-1 text-center text-sm font-semibold py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: t.headerText }}
          >
            {friendlyDate(logDate)}
          </span>
          <button
            onClick={() => setLogDate(d => nextDay(d))}
            disabled={logDate >= todayStr()}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.15)', color: t.headerText }}
          >
            <ChevronRight size={16} />
          </button>
          {logDate !== todayStr() && (
            <button
              onClick={() => setLogDate(todayStr())}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ background: t.accent, color: t.headerBg }}
            >
              Today
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
          {modes.map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
              style={mode === m
                ? { background: t.accent, color: t.headerBg }
                : { background: inactiveBg, color: '#fff' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── SEARCH ── */}
        {mode === 'search' && (
          <>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); searchFood(e.target.value) }}
              placeholder="Search foods…"
              className="input"
            />
            {loading && <p className="text-gray-400 text-sm text-center">Searching…</p>}

            {/* Search results */}
            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((f, i) => (
                  <FoodCard key={i} food={f} onLog={() => logEntry(f)} t={t} />
                ))}
              </div>
            )}

            {/* Default: recent foods (or starter list for new users) */}
            {!loading && results.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {recentFoods.length > 0 ? 'Recent & frequent' : 'Suggestions'}
                </p>
                {(recentFoods.length > 0 ? recentFoods : STARTER_FOODS).map((f, i) => (
                  <FoodCard key={i} food={f} onLog={() => logEntry(f)} t={t} count={f.count} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── DESCRIBE ── */}
        {mode === 'describe' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Describe everything you ate
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={`Type it out naturally — e.g.\n\n"For breakfast I had two scrambled eggs and a piece of toast with butter and a coffee with cream. Lunch was a turkey sandwich and some chips. Grabbed a handful of almonds as a snack. Dinner was spaghetti bolognese, maybe two cups worth, and a glass of red wine."`}
                className="input resize-none"
                rows={7}
              />
            </div>

            <button
              onClick={analyzeDescription}
              disabled={loading || !description.trim()}
              className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-2xl text-white disabled:opacity-50 transition-opacity"
              style={{ background: t.buttonBg }}
            >
              {loading
                ? <><RefreshCw size={18} className="animate-spin" /> Estimating…</>
                : <><Sparkles size={18} /> Estimate Calories</>
              }
            </button>

            {describeError && (
              <p className="text-red-500 text-sm text-center">{describeError}</p>
            )}

            {describeResult && (
              <div className="space-y-3">
                {/* Notes from AI */}
                {describeResult.notes && (
                  <p className="text-xs text-gray-500 italic">{describeResult.notes}</p>
                )}

                {/* Select all / deselect all */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {describeResult.items.length} items found
                  </span>
                  <button
                    onClick={() =>
                      selected.size === describeResult.items.length
                        ? setSelected(new Set())
                        : setSelected(new Set(describeResult.items.map((_, i) => i)))
                    }
                    className="text-xs font-medium"
                    style={{ color: t.accent }}
                  >
                    {selected.size === describeResult.items.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* Item rows */}
                <div className="space-y-2">
                  {describeResult.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => toggleItem(i)}
                      className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm p-3 text-left"
                    >
                      <div style={{ color: selected.has(i) ? t.accent : '#d1d5db', flexShrink: 0 }}>
                        {selected.has(i) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.protein}g protein · {item.carbs}g carbs · {item.fat}g fat
                        </p>
                      </div>
                      <span className="font-bold text-sm shrink-0" style={{ color: t.accent }}>
                        {item.calories} cal
                      </span>
                    </button>
                  ))}
                </div>

                {/* Total + log button */}
                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: t.accentLight, border: `1px solid ${t.cardBorder}` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">
                      Selected ({selected.size} of {describeResult.items.length})
                    </span>
                    <span className="text-xl font-bold" style={{ color: t.accent }}>
                      {describeResult.items
                        .filter((_, i) => selected.has(i))
                        .reduce((s, item) => s + item.calories, 0)} cal
                    </span>
                  </div>
                  <button
                    onClick={logSelected}
                    disabled={selected.size === 0}
                    className="w-full font-semibold py-2.5 rounded-xl text-white disabled:opacity-40"
                    style={{ background: t.buttonBg }}
                  >
                    Log {selected.size} Item{selected.size !== 1 ? 's' : ''}
                  </button>
                </div>

                {/* Start over */}
                <button
                  onClick={() => { setDescribeResult(null); setDescription(''); setSelected(new Set()) }}
                  className="w-full text-xs font-medium text-gray-400 py-1"
                >
                  Start over
                </button>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-400">
              Tap items to include or exclude them before logging. Requires Claude API key (set in Profile).
            </div>
          </div>
        )}

        {/* ── NUTRITION LABEL ── */}
        {mode === 'label' && (
          <div className="space-y-4">
            {/* Upload area */}
            {!labelResult && (
              <div
                className="rounded-2xl p-8 text-center cursor-pointer border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                onClick={() => labelRef.current?.click()}
              >
                <div className="text-4xl mb-3">🏷️</div>
                <p className="text-sm font-medium text-gray-700">Photo the Nutrition Facts label</p>
                <p className="text-xs text-gray-400 mt-1">Tap to take a photo or choose from library</p>
                <input
                  ref={labelRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => e.target.files[0] && analyzeLabel(e.target.files[0])}
                />
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-2 py-6">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
                <p className="text-sm text-gray-400">Reading label…</p>
              </div>
            )}

            {labelError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {labelError}
                <button
                  onClick={() => { setLabelError(''); setLabelResult(null) }}
                  className="block mt-1 text-xs underline"
                >
                  Try again
                </button>
              </div>
            )}

            {labelResult && !loading && (() => {
              const s = parseFloat(servings) || 1
              const scale = n => Math.round((n || 0) * s)
              return (
                <div className="space-y-4">
                  {/* Label summary card */}
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 mr-3">
                        <input
                          value={labelName}
                          onChange={e => setLabelName(e.target.value)}
                          placeholder="Product name"
                          className="input font-semibold text-gray-800 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">Per serving: {labelResult.servingSize}</p>
                      </div>
                      <button
                        onClick={() => { setLabelResult(null); setLabelName(''); setServings('1') }}
                        className="text-gray-300 hover:text-gray-500 text-xl leading-none shrink-0 mt-1"
                      >
                        ×
                      </button>
                    </div>

                    {/* Per-serving nutrition grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Calories', value: labelResult.calories, unit: '' },
                        { label: 'Protein',  value: labelResult.protein,  unit: 'g' },
                        { label: 'Carbs',    value: labelResult.carbs,    unit: 'g' },
                        { label: 'Fat',      value: labelResult.fat,      unit: 'g' },
                      ].map(({ label, value, unit }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-bold text-gray-700">{value}{unit}</p>
                        </div>
                      ))}
                    </div>
                    {(labelResult.fiber > 0 || labelResult.sugar > 0 || labelResult.sodium > 0) && (
                      <p className="text-xs text-gray-400">
                        {labelResult.fiber > 0 && `Fiber: ${labelResult.fiber}g  `}
                        {labelResult.sugar > 0 && `Sugar: ${labelResult.sugar}g  `}
                        {labelResult.sodium > 0 && `Sodium: ${labelResult.sodium}mg`}
                      </p>
                    )}
                  </div>

                  {/* Portion picker */}
                  <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">How many servings are you having?</p>

                    {/* Quick-select buttons */}
                    <div className="flex gap-2">
                      {['0.5', '1', '1.5', '2', '3'].map(v => (
                        <button
                          key={v}
                          onClick={() => setServings(v)}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                          style={
                            servings === v
                              ? { background: t.accent, color: '#fff' }
                              : { background: '#f3f4f6', color: '#374151' }
                          }
                        >
                          {v}
                        </button>
                      ))}
                    </div>

                    {/* Custom input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={servings}
                        onChange={e => setServings(e.target.value)}
                        className="input flex-1"
                        placeholder="Custom"
                      />
                      <span className="text-sm text-gray-400 shrink-0">servings</span>
                    </div>

                    {/* Scaled totals */}
                    <div
                      className="rounded-xl p-3 space-y-1"
                      style={{ background: t.accentLight, border: `1px solid ${t.cardBorder}` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {s !== 1 ? `${s} servings total` : '1 serving total'}
                        </span>
                        <span className="text-xl font-bold" style={{ color: t.accent }}>
                          {scale(labelResult.calories)} cal
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {scale(labelResult.protein)}g protein · {scale(labelResult.carbs)}g carbs · {scale(labelResult.fat)}g fat
                      </p>
                    </div>

                    <button
                      onClick={logLabel}
                      disabled={!servings || parseFloat(servings) <= 0}
                      className="w-full font-semibold py-3 rounded-2xl text-white disabled:opacity-40"
                      style={{ background: t.buttonBg }}
                    >
                      Log {scale(labelResult.calories)} cal
                    </button>
                  </div>

                  {/* Retake */}
                  <button
                    onClick={() => { setLabelResult(null); setLabelName(''); setServings('1') }}
                    className="w-full text-xs font-medium text-gray-400 py-1"
                  >
                    Scan a different label
                  </button>
                </div>
              )
            })()}

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-400">
              AI reads the nutrition facts panel and extracts per-serving values. Requires Claude API key (set in Profile).
            </div>
          </div>
        )}

        {/* ── BARCODE ── */}
        {mode === 'barcode' && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-4">Enter barcode number</p>
              <input placeholder="e.g. 0123456789012" className="input text-center"
                onKeyDown={e => e.key === 'Enter' && lookupBarcode(e.target.value)} />
              <p className="text-xs text-gray-400 mt-2">Press Enter to look up</p>
            </div>
            {loading && <p className="text-gray-400 text-sm text-center">Looking up…</p>}
            {barcodeResult && <FoodCard food={barcodeResult} onLog={() => logEntry(barcodeResult)} t={t} />}
          </div>
        )}

        {/* ── PHOTO ── */}
        {mode === 'photo' && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-2xl p-6 text-center cursor-pointer"
              onClick={() => fileRef.current?.click()}>
              <p className="text-sm text-gray-500">Tap to take a photo or choose from library</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files[0] && analyzePhoto(e.target.files[0])} />
            </div>
            {loading && <p className="text-gray-400 text-sm text-center">Analysing with AI…</p>}
            {aiResult?.error && <p className="text-red-500 text-sm text-center">{aiResult.error}</p>}
            {aiResult && !aiResult.error && (
              <div>
                {aiResult.notes && <p className="text-xs text-gray-500 mb-2">{aiResult.notes}</p>}
                <FoodCard food={aiResult} onLog={() => logEntry(aiResult)} t={t} />
              </div>
            )}
          </div>
        )}

        {/* ── MANUAL ── */}
        {mode === 'manual' && (
          <div className="space-y-3">
            <input placeholder="Food name" className="input" value={manualEntry.name}
              onChange={e => setManualEntry(p => ({ ...p, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              {['calories','protein','carbs','fat','fiber'].map(field => (
                <input key={field}
                  placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)}${field !== 'calories' ? ' (g)' : ''}`}
                  type="number" className="input" value={manualEntry[field]}
                  onChange={e => setManualEntry(p => ({ ...p, [field]: e.target.value }))} />
              ))}
            </div>
            <button
              onClick={() => manualEntry.name && manualEntry.calories && logEntry({
                ...manualEntry,
                calories: Number(manualEntry.calories),
                protein:  Number(manualEntry.protein),
                carbs:    Number(manualEntry.carbs),
                fat:      Number(manualEntry.fat),
                fiber:    Number(manualEntry.fiber),
              })}
              className="w-full font-semibold py-3 rounded-2xl text-white"
              style={{ background: t.buttonBg }}
            >
              Log Food
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FoodCard({ food, onLog, t, count }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0 mr-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-800">{food.name}</p>
          {count > 1 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">
              {count}×
            </span>
          )}
        </div>
        {food.brand && <p className="text-xs text-gray-400">{food.brand}</p>}
        <p className="text-xs text-gray-500 mt-0.5">{food.protein}g protein · {food.carbs}g carbs · {food.fat}g fat</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-bold" style={{ color: t.accent }}>{food.calories}</span>
        <button onClick={onLog} className="rounded-full p-1 text-white" style={{ background: t.buttonBg }}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
