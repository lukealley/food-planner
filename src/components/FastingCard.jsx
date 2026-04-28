import { useState, useEffect } from 'react'
import { Timer, Play, Square, ChevronDown, Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'

const PROTOCOLS = [
  { value: '14:10', label: '14:10', desc: 'Beginner friendly' },
  { value: '16:8',  label: '16:8',  desc: 'Most popular' },
  { value: '18:6',  label: '18:6',  desc: 'Intermediate' },
  { value: '20:4',  label: '20:4',  desc: 'Advanced' },
]

function formatDuration(ms) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDurationShort(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function isoToLocalDatetime(isoStr) {
  const d = new Date(isoStr)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-') + 'T' + [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join(':')
}

function formatFastDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function FastingCard() {
  const { activeUser, users, setFastingProtocol, startFast, stopFast, addPastFast, deleteFastEntry } = useAppStore()
  const t = themes[activeUser]
  const { fastingProtocol, fastingStart, fastingLog } = users[activeUser]

  const [tab, setTab]             = useState('timer')
  const [now, setNow]             = useState(Date.now())
  const [showProtocols, setShowProtocols] = useState(false)

  const [pastStart, setPastStart] = useState(() => isoToLocalDatetime(new Date(Date.now() - 16 * 3600000).toISOString()))
  const [pastEnd,   setPastEnd]   = useState(() => isoToLocalDatetime(new Date().toISOString()))
  const [pastProtocol, setPastProtocol] = useState(fastingProtocol)
  const [pastSaved, setPastSaved] = useState(false)

  useEffect(() => {
    if (!fastingStart) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [fastingStart])

  const fastHours = parseInt(fastingProtocol.split(':')[0])
  const eatHours  = parseInt(fastingProtocol.split(':')[1])
  const targetMs  = fastHours * 3600 * 1000

  const elapsed   = fastingStart ? now - new Date(fastingStart).getTime() : 0
  const pct       = fastingStart ? Math.min(elapsed / targetMs, 1) : 0
  const done      = elapsed >= targetMs
  const remaining = fastingStart ? Math.max(targetMs - elapsed, 0) : targetMs

  const eatingWindowStart = fastingStart
    ? new Date(new Date(fastingStart).getTime() + targetMs)
        .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  const circumference = 2 * Math.PI * 44
  const strokeDash    = circumference * pct

  const orange      = activeUser === 'hers' ? '#c9a96e' : '#f97316'
  const orangeLight = activeUser === 'hers' ? '#fdf5ec' : '#fff7ed'

  const pastDurationMs = pastStart && pastEnd
    ? new Date(pastEnd).getTime() - new Date(pastStart).getTime()
    : 0
  const pastValid = pastDurationMs > 0 && pastDurationMs < 72 * 3600000

  function handleAddPast() {
    if (!pastValid) return
    const endDate = new Date(pastEnd).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
    addPastFast(activeUser, {
      protocol: pastProtocol,
      startTime: new Date(pastStart).toISOString(),
      endTime:   new Date(pastEnd).toISOString(),
      durationMs: pastDurationMs,
      date: endDate,
    })
    setPastSaved(true)
    setTimeout(() => setPastSaved(false), 2000)
  }

  const sortedLog = [...(fastingLog || [])].sort((a, b) =>
    b.startTime.localeCompare(a.startTime)
  )

  const TABS = [
    { id: 'timer',   label: 'Timer' },
    { id: 'add',     label: 'Add Past' },
    { id: 'history', label: 'History' },
  ]

  return (
    <div
      className="rounded-2xl shadow-sm p-4"
      style={{ background: orangeLight, border: `1px solid ${activeUser === 'hers' ? '#eed9b8' : '#fed7aa'}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer size={20} style={{ color: orange }} />
          <span className="font-semibold text-gray-800">Fasting</span>
        </div>
        <div className="flex rounded-lg overflow-hidden text-xs font-semibold" style={{ border: `1px solid ${orange}44` }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-2.5 py-1 transition-colors"
              style={{ background: tab === id ? orange : 'transparent', color: tab === id ? '#fff' : orange }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timer tab ── */}
      {tab === 'timer' && (
        <>
          <div className="flex justify-end mb-2 relative">
            <button
              onClick={() => setShowProtocols(s => !s)}
              className="flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: orange + '22', color: orange }}
            >
              {fastingProtocol} <ChevronDown size={14} />
            </button>
            {showProtocols && (
              <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden w-48">
                {PROTOCOLS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setFastingProtocol(activeUser, p.value); setShowProtocols(false) }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: fastingProtocol === p.value ? orange : '#374151', fontWeight: fastingProtocol === p.value ? 600 : 400 }}
                  >
                    {p.label} <span className="text-gray-400 text-xs">— {p.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center py-2">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke={orange + '33'} strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke={done ? '#22c55e' : orange}
                  strokeWidth="8"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {fastingStart ? (
                  <>
                    <span className="text-base font-bold font-mono tracking-tight">
                      {done ? 'Done!' : formatDuration(remaining)}
                    </span>
                    <span className="text-xs text-gray-400">{done ? 'window open' : 'remaining'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-bold" style={{ color: orange }}>{fastHours}h</span>
                    <span className="text-xs text-gray-400">fast</span>
                  </>
                )}
              </div>
            </div>

            {fastingStart && (
              <div className="text-center mt-1 space-y-0.5">
                <p className="text-xs text-gray-400">
                  Started: {new Date(fastingStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="text-xs font-medium" style={{ color: orange }}>
                  {done ? 'Eating window is open!' : `Eat after ${eatingWindowStart}`}
                </p>
              </div>
            )}

            <button
              onClick={() => fastingStart ? stopFast(activeUser) : startFast(activeUser)}
              className="mt-3 flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-colors"
              style={fastingStart
                ? { background: '#fee2e2', color: '#dc2626' }
                : { background: orange, color: '#fff' }}
            >
              {fastingStart ? <><Square size={16} /> Stop Fast</> : <><Play size={16} /> Start Fast</>}
            </button>
          </div>

          <div className="flex justify-between text-xs text-gray-400 border-t pt-3 mt-2" style={{ borderColor: orange + '33' }}>
            <span>Fast: {fastHours}h</span>
            <span>Eating window: {eatHours}h</span>
          </div>
        </>
      )}

      {/* ── Add Past tab ── */}
      {tab === 'add' && (
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Protocol</label>
            <div className="flex gap-2 flex-wrap">
              {PROTOCOLS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPastProtocol(p.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    background: pastProtocol === p.value ? orange : orange + '22',
                    color: pastProtocol === p.value ? '#fff' : orange,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fast started</label>
            <input
              type="datetime-local"
              value={pastStart}
              onChange={e => setPastStart(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fast ended</label>
            <input
              type="datetime-local"
              value={pastEnd}
              onChange={e => setPastEnd(e.target.value)}
              className="input"
            />
          </div>

          {pastDurationMs > 0 && pastDurationMs < 72 * 3600000 && (
            <div className="rounded-xl px-3 py-2" style={{ background: orange + '22' }}>
              <span className="text-sm font-semibold" style={{ color: orange }}>
                Duration: {formatDurationShort(pastDurationMs)}
              </span>
            </div>
          )}
          {pastDurationMs < 0 && (
            <p className="text-xs text-red-400">End time must be after start time</p>
          )}

          <button
            onClick={handleAddPast}
            disabled={!pastValid}
            className="w-full font-semibold py-2.5 rounded-xl text-white transition-colors disabled:opacity-40"
            style={{ background: orange }}
          >
            {pastSaved ? '✓ Saved!' : 'Save Fast'}
          </button>
        </div>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <div className="space-y-2 mt-1">
          {sortedLog.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No fasts logged yet.</p>
          ) : (
            sortedLog.map(entry => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-2 rounded-xl px-3 py-2.5"
                style={{ background: orange + '18' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: orange }}>{entry.protocol}</span>
                    <span className="text-xs font-semibold text-gray-700">{formatDurationShort(entry.durationMs)}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatFastDate(entry.startTime)} → {new Date(entry.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => deleteFastEntry(activeUser, entry.id)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
