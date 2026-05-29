import { useState } from 'react'
import { Scale, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { todayMT, prevDay } from '../utils/dateUtils.js'

function MiniGraph({ entries }) {
  if (entries.length < 2) return null
  const vals  = entries.map(e => e.lbs)
  const min   = Math.min(...vals)
  const max   = Math.max(...vals)
  const range = max - min || 1
  const W = 180, H = 36, pad = 4

  const pts = entries.map((e, i) => {
    const x = pad + (i / (entries.length - 1)) * (W - pad * 2)
    const y = pad + (1 - (e.lbs - min) / range) * (H - pad * 2)
    return `${x},${y}`
  })

  const isDown = vals[vals.length - 1] <= vals[0]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={isDown ? '#22c55e' : '#f97316'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {entries.map((e, i) => {
        const [x, y] = pts[i].split(',').map(Number)
        return (
          <circle key={i} cx={x} cy={y} r="2.5"
            fill={isDown ? '#22c55e' : '#f97316'} />
        )
      })}
    </svg>
  )
}

export default function WeightCard() {
  const { activeUser, users, logWeight, deleteWeight } = useAppStore()
  const t        = themes[activeUser]
  const userData = users[activeUser]
  const profile  = userData.profile
  const weightLog = userData.weightLog || {}
  const goalWeight = parseFloat(profile.goalWeight) || null

  const today = todayMT()
  const todayEntry = weightLog[today]

  const [input,    setInput]    = useState(todayEntry ? String(todayEntry) : '')
  const [expanded, setExpanded] = useState(false)
  const [saved,    setSaved]    = useState(false)

  // Last 14 days of entries, sorted oldest→newest
  const history = Object.entries(weightLog)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, lbs]) => ({ date, lbs }))

  const latest = history.length ? history[history.length - 1].lbs : null
  const prev   = history.length >= 2 ? history[history.length - 2].lbs : null
  const diff   = latest != null && prev != null ? +(latest - prev).toFixed(1) : null
  const fromGoal = latest != null && goalWeight ? +(latest - goalWeight).toFixed(1) : null

  function handleSave() {
    const val = parseFloat(input)
    if (!val || val < 50 || val > 700) return
    logWeight(activeUser, today, val)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isHers   = activeUser === 'hers'
  const cardBg   = isHers ? '#fff8f5' : '#fff'
  const border   = isHers ? '1px solid #f0d9d0' : 'none'
  const accentColor = t.accent || '#6366f1'

  return (
    <div className="rounded-2xl shadow-sm p-4" style={{ background: cardBg, border }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale size={20} style={{ color: accentColor }} />
          <span className="font-semibold text-gray-800">Weight</span>
        </div>
        <div className="flex items-center gap-2">
          {latest && (
            <span className="text-sm font-bold text-gray-700">{latest} lbs</span>
          )}
          {diff != null && (
            <span className="flex items-center gap-0.5 text-xs font-semibold"
              style={{ color: diff < 0 ? '#22c55e' : diff > 0 ? '#f97316' : '#6b7280' }}>
              {diff < 0 ? <TrendingDown size={12} /> : diff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
              {diff > 0 ? '+' : ''}{diff}
            </span>
          )}
          <button onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Log today */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="50" max="700" step="0.1"
          placeholder={latest ? String(latest) : 'Enter lbs…'}
          value={input}
          onChange={e => { setInput(e.target.value); setSaved(false) }}
          className="input flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={!input}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-colors shrink-0"
          style={{ background: accentColor }}
        >
          {saved ? '✓' : todayEntry ? 'Update' : 'Log'}
        </button>
        {todayEntry && (
          <button
            onClick={() => { deleteWeight(activeUser, today); setInput('') }}
            className="px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 bg-gray-100 transition-colors shrink-0"
          >
            ×
          </button>
        )}
      </div>

      {/* Goal progress */}
      {fromGoal != null && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-400">Goal: {goalWeight} lbs</span>
          <span className="font-semibold" style={{ color: fromGoal <= 0 ? '#22c55e' : '#f97316' }}>
            {fromGoal <= 0
              ? `🎉 Goal reached!`
              : `${fromGoal} lbs to go`}
          </span>
        </div>
      )}

      {/* Expanded: mini graph + history */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {history.length >= 2 && (
            <div className="flex flex-col items-center gap-1">
              <MiniGraph entries={history} />
              <p className="text-xs text-gray-400">Last {history.length} entries</p>
            </div>
          )}

          {history.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No weight logged yet.</p>
          ) : (
            <div className="space-y-1">
              {[...history].reverse().map(({ date, lbs }) => {
                const isToday = date === today
                return (
                  <div key={date} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{formatDate(date)}{isToday && ' · Today'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">{lbs} lbs</span>
                      <button
                        onClick={() => { deleteWeight(activeUser, date); if (isToday) setInput('') }}
                        className="text-gray-200 hover:text-red-400 text-base leading-none transition-colors"
                      >×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
