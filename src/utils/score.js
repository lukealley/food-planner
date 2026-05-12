import { todayMT, prevDay } from './dateUtils.js'

const COR_ITEMS = 10

export const DEFAULT_WEIGHTS = {
  calories: 20,
  water:    20,
  sleep:    20,
  exercise: 20,
  corCard:  10,
  fasting:  10,
}

export const CATEGORY_META = [
  { key: 'calories', label: 'Calories', color: '#22c55e', abbr: 'Cal' },
  { key: 'water',    label: 'Water',    color: '#3b82f6', abbr: 'H₂O' },
  { key: 'sleep',    label: 'Sleep',    color: '#6366f1', abbr: 'Slp' },
  { key: 'exercise', label: 'Exercise', color: '#10b981', abbr: 'Exr' },
  { key: 'corCard',  label: 'Cor-Card', color: '#7c3aed', abbr: 'Cor' },
  { key: 'fasting',  label: 'Fasting',  color: '#f97316', abbr: 'Fst' },
]

// ─── Individual category scorers (0-100) ──────────────────────────────────────

function calorieScore(consumed, goal) {
  if (!goal) return null
  if (consumed === 0) return 0
  const r = consumed / goal
  if (r >= 0.85 && r <= 1.10) return 100
  if (r >= 0.75 && r <= 1.20) return 80
  if (r >= 0.65 && r <= 1.30) return 60
  if (r > 1.30) return Math.max(10, Math.round(60 - (r - 1.30) * 150))
  return Math.max(0, Math.round(r * 80))
}

function sleepScore(entry) {
  if (!entry?.hours) return 0
  const effective = entry.hours - (entry.wakeMinutes || 0) / 60
  if (effective >= 8)  return 100
  if (effective >= 7)  return 82
  if (effective >= 6)  return 62
  if (effective >= 5)  return 38
  return 15
}

function corCardScore(dayLog) {
  if (!dayLog) return 0
  const done = Object.values(dayLog).filter(v => v?.done).length
  return Math.round((done / COR_ITEMS) * 100)
}

function fastingScore(userData, date) {
  const log = (userData.fastingLog || [])
  // Completed fast on this date
  const entry = log.find(e => (e.date || '') === date)
  if (entry) {
    const targetH  = parseInt((entry.protocol || '16:8').split(':')[0])
    const targetMs = targetH * 3600000
    return Math.min(100, Math.round((entry.durationMs / targetMs) * 100))
  }
  // Active fast (only meaningful for today)
  if (date === todayMT() && userData.fastingStart) {
    const elapsed  = Date.now() - new Date(userData.fastingStart).getTime()
    const targetH  = parseInt((userData.fastingProtocol || '16:8').split(':')[0])
    const targetMs = targetH * 3600000
    const pct = elapsed / targetMs
    return pct >= 1 ? 100 : Math.round(pct * 80)
  }
  return 0
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export function computeDayScore(userData, date, weights) {
  const w = weights || DEFAULT_WEIGHTS

  const entries  = userData.foodLog?.[date] || []
  const consumed = entries.reduce((s, e) => s + (e.calories || 0), 0)
  const calories = calorieScore(consumed, userData.calorieGoal)

  const oz    = userData.waterLog?.[date] || 0
  const water = Math.min(100, Math.round((oz / (userData.waterGoalOz || 64)) * 100))

  const sleep    = sleepScore(userData.sleepLog?.[date])
  const exercise = (userData.exerciseLog || {})[date] ? 100 : 0
  const corCard  = corCardScore((userData.corCardLog || {})[date])
  const fasting  = fastingScore(userData, date)

  const cats = { calories, water, sleep, exercise, corCard, fasting }

  const totalW = Object.keys(w).reduce((s, k) => s + (w[k] || 0), 0)
  if (!totalW) return null

  const overall = Math.round(
    Object.keys(w).reduce((s, k) => s + (cats[k] || 0) * (w[k] || 0), 0) / totalW
  )

  return { overall, ...cats }
}

// ─── History (last N days) ────────────────────────────────────────────────────

export function computeHistoryScores(userData, weights, numDays = 30) {
  const result = []
  let d = todayMT()
  for (let i = 0; i < numDays; i++) {
    const s = computeDayScore(userData, d, weights)
    result.unshift({ date: d, score: s?.overall ?? null, detail: s })
    d = prevDay(d)
  }
  return result
}

// ─── Labels & colors ──────────────────────────────────────────────────────────

export function scoreLabel(n) {
  if (n == null) return { text: '—',     color: '#6b7280' }
  if (n >= 85)   return { text: 'Great', color: '#22c55e' }
  if (n >= 70)   return { text: 'Good',  color: '#84cc16' }
  if (n >= 50)   return { text: 'Fair',  color: '#f59e0b' }
  return               { text: 'Low',   color: '#ef4444' }
}

export function categoryColor(score) {
  if (score == null) return '#374151'
  if (score >= 80)   return '#22c55e'
  if (score >= 60)   return '#84cc16'
  if (score >= 40)   return '#f59e0b'
  return '#ef4444'
}

// Keep for any remaining callers
export function computeWeekScore(userData) {
  return computeDayScore(userData, todayMT(), DEFAULT_WEIGHTS)
}
