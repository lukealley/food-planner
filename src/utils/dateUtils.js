// All dates are computed in Mountain Time (America/Denver)

export function todayMT() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
}

export function yesterdayMT() {
  return prevDay(todayMT())
}

export function prevDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d - 1)
  return fmt(dt)
}

export function nextDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + 1)
  return fmt(dt)
}

function fmt(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function friendlyDate(dateStr) {
  const today = todayMT()
  const yesterday = yesterdayMT()
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
