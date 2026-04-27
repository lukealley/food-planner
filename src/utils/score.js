import { todayMT, prevDay } from './dateUtils.js'

function getLast7Days() {
  const days = []
  let d = todayMT()
  for (let i = 0; i < 7; i++) {
    days.push(d)
    d = prevDay(d)
  }
  return days
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null
}

function calorieScore(consumed, goal) {
  if (!goal) return null
  const r = consumed / goal
  if (r >= 0.85 && r <= 1.10) return 100
  if (r >= 0.75 && r <= 1.20) return 80
  if (r >= 0.65 && r <= 1.30) return 60
  if (r > 1.30) return Math.max(10, Math.round(60 - (r - 1.30) * 150))
  return Math.max(10, Math.round(r * 75))
}

function sleepScore(entry) {
  const effective = entry.hours - (entry.wakeMinutes || 0) / 60
  if (effective >= 8)  return 100
  if (effective >= 7)  return 82
  if (effective >= 6)  return 62
  if (effective >= 5)  return 38
  return 18
}

export function computeWeekScore(userData) {
  const days = getLast7Days()
  const cal = [], water = [], sleep = []

  days.forEach(date => {
    const entries = userData.foodLog[date] || []
    if (entries.length > 0) {
      const consumed = entries.reduce((s, e) => s + (e.calories || 0), 0)
      cal.push(calorieScore(consumed, userData.calorieGoal))
    }

    const oz = userData.waterLog[date] || 0
    water.push(Math.min(100, Math.round((oz / (userData.waterGoalOz || 64)) * 100)))

    const s = userData.sleepLog[date]
    if (s) sleep.push(sleepScore(s))
  })

  const calAvg   = avg(cal)
  const waterAvg = avg(water)
  const sleepAvg = avg(sleep)

  const parts = []
  if (calAvg   != null) parts.push({ score: calAvg,   weight: 4 })
  if (waterAvg != null) parts.push({ score: waterAvg, weight: 3 })
  if (sleepAvg != null) parts.push({ score: sleepAvg, weight: 3 })

  if (!parts.length) return null

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0)
  const overall = Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight)

  return { overall, calories: calAvg, water: waterAvg, sleep: sleepAvg }
}

export function scoreLabel(n) {
  if (n == null) return { text: '—',     color: '#6b7280' }
  if (n >= 85)   return { text: 'Great', color: '#22c55e' }
  if (n >= 70)   return { text: 'Good',  color: '#84cc16' }
  if (n >= 50)   return { text: 'Fair',  color: '#f59e0b' }
  return               { text: 'Low',   color: '#f87171' }
}
