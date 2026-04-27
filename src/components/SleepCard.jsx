import { useState, useEffect } from 'react'
import { Moon, ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'

import { todayMT, yesterdayMT } from '../utils/dateUtils.js'
const todayStr  = todayMT
const yesterStr = yesterdayMT

function sleepQualityLabel(hours) {
  if (hours >= 8) return { label: 'Excellent', color: '#16a34a' }
  if (hours >= 7) return { label: 'Good',      color: '#22c55e' }
  if (hours >= 6) return { label: 'Fair',      color: '#f59e0b' }
  return               { label: 'Poor',      color: '#ef4444' }
}

function avgSleep(sleepLog) {
  const entries = Object.values(sleepLog).filter(e => e?.hours)
  if (!entries.length) return null
  return (entries.reduce((s, e) => s + e.hours, 0) / entries.length).toFixed(1)
}

async function requestAndScheduleNotification() {
  if (!('Notification' in window)) return { ok: false, reason: 'not-supported' }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER' })
  }
  return { ok: true }
}

export default function SleepCard() {
  const { activeUser, users, logSleep } = useAppStore()
  const t = themes[activeUser]
  const { sleepLog } = users[activeUser]

  const [expanded,     setExpanded]     = useState(false)
  const [bedtime,      setBedtime]      = useState('22:00')
  const [waketime,     setWaketime]     = useState('06:30')
  const [wakeMinutes,  setWakeMinutes]  = useState('')
  const [napMinutes,   setNapMinutes]   = useState('')
  const [sleepAid,     setSleepAid]     = useState('none')
  const [sleepAidOther, setSleepAidOther] = useState('')
  const [notifStatus,  setNotifStatus]  = useState(
    () => localStorage.getItem('sleep-notif') || 'off'
  )

  // Last night's sleep = today's entry (logged this morning) or yesterday's entry
  const lastNightEntry = sleepLog[todayStr()] || sleepLog[yesterStr()] || null
  const avg = avgSleep(sleepLog)

  // Effective sleep = time in bed minus time awake during the night
  const effectiveHours = lastNightEntry
    ? +(lastNightEntry.hours - (lastNightEntry.wakeMinutes || 0) / 60).toFixed(1)
    : null
  const quality = effectiveHours != null ? sleepQualityLabel(effectiveHours) : null

  // Re-ping the SW each time the component mounts so the timer stays fresh
  useEffect(() => {
    if (notifStatus === 'on' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.active?.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER' })
      })
    }
  }, [notifStatus])

  function calcHours(bed, wake) {
    const [bh, bm] = bed.split(':').map(Number)
    const [wh, wm] = wake.split(':').map(Number)
    let mins = (wh * 60 + wm) - (bh * 60 + bm)
    if (mins < 0) mins += 24 * 60
    return +(mins / 60).toFixed(1)
  }

  function handleLog() {
    const hours = calcHours(bedtime, waketime)
    const wake  = parseInt(wakeMinutes) || 0
    logSleep(activeUser, todayStr(), {
      hours,
      bedtime,
      waketime,
      wakeMinutes: wake,
      napMinutes: parseInt(napMinutes) || 0,
      sleepAid,
      sleepAidOther: sleepAid === 'other' ? sleepAidOther : '',
    })
    setExpanded(false)
  }

  async function toggleNotification() {
    if (notifStatus === 'on') {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        reg.active?.postMessage({ type: 'CANCEL_SLEEP_REMINDER' })
      }
      localStorage.setItem('sleep-notif', 'off')
      setNotifStatus('off')
      return
    }

    const result = await requestAndScheduleNotification()
    if (result.ok) {
      localStorage.setItem('sleep-notif', 'on')
      setNotifStatus('on')
    } else if (result.reason === 'denied') {
      localStorage.setItem('sleep-notif', 'denied')
      setNotifStatus('denied')
    } else {
      localStorage.setItem('sleep-notif', 'unsupported')
      setNotifStatus('unsupported')
    }
  }

  return (
    <div
      className="rounded-2xl shadow-sm p-4"
      style={{
        background: activeUser === 'hers' ? '#f5f0ff' : '#fff',
        border: activeUser === 'hers' ? '1px solid #e0d0f0' : 'none',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setExpanded(e => !e)}>
          <Moon size={20} className="text-indigo-500" />
          <span className="font-semibold text-gray-800">Last Night's Sleep</span>
        </button>
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button
            onClick={toggleNotification}
            title={notifStatus === 'on' ? 'Disable 8am reminder' : 'Enable 8am reminder'}
            className="p-1 rounded-lg transition-colors"
            style={{
              color: notifStatus === 'on' ? '#6366f1' : '#d1d5db',
              background: notifStatus === 'on' ? '#eef2ff' : 'transparent',
            }}
          >
            {notifStatus === 'on' ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
          {/* Sleep quality / prompt */}
          {lastNightEntry ? (
            <span className="text-sm font-semibold" style={{ color: quality.color }}>
              {effectiveHours}h — {quality.label}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Not logged</span>
          )}
          <button onClick={() => setExpanded(e => !e)}>
            {expanded
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Notification status messages */}
      {notifStatus === 'denied' && (
        <p className="text-xs text-amber-600 mb-2">
          Notifications blocked. Enable them in your browser settings, then try again.
        </p>
      )}
      {notifStatus === 'unsupported' && (
        <p className="text-xs text-gray-400 mb-2">Push notifications aren't supported in this browser.</p>
      )}
      {notifStatus === 'on' && (
        <p className="text-xs text-indigo-400 mb-1">8am reminder is on</p>
      )}

      {/* Collapsed bar */}
      {lastNightEntry && !expanded && (
        <div className="mt-2">
          {/* Stacked bar: effective sleep (indigo) + awake time (red) */}
          <div className="relative h-2.5 bg-indigo-50 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-400 rounded-l-full transition-all duration-500"
              style={{ width: `${Math.min(effectiveHours / 9, 1) * 100}%` }}
            />
            {lastNightEntry.wakeMinutes > 0 && (
              <div
                className="h-full bg-red-300 transition-all duration-500"
                style={{ width: `${Math.min((lastNightEntry.wakeMinutes / 60) / 9, 1) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{lastNightEntry.bedtime && `Bed ${lastNightEntry.bedtime}`}</span>
            {lastNightEntry.wakeMinutes > 0 && (
              <span className="text-red-400">{lastNightEntry.wakeMinutes}m awake</span>
            )}
            <span>{lastNightEntry.waketime && `Up ${lastNightEntry.waketime}`}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-indigo-400">{effectiveHours}h effective sleep</span>
            {avg && <span className="text-gray-400">avg {avg}h</span>}
          </div>
        </div>
      )}

      {/* Expanded form */}
      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bedtime (last night)</label>
              <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Wake time (this morning)</label>
              <input type="time" value={waketime} onChange={e => setWaketime(e.target.value)} className="input" />
            </div>
          </div>

          {/* Awake in the night */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Awake in the middle of the night (minutes)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="480"
                placeholder="0"
                value={wakeMinutes}
                onChange={e => setWakeMinutes(e.target.value)}
                className="input w-24 text-center"
              />
              <div className="flex gap-1">
                {[15, 30, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => setWakeMinutes(String(m))}
                    className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: wakeMinutes === String(m) ? '#fca5a5' : '#fef2f2',
                      color: wakeMinutes === String(m) ? '#991b1b' : '#ef4444',
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nap */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nap the day before (minutes, optional)</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={napMinutes}
                onChange={e => setNapMinutes(e.target.value)}
                className="input w-24 text-center"
              />
              <div className="flex gap-1">
                {[20, 30, 45, 60, 90].map(m => (
                  <button
                    key={m}
                    onClick={() => setNapMinutes(String(m))}
                    className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: napMinutes === String(m) ? '#c7d2fe' : '#eef2ff',
                      color: napMinutes === String(m) ? '#3730a3' : '#6366f1',
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sleep aid */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sleep aid taken?</label>
            <select
              value={sleepAid}
              onChange={e => setSleepAid(e.target.value)}
              className="input"
            >
              <option value="none">None</option>
              <option value="melatonin">Melatonin</option>
              <option value="magnesium">Magnesium Oxide</option>
              <option value="nyquil">NyQuil</option>
              <option value="tylenol_pm">Tylenol PM</option>
              <option value="unisom">Unisom</option>
              <option value="other">Other</option>
            </select>
            {sleepAid === 'other' && (
              <input
                className="input mt-2"
                placeholder="What did you take?"
                value={sleepAidOther}
                onChange={e => setSleepAidOther(e.target.value)}
              />
            )}
          </div>

          {/* Summary */}
          <div className="bg-indigo-50 rounded-xl px-3 py-2">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-400">In bed</p>
                <p className="text-indigo-600 font-bold">{calcHours(bedtime, waketime)}h</p>
              </div>
              {parseInt(wakeMinutes) > 0 && (
                <>
                  <div className="text-gray-300">−</div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-400">Awake</p>
                    <p className="text-red-400 font-bold">{wakeMinutes}m</p>
                  </div>
                  <div className="text-gray-300">=</div>
                  <div className="text-center flex-1">
                    <p className="text-xs text-gray-400">Effective</p>
                    <p className="text-indigo-700 font-bold">
                      {+(calcHours(bedtime, waketime) - parseInt(wakeMinutes) / 60).toFixed(1)}h
                    </p>
                  </div>
                </>
              )}
              {!parseInt(wakeMinutes) && (
                <div className="text-center flex-1">
                  <p className="text-xs text-indigo-400">slept straight through</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLog}
            className="w-full font-semibold py-2.5 rounded-xl text-white"
            style={{ background: '#6366f1' }}
          >
            Log Sleep
          </button>
        </div>
      )}
    </div>
  )
}
