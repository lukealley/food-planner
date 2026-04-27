import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function MealPlan() {
  const { mealPlan, setMealPlanSlot, dinners } = useAppStore()
  const [editing, setEditing] = useState(null) // { day, meal }
  const [input, setInput] = useState('')

  function handleSet() {
    if (!input.trim() || !editing) return
    setMealPlanSlot(editing.day, editing.meal, input.trim())
    setEditing(null)
    setInput('')
  }

  function pickDinner(name) {
    if (!editing) return
    setMealPlanSlot(editing.day, editing.meal, name)
    setEditing(null)
    setInput('')
  }

  return (
    <div className="pb-28">
      <div className="bg-brand-600 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Weekly Plan</h1>
        <p className="text-brand-100 text-sm mt-0.5">Tap any slot to plan a meal</p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {DAYS.map(day => (
          <div key={day} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">{day}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {MEALS.map(meal => {
                const val = mealPlan[day]?.[meal]
                return (
                  <button
                    key={meal}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => { setEditing({ day, meal }); setInput(val || '') }}
                  >
                    <span className="text-xs text-gray-400 w-20">{meal}</span>
                    <span className={`flex-1 text-sm ${val ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
                      {val || 'Tap to add'}
                    </span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setEditing(null)}>
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <p className="font-bold text-lg">{editing.day} — {editing.meal}</p>
              <p className="text-sm text-gray-400">Type or pick from your dinner database</p>
            </div>
            <div className="flex gap-2">
              <input
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSet()}
                placeholder="e.g. Grilled Chicken"
                className="input flex-1"
              />
              <button onClick={handleSet} className="bg-brand-600 text-white px-4 rounded-xl font-semibold">
                Set
              </button>
            </div>
            {dinners.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">From Dinner Database</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {dinners.map(d => (
                    <button
                      key={d.id}
                      onClick={() => pickDinner(d.name)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors"
                    >
                      <span className="text-sm font-medium">{d.name}</span>
                      <span className="text-xs text-brand-600 font-semibold">{d.calories} cal</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
