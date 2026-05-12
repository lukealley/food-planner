import { useState } from 'react'
import { X, TrendingUp } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { computeDayScore, computeHistoryScores, scoreLabel, categoryColor, CATEGORY_META, DEFAULT_WEIGHTS } from '../utils/score'
import { todayMT } from '../utils/dateUtils'

// ─── SVG History Graph ────────────────────────────────────────────────────────

function HistoryGraph({ history }) {
  const W = 300, H = 160
  const padL = 28, padR = 8, padT = 10, padB = 24
  const gW = W - padL - padR
  const gH = H - padT - padB

  const valid = history.filter(d => d.score != null)
  if (!valid.length) return (
    <p className="text-center text-gray-400 text-sm py-8">No score data yet — start logging!</p>
  )

  const n = history.length
  const xOf = i => padL + (i / (n - 1)) * gW
  const yOf = v => padT + gH - (v / 100) * gH

  // Build polyline points and area path
  const pts = history.map((d, i) => d.score != null ? `${xOf(i)},${yOf(d.score)}` : null)
  const linePts = pts.filter(Boolean).join(' ')

  // Area fill (connect valid points, close to bottom)
  const firstValid = history.findIndex(d => d.score != null)
  const lastValid  = history.length - 1 - [...history].reverse().findIndex(d => d.score != null)
  const areaPath   = valid.length >= 2
    ? `M${xOf(firstValid)},${padT + gH} ` +
      history.slice(firstValid, lastValid + 1)
        .map((d, i) => d.score != null ? `L${xOf(firstValid + i)},${yOf(d.score)}` : '').join(' ') +
      ` L${xOf(lastValid)},${padT + gH} Z`
    : ''

  // X-axis labels: show ~5 evenly spaced dates
  const labelStep = Math.max(1, Math.floor(n / 5))
  const xLabels   = history.map((d, i) => (i % labelStep === 0 || i === n - 1) ? { i, d } : null).filter(Boolean)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Y grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={padL} x2={padL + gW} y1={yOf(v)} y2={yOf(v)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={padL - 4} y={yOf(v) + 4} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>
        </g>
      ))}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#scoreGrad)" opacity="0.35" />}

      {/* Line */}
      {valid.length >= 2 && (
        <polyline points={linePts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
      )}

      {/* Dots */}
      {history.map((d, i) => d.score != null && (
        <circle key={i} cx={xOf(i)} cy={yOf(d.score)} r="3.5"
          fill={categoryColor(d.score)} stroke="#fff" strokeWidth="1.5" />
      ))}

      {/* X labels */}
      {xLabels.map(({ i, d }) => {
        const parts = d.date.split('-')
        const label = `${parseInt(parts[1])}/${parseInt(parts[2])}`
        return (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">{label}</text>
        )
      })}

      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Score History Modal ──────────────────────────────────────────────────────

function ScoreModal({ user, userData, onClose }) {
  const weights = userData.scoreWeights || DEFAULT_WEIGHTS
  const history = computeHistoryScores(userData, weights, 30)
  const name    = userData.profile.name || (user === 'his' ? 'Luke' : 'Mary')

  // Last 7 avg
  const last7 = history.slice(-7).filter(d => d.score != null)
  const avg7  = last7.length ? Math.round(last7.reduce((s, d) => s + d.score, 0) / last7.length) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-md mx-auto rounded-t-3xl bg-white shadow-2xl"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            <span className="font-bold text-gray-800">{name}'s Score History</span>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* 7-day avg callout */}
          {avg7 != null && (
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: '#eef2ff' }}>
              <div>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">7-Day Average</p>
                <p className="text-3xl font-black text-indigo-600">{avg7}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-400">out of 100</p>
                <p className="text-sm font-semibold" style={{ color: scoreLabel(avg7).color }}>
                  {scoreLabel(avg7).text}
                </p>
              </div>
            </div>
          )}

          {/* Graph */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">30-Day Trend</p>
            <HistoryGraph history={history} />
          </div>

          {/* Recent days list */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Days</p>
            <div className="space-y-1">
              {[...history].reverse().slice(0, 14).map(({ date, score, detail }) => {
                const [y, m, d] = date.split('-').map(Number)
                const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                const { color } = scoreLabel(score)
                return (
                  <div key={date} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      {score != null && (
                        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                      )}
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: score != null ? color : '#d1d5db' }}>
                      {score ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Profile Badge ────────────────────────────────────────────────────────────

function ProfileBadge({ user, isActive, onClick }) {
  const { users } = useAppStore()
  const [showGraph, setShowGraph] = useState(false)
  const userData = users[user]
  const name   = userData.profile.name || (user === 'his' ? 'Luke' : 'Mary')
  const initial = name[0]?.toUpperCase() || (user === 'his' ? 'L' : 'M')

  const weights = userData.scoreWeights || DEFAULT_WEIGHTS
  const scores  = computeDayScore(userData, todayMT(), weights)
  const { text: labelText, color: labelColor } = scoreLabel(scores?.overall)

  const isHis         = user === 'his'
  const arcColor      = isHis ? '#22c55e' : '#c9a96e'
  const activeBg      = isHis ? '#22c55e' : '#c9a96e'
  const inactiveBg    = isHis ? '#1a2e1a' : '#3d1f25'
  const inactiveText  = isHis ? '#4ade80' : '#c9a96e'
  const trackColor    = isHis ? '#1a3a1a' : '#5a2a35'

  // Score arc
  const size = 48, r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct  = scores != null ? (scores.overall / 100) : 0
  const dash = circ * pct

  return (
    <>
      <button onClick={onClick} className="flex flex-col items-center gap-0.5">
        {/* Avatar + arc */}
        <div className="relative" style={{ width: 48, height: 48 }}>
          <svg width={48} height={48} className="-rotate-90" viewBox="0 0 48 48" style={{ position: 'absolute', inset: 0 }}>
            <circle cx={24} cy={24} r={r} fill="none" stroke={trackColor} strokeWidth="4" />
            <circle cx={24} cy={24} r={r} fill="none"
              stroke={scores != null ? labelColor : 'transparent'}
              strokeWidth="4"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
            />
          </svg>
          <div
            className="absolute inset-0 m-1.5 rounded-full flex items-center justify-center text-base font-bold"
            style={isActive
              ? { background: activeBg, color: isHis ? '#0d1f0d' : '#3d1f25', boxShadow: `0 0 0 2px ${arcColor}` }
              : { background: inactiveBg, color: inactiveText }}
          >
            {initial}
          </div>
        </div>

        {/* Name */}
        <span className="text-xs font-semibold tracking-wide leading-none"
          style={{ color: isActive ? arcColor : (isHis ? '#2d4a2d' : '#5a3040') }}>
          {name.split(' ')[0].toUpperCase()}
        </span>

        {/* Score — clickable for graph */}
        <button
          onClick={e => { e.stopPropagation(); setShowGraph(true) }}
          className="flex items-baseline gap-0.5 rounded px-1 transition-opacity hover:opacity-80"
        >
          <span className="font-black leading-none" style={{ fontSize: 15, color: scores != null ? labelColor : '#374151' }}>
            {scores != null ? scores.overall : '—'}
          </span>
          {scores != null && (
            <span style={{ fontSize: 9, color: labelColor, lineHeight: 1 }}>{labelText}</span>
          )}
        </button>

        {/* 6 category dots */}
        <div className="flex gap-1 mt-0.5">
          {CATEGORY_META.map(({ key, abbr, color }) => {
            const val = scores?.[key]
            const dotColor = val != null ? categoryColor(val) : '#1e3a1e'
            return (
              <div key={key} className="flex flex-col items-center gap-px">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                <span style={{ fontSize: 7, color: dotColor, lineHeight: 1 }}>{abbr}</span>
              </div>
            )
          })}
        </div>
      </button>

      {showGraph && (
        <ScoreModal user={user} userData={userData} onClose={() => setShowGraph(false)} />
      )}
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ProfileSwitcher() {
  const { activeUser, setActiveUser } = useAppStore()

  return (
    <div className="flex items-center justify-center gap-6 px-4 py-2.5" style={{ backgroundColor: '#080f08' }}>
      <ProfileBadge user="his"  isActive={activeUser === 'his'}  onClick={() => setActiveUser('his')}  />

      <div className="flex flex-col items-center gap-0.5 px-1">
        <div className="w-px h-4" style={{ background: '#1e3a1e' }} />
        <span style={{ fontSize: 10, color: '#1e3a1e' }}>&amp;</span>
        <div className="w-px h-4" style={{ background: '#1e3a1e' }} />
        <span style={{ fontSize: 8, color: '#2a4a2a' }}>today</span>
      </div>

      <ProfileBadge user="hers" isActive={activeUser === 'hers'} onClick={() => setActiveUser('hers')} />
    </div>
  )
}
