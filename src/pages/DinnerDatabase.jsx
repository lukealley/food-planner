import { useState } from 'react'
import { Plus, X, Clock, Flame, Star } from 'lucide-react'
import useAppStore from '../store/useAppStore'

const ALL_TAGS = ['all', 'kids', 'healthy', 'dessert', 'fruit', 'family']

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'health',  label: 'Healthiest' },
  { value: 'yummy',  label: 'Yummiest' },
  { value: 'looks',  label: 'Best Looking' },
]

const RATING_KEYS = [
  { key: 'health', label: 'Health',    color: '#16a34a' },
  { key: 'yummy',  label: 'Yumminess', color: '#ea580c' },
  { key: 'looks',  label: 'Aesthetic', color: '#7c3aed' },
]

function avgRating(dinner) {
  const r = dinner.ratings || {}
  const vals = RATING_KEYS.map(k => r[k.key]).filter(Boolean)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function StarRow({ label, color, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium w-20 shrink-0" style={{ color }}>{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            className="focus:outline-none"
          >
            <Star
              size={18}
              fill={n <= value ? color : 'none'}
              stroke={n <= value ? color : '#d1d5db'}
            />
          </button>
        ))}
      </div>
      {value > 0 && <span className="text-xs text-gray-400">{value}/5</span>}
    </div>
  )
}

const emptyForm = { name: '', calories: '', protein: '', cookTime: '', tags: '', ingredients: '' }
const emptyRatings = { health: 0, yummy: 0, looks: 0 }

export default function DinnerDatabase() {
  const { dinners, addDinner } = useAppStore()
  const [activeTag, setActiveTag] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formRatings, setFormRatings] = useState(emptyRatings)

  let filtered = activeTag === 'all' ? dinners : dinners.filter(d => d.tags.includes(activeTag))

  if (sortBy !== 'default') {
    filtered = [...filtered].sort((a, b) => {
      const ra = (a.ratings || {})[sortBy] || 0
      const rb = (b.ratings || {})[sortBy] || 0
      return rb - ra
    })
  }

  function handleAdd() {
    if (!form.name.trim()) return
    const ratings = {}
    RATING_KEYS.forEach(k => { if (formRatings[k.key] > 0) ratings[k.key] = formRatings[k.key] })
    addDinner({
      name: form.name.trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      cookTime: Number(form.cookTime) || 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      ingredients: form.ingredients.split(',').map(i => i.trim()).filter(Boolean),
      ratings,
    })
    setForm(emptyForm)
    setFormRatings(emptyRatings)
    setShowForm(false)
  }

  return (
    <div className="pb-28">
      <div className="bg-brand-600 text-white px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">Dinner Database</h1>
        <p className="text-brand-100 text-sm mt-0.5">Meals your family loves</p>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                activeTag === tag ? 'bg-white text-brand-700' : 'bg-brand-700 text-white'
              }`}
            >
              {tag === 'all' ? 'All' : tag === 'kids' ? 'Cook w/ Kids' : tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sort bar */}
      <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-gray-500 font-medium shrink-0">Sort:</span>
        {SORT_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setSortBy(o.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sortBy === o.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3 space-y-3">
        {filtered.map(dinner => (
          <DinnerCard key={dinner.id} dinner={dinner} />
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">No dinners in this category yet.</p>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
          >
            <Plus size={20} /> Add Dinner
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">New Dinner</h3>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setFormRatings(emptyRatings) }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <input
              placeholder="Name *"
              className="input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />

            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Calories" type="number" className="input" value={form.calories}
                onChange={e => setForm(p => ({ ...p, calories: e.target.value }))} />
              <input placeholder="Protein (g)" type="number" className="input" value={form.protein}
                onChange={e => setForm(p => ({ ...p, protein: e.target.value }))} />
              <input placeholder="Cook (min)" type="number" className="input" value={form.cookTime}
                onChange={e => setForm(p => ({ ...p, cookTime: e.target.value }))} />
            </div>

            <input placeholder="Tags (kids, healthy, dessert…)" className="input" value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            <input placeholder="Ingredients (comma separated)" className="input" value={form.ingredients}
              onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))} />

            {/* Ratings in the form */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Rate this dinner</p>
              <div className="space-y-2">
                {RATING_KEYS.map(k => (
                  <StarRow
                    key={k.key}
                    label={k.label}
                    color={k.color}
                    value={formRatings[k.key]}
                    onChange={score => setFormRatings(r => ({ ...r, [k.key]: score }))}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.name.trim()}
              className="w-full bg-brand-600 text-white font-semibold py-3 rounded-2xl disabled:opacity-40 transition-opacity"
            >
              Save Dinner
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DinnerCard({ dinner }) {
  const { rateDinner } = useAppStore()
  const [open, setOpen] = useState(false)
  const ratings = dinner.ratings || {}
  const avg = avgRating(dinner)
  const hasAnyRating = RATING_KEYS.some(k => ratings[k.key])

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full text-left p-4" onClick={() => setOpen(o => !o)}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800">{dinner.name}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {(dinner.tags || []).map(t => (
                <span key={t} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full capitalize">{t}</span>
              ))}
            </div>
            {hasAnyRating && (
              <div className="flex items-center gap-2 mt-1.5">
                {RATING_KEYS.map(k => ratings[k.key] ? (
                  <div key={k.key} className="flex items-center gap-0.5">
                    <Star size={11} fill={k.color} stroke={k.color} />
                    <span className="text-xs text-gray-500">{ratings[k.key]}</span>
                  </div>
                ) : null)}
                <span className="text-xs text-gray-400">avg {avg.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="text-right ml-3 shrink-0">
            {dinner.calories > 0 && (
              <div className="flex items-center gap-1 text-sm font-bold text-brand-600">
                <Flame size={14} />{dinner.calories}
              </div>
            )}
            {dinner.cookTime > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Clock size={12} />{dinner.cookTime}m
              </div>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {dinner.ingredients?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Ingredients</p>
              <p className="text-sm text-gray-600">{dinner.ingredients.join(', ')}</p>
              {dinner.protein > 0 && (
                <p className="text-xs text-gray-400 mt-1">{dinner.protein}g protein</p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Ratings</p>
            <div className="space-y-2">
              {RATING_KEYS.map(k => (
                <StarRow
                  key={k.key}
                  label={k.label}
                  color={k.color}
                  value={ratings[k.key] || 0}
                  onChange={score => rateDinner(dinner.id, k.key, score)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
