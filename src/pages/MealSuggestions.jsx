import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { callClaude } from '../utils/claudeApi'
import { todayMT } from '../utils/dateUtils.js'

export default function MealSuggestions() {
  const { profile, calorieGoal, foodLog } = useAppStore()
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = todayMT()
  const todayEntries = foodLog[today] || []
  const consumed = todayEntries.reduce((s, e) => s + (e.calories || 0), 0)
  const remaining = calorieGoal - consumed

  async function getSuggestions() {
    setLoading(true)
    setError('')
    setSuggestions(null)

    const prompt = `You are a helpful meal planning assistant. Give me 3 meal suggestions.

User profile:
- Goal weight: ${profile.goalWeight || 'not set'} lbs (current: ${profile.currentWeight || 'not set'} lbs)
- Daily calorie goal: ${calorieGoal} calories
- Calories remaining today: ${remaining}

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "name": "Meal name",
      "calories": 400,
      "protein": 30,
      "why": "One sentence reason this fits their goals",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "quickTip": "One cooking tip"
    }
  ]
}`

    try {
      const data = await callClaude({
        model: 'claude-opus-4-7',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
      const text = data.content?.[0]?.text || ''
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}')
      setSuggestions(json.suggestions || [])
    } catch (e) {
      setError(e.message || 'Failed to get suggestions. Check your API key in Profile.')
    }
    setLoading(false)
  }

  return (
    <div className="pb-28">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles size={24} /> AI Suggestions
        </h1>
        <p className="text-purple-100 text-sm mt-0.5">
          {remaining > 0 ? `${remaining} calories left today` : 'Daily goal reached'}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        <button
          onClick={getSuggestions}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold py-3.5 rounded-2xl disabled:opacity-60 transition-opacity"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Thinking…' : 'Get Meal Suggestions'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
            {error.includes('API key') && (
              <p className="mt-1 text-xs">Go to Profile and scroll to the bottom to add your Claude API key.</p>
            )}
          </div>
        )}

        {suggestions && suggestions.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-800">{s.name}</h3>
              <div className="text-right ml-2 shrink-0">
                <p className="text-brand-600 font-bold text-sm">{s.calories} cal</p>
                <p className="text-xs text-gray-400">{s.protein}g protein</p>
              </div>
            </div>
            <p className="text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-1.5">{s.why}</p>
            {s.ingredients?.length > 0 && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Ingredients:</span> {s.ingredients.join(', ')}
              </p>
            )}
            {s.quickTip && (
              <p className="text-xs text-gray-400 italic">{s.quickTip}</p>
            )}
          </div>
        ))}

        {suggestions?.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No suggestions returned. Try again.</p>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500">
          Suggestions are personalized based on your calorie goal, remaining calories for today, and what's in your pantry.
        </div>
      </div>
    </div>
  )
}
