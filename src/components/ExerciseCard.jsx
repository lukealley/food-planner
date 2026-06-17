import { useState, useEffect } from 'react'
import { Dumbbell, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { todayMT, prevDay, nextDay, friendlyDate } from '../utils/dateUtils.js'
import { goalCelebrate } from '../utils/goalCelebrate.js'
import { callClaude } from '../utils/claudeApi.js'

function getExerciseEntry(exerciseLog, date) {
  const raw = exerciseLog?.[date]
  if (!raw) return { done: false, description: '', caloriesBurned: null }
  if (raw === true) return { done: true, description: '', caloriesBurned: null }
  return { done: !!raw.done, description: raw.description || '', caloriesBurned: raw.caloriesBurned || null }
}

export default function ExerciseCard() {
  const { activeUser, users, toggleExercise, logExerciseDetails } = useAppStore()
  const t = themes[activeUser]
  const exerciseLog = users[activeUser].exerciseLog || {}

  const [logDate, setLogDate] = useState(todayMT())
  const isToday = logDate === todayMT()

  const entry = getExerciseEntry(exerciseLog, logDate)
  const done = entry.done

  const [description, setDescription]   = useState('')
  const [estimatedCals, setEstimatedCals] = useState('')
  const [estimating, setEstimating]     = useState(false)
  const [aiError, setAiError]           = useState('')
  const [editing, setEditing]           = useState(false)

  // Reset local UI whenever the viewed date changes
  useEffect(() => {
    setDescription('')
    setEstimatedCals('')
    setAiError('')
    setEditing(false)
  }, [logDate])

  async function handleEstimate() {
    if (!description.trim() || estimating) return
    setEstimating(true)
    setAiError('')
    try {
      const data = await callClaude({
        model: 'claude-haiku-4-5',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Estimate the calories burned for this workout: "${description}"\n\nAssume an average adult (~165 lbs, moderate fitness level). Reply with ONLY a JSON object, nothing else. Example: {"calories": 350}`,
        }],
      })
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\{[\s\S]*?\}/)
      if (match) {
        const obj = JSON.parse(match[0])
        const cal = obj.calories ?? obj.cal ?? obj.caloriesBurned
        if (cal && Number(cal) > 0) {
          setEstimatedCals(String(Math.round(Number(cal))))
        } else {
          setAiError('Could not read estimate — enter calories manually.')
        }
      } else {
        setAiError('Could not parse response — enter calories manually.')
      }
    } catch (e) {
      setAiError((e.message || 'Estimation failed') + ' — enter calories manually.')
    } finally {
      setEstimating(false)
    }
  }

  function handleSubmit() {
    const cals = parseFloat(estimatedCals)
    if (!cals || cals <= 0) return
    logExerciseDetails(activeUser, logDate, {
      description: description.trim(),
      caloriesBurned: Math.round(cals),
    })
    setEditing(false)
  }

  function handleToggle() {
    if (!done) goalCelebrate()
    toggleExercise(activeUser, logDate)
    // Reset form state when unchecking
    if (done) {
      setDescription('')
      setEstimatedCals('')
      setAiError('')
      setEditing(false)
    }
  }

  function startEdit() {
    setDescription(entry.description || '')
    setEstimatedCals(entry.caloriesBurned ? String(entry.caloriesBurned) : '')
    setAiError('')
    setEditing(true)
  }

  const showSaved = done && !!entry.caloriesBurned && !editing
  const showForm  = done && (!entry.caloriesBurned || editing)

  const isHers = activeUser === 'hers'

  return (
    <div
      className="rounded-2xl shadow-sm p-4"
      style={{
        background: isHers ? '#f0fff4' : '#fff',
        border: isHers ? '1px solid #c6e8d0' : 'none',
      }}
    >
      {/* Header + date navigator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={20} className="text-emerald-500" />
          <span className="font-semibold text-gray-800">Exercise</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLogDate(d => prevDay(d))}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-gray-500 w-16 text-center">
            {friendlyDate(logDate)}
          </span>
          <button
            onClick={() => setLogDate(d => nextDay(d))}
            disabled={isToday}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Done checkbox */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
        style={{
          background: done ? '#dcfce7' : '#f9fafb',
          border: `2px solid ${done ? '#22c55e' : '#e5e7eb'}`,
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ background: done ? '#22c55e' : '#fff', border: `2px solid ${done ? '#22c55e' : '#d1d5db'}` }}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold" style={{ color: done ? '#15803d' : '#374151' }}>
            {done ? '30+ min — nice work!' : '30+ minutes of exercise'}
          </p>
          <p className="text-xs" style={{ color: done ? '#16a34a' : '#9ca3af' }}>
            {done ? 'Tap to unmark' : 'Tap to mark as done'}
          </p>
        </div>
      </button>

      {/* ── Saved workout summary ── */}
      {showSaved && (
        <div
          className="mt-3 rounded-xl p-3"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-emerald-700">
              🔥 {entry.caloriesBurned} cal burned
            </span>
            <button
              onClick={startEdit}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Edit
            </button>
          </div>
          {entry.description && (
            <p className="text-xs text-emerald-600 italic leading-relaxed">
              {entry.description}
            </p>
          )}
        </div>
      )}

      {/* ── Workout description + calorie form ── */}
      {showForm && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-500">
            Describe your workout to estimate calories burned:
          </p>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. 45 min run, 3 miles, moderate pace outdoors…"
            rows={3}
            className="w-full text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none"
            style={{
              background: '#f9fafb',
              border: '1.5px solid #e5e7eb',
              lineHeight: 1.5,
            }}
          />

          {/* Calories input + Estimate + Save — one row */}
          <div className="flex gap-2 items-center">
            {/* Editable calories number */}
            <div className="relative flex-1">
              <input
                type="number"
                value={estimatedCals}
                onChange={e => setEstimatedCals(e.target.value)}
                placeholder="Cal burned"
                min="0"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                style={{
                  border: estimatedCals ? '2px solid #86efac' : '1.5px solid #e5e7eb',
                  background: '#fff',
                }}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">
                cal
              </span>
            </div>

            {/* AI Estimate button */}
            <button
              onClick={handleEstimate}
              disabled={!description.trim() || estimating}
              title="Estimate with AI"
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity shrink-0"
              style={{ background: '#10b981' }}
            >
              {estimating
                ? <Loader2 size={15} className="animate-spin" />
                : <Sparkles size={15} />
              }
            </button>

            {/* Save button */}
            <button
              onClick={handleSubmit}
              disabled={!estimatedCals || parseFloat(estimatedCals) <= 0}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 shrink-0"
              style={{ background: '#22c55e' }}
            >
              Save
            </button>
          </div>

          {estimating && (
            <p className="text-xs text-gray-400 text-center animate-pulse">
              Estimating with AI…
            </p>
          )}
          {aiError && (
            <p className="text-xs text-red-400">{aiError}</p>
          )}
          {estimatedCals && !aiError && (
            <p className="text-xs text-gray-400">
              ✨ AI estimate — edit the number if needed, then Save.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
