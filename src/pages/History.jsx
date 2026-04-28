import { useState } from 'react'
import { ChevronLeft, ChevronRight, Utensils, Droplets, Moon, ChevronDown, ChevronUp, Dumbbell, Timer } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { todayMT } from '../utils/dateUtils.js'

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function SleepDetail({ sleep, sleepAidDisplay }) {
  const effective = sleep.wakeMinutes > 0
    ? +(sleep.hours - sleep.wakeMinutes / 60).toFixed(1)
    : null
  const aid = sleepAidDisplay(sleep)

  return (
    <div className="space-y-1">
      {/* Hours row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-700 font-medium">{sleep.hours}h in bed</span>
        {effective && (
          <span className="text-sm text-indigo-600 font-medium">{effective}h effective</span>
        )}
        {sleep.wakeMinutes > 0 && (
          <span className="text-xs text-red-400">{sleep.wakeMinutes}min awake</span>
        )}
      </div>

      {/* Bedtime / waketime */}
      {sleep.bedtime && sleep.waketime && (
        <p className="text-xs text-gray-400">
          Bed {sleep.bedtime} → Up {sleep.waketime}
        </p>
      )}

      {/* Nap */}
      {sleep.napMinutes > 0 && (
        <p className="text-xs text-indigo-400">
          Napped {sleep.napMinutes}min the day before
        </p>
      )}

      {/* Sleep aid */}
      {aid && (
        <p className="text-xs text-purple-500">
          Sleep aid: {aid}
        </p>
      )}
    </div>
  )
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function History() {
  const { activeUser, users } = useAppStore()
  const t = themes[activeUser]
  const userData = users[activeUser]

  const now = new Date()
  const todayStr = todayMT()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState(todayStr)
  const [sleepExpanded,   setSleepExpanded]   = useState(false)
  const [waterExpanded,   setWaterExpanded]   = useState(false)
  const [fastingExpanded, setFastingExpanded] = useState(false)

  const { year, month } = view
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()
  const atLatestMonth = year > todayY || (year === todayY && month >= todayM)

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  }
  function nextMonth() {
    if (atLatestMonth) return
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
  }

  // Selected day data
  const foodEntries  = userData.foodLog[selected] || []
  const waterOz      = userData.waterLog[selected] || 0
  const sleep        = userData.sleepLog[selected]
  const exercised    = !!(userData.exerciseLog || {})[selected]
  const totalCals    = foodEntries.reduce((s, e) => s + (e.calories || 0), 0)

  const fastingLog   = userData.fastingLog || []

  function fastDateMT(isoStr) {
    return new Date(isoStr).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
  }

  const fastingForDay = fastingLog.filter(e => (e.date || fastDateMT(e.endTime)) === selected)

  // Precompute set of dates with fasts for calendar dots
  const fastingDates = new Set(fastingLog.map(e => e.date || fastDateMT(e.endTime)))

  function formatFastDuration(ms) {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  function getFastingHistory() {
    return [...fastingLog].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, 30)
  }

  // Multi-day history helpers (last 30 days, only days with data)
  function getSleepHistory() {
    return Object.entries(userData.sleepLog)
      .filter(([, s]) => s?.hours)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
  }
  function getWaterHistory() {
    return Object.entries(userData.waterLog)
      .filter(([, oz]) => oz > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
  }

  const SLEEP_AID_LABELS = {
    none: null, melatonin: 'Melatonin', magnesium: 'Magnesium Oxide',
    nyquil: 'NyQuil', tylenol_pm: 'Tylenol PM', unisom: 'Unisom', other: 'Other',
  }

  function sleepAidDisplay(s) {
    if (!s.sleepAid || s.sleepAid === 'none') return null
    const label = SLEEP_AID_LABELS[s.sleepAid] || s.sleepAid
    return s.sleepAid === 'other' && s.sleepAidOther ? s.sleepAidOther : label
  }

  return (
    <div className="pb-28 min-h-screen" style={{ background: activeUser === 'hers' ? '#fdf8f5' : '#f9fafb' }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: t.headerBg }}>
        <h1 className="text-2xl font-bold" style={{ color: t.headerText }}>History</h1>
        <p className="text-sm mt-0.5" style={{ color: t.headerSubtext }}>Food, water & sleep logs</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-gray-800 text-sm">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              disabled={atLatestMonth}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-25"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 bg-gray-50">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = toDateStr(year, month, day)
              const isToday = year === todayY && month === todayM && day === todayD
              const isFuture = dateStr > todayStr
              const isSelected = dateStr === selected
              const hasFood     = (userData.foodLog[dateStr] || []).length > 0
              const hasWater    = (userData.waterLog[dateStr] || 0) > 0
              const hasSleep    = !!userData.sleepLog[dateStr]
              const hasExercise = !!(userData.exerciseLog || {})[dateStr]
              const hasFasting  = fastingDates.has(dateStr)

              return (
                <button
                  key={i}
                  onClick={() => !isFuture && setSelected(dateStr)}
                  disabled={isFuture}
                  className="flex flex-col items-center py-1.5 gap-0.5"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: t.accent, color: '#fff' }
                        : isToday
                        ? { color: t.accent, fontWeight: 700 }
                        : isFuture
                        ? { color: '#d1d5db' }
                        : { color: '#374151' }
                    }
                  >
                    {day}
                  </div>
                  <div className="flex gap-0.5 h-1.5 items-center">
                    {hasFood     && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {hasWater    && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    {hasSleep    && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                    {hasExercise && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {hasFasting  && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-3 py-2.5 border-t border-gray-100 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Food
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Water
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Sleep
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Exercise
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Fasting
            </span>
          </div>
        </div>

        {/* Day detail */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <h2 className="font-bold text-gray-800 text-base">{formatDisplay(selected)}</h2>

          {/* Food */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Utensils size={14} className="text-green-500" /> Food
              </div>
              {foodEntries.length > 0 && (
                <span className="text-sm font-bold text-green-600">{totalCals} cal</span>
              )}
            </div>
            {foodEntries.length === 0 ? (
              <p className="text-xs text-gray-400">Nothing logged</p>
            ) : (
              <div className="space-y-1">
                {foodEntries.map(e => (
                  <div key={e.id} className="flex justify-between items-baseline text-sm">
                    <span className="text-gray-700 truncate mr-2 flex-1">{e.name}</span>
                    <span className="text-gray-400 shrink-0 text-xs">{e.calories} cal</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs pt-1.5 border-t border-gray-100 text-gray-500 font-medium">
                  <span>Goal: {userData.calorieGoal} cal</span>
                  <span className={totalCals > userData.calorieGoal ? 'text-red-500' : 'text-green-600'}>
                    {totalCals > userData.calorieGoal
                      ? `+${totalCals - userData.calorieGoal} over`
                      : `${userData.calorieGoal - totalCals} remaining`}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Exercise */}
          <section>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Dumbbell size={14} className="text-emerald-500" /> Exercise
            </div>
            <p className={`text-sm mt-1 font-medium ${exercised ? 'text-emerald-600' : 'text-gray-400'}`}>
              {exercised ? '✓ 30+ minutes logged' : 'Not logged'}
            </p>
          </section>

          {/* Fasting */}
          <section>
            <button
              className="w-full flex items-center justify-between mb-2"
              onClick={() => setFastingExpanded(v => !v)}
            >
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Timer size={14} className="text-orange-400" /> Fasting
                {fastingForDay.length > 0 && (
                  <span className="text-sm font-bold text-orange-500 ml-1">
                    {fastingForDay.length} fast{fastingForDay.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                {!fastingExpanded && <span>History</span>}
                {fastingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {!fastingExpanded && (
              fastingForDay.length === 0 ? (
                <p className="text-xs text-gray-400">No fasts logged</p>
              ) : (
                <div className="space-y-1.5">
                  {fastingForDay.map(entry => (
                    <div key={entry.id} className="rounded-lg px-3 py-2 bg-orange-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-500">{entry.protocol}</span>
                        <span className="text-xs font-semibold text-gray-700">{formatFastDuration(entry.durationMs)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {' → '}
                        {new Date(entry.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

            {fastingExpanded && (() => {
              const history = getFastingHistory()
              if (!history.length) return <p className="text-xs text-gray-400">No fasts logged yet.</p>
              return (
                <div className="space-y-2">
                  {history.map(entry => (
                    <div key={entry.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-500">
                          {new Date(entry.endTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs font-bold text-orange-500">{entry.protocol}</span>
                        <span className="text-xs font-semibold text-gray-700">{formatFastDuration(entry.durationMs)}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {' → '}
                        {new Date(entry.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>

          {/* Water */}
          <section>
            <button
              className="w-full flex items-center justify-between mb-2"
              onClick={() => setWaterExpanded(v => !v)}
            >
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Droplets size={14} className="text-blue-500" /> Water
                {waterOz > 0 && (
                  <span className="text-sm font-bold text-blue-600 ml-1">{waterOz} oz</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                {!waterExpanded && <span>History</span>}
                {waterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Selected day */}
            {!waterExpanded && (
              waterOz === 0 ? (
                <p className="text-xs text-gray-400">Nothing logged</p>
              ) : (
                <div className="space-y-1">
                  <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.min((waterOz / userData.waterGoalOz) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {waterOz} of {userData.waterGoalOz} oz goal ({Math.round((waterOz / userData.waterGoalOz) * 100)}%)
                  </p>
                </div>
              )
            )}

            {/* Full water history */}
            {waterExpanded && (() => {
              const history = getWaterHistory()
              if (!history.length) return <p className="text-xs text-gray-400">No water logged yet.</p>
              return (
                <div className="space-y-2">
                  {history.map(([date, oz]) => (
                    <div key={date} className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600">{formatDisplay(date)}</span>
                        <span className="text-xs font-bold text-blue-600">{oz} oz</span>
                      </div>
                      <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${Math.min((oz / userData.waterGoalOz) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>

          {/* Sleep */}
          <section>
            <button
              className="w-full flex items-center justify-between mb-2"
              onClick={() => setSleepExpanded(v => !v)}
            >
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Moon size={14} className="text-indigo-500" /> Sleep
                {sleep && (
                  <span className="text-sm font-bold text-indigo-600 ml-1">{sleep.hours}h</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                {!sleepExpanded && <span>History</span>}
                {sleepExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Selected day detail */}
            {!sleepExpanded && (
              !sleep ? (
                <p className="text-xs text-gray-400">Nothing logged</p>
              ) : (
                <SleepDetail sleep={sleep} sleepAidDisplay={sleepAidDisplay} />
              )
            )}

            {/* Full sleep history */}
            {sleepExpanded && (() => {
              const history = getSleepHistory()
              if (!history.length) return <p className="text-xs text-gray-400">No sleep logged yet.</p>
              return (
                <div className="space-y-3">
                  {history.map(([date, s]) => (
                    <div key={date} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{formatDisplay(date)}</p>
                      <SleepDetail sleep={s} sleepAidDisplay={sleepAidDisplay} />
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>
        </div>
      </div>
    </div>
  )
}
