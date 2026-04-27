import { useState, useEffect } from 'react'
import { Timer, Play, Square, ChevronDown } from 'lucide-react'
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

export default function FastingCard() {
  const { activeUser, users, setFastingProtocol, startFast, stopFast } = useAppStore()
  const t = themes[activeUser]
  const { fastingProtocol, fastingStart } = users[activeUser]

  const [now, setNow] = useState(Date.now())
  const [showProtocols, setShowProtocols] = useState(false)

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

  const orange = activeUser === 'hers' ? '#c9a96e' : '#f97316'
  const orangeLight = activeUser === 'hers' ? '#fdf5ec' : '#fff7ed'

  return (
    <div
      className="rounded-2xl shadow-sm p-4"
      style={{
        background: orangeLight,
        border: `1px solid ${activeUser === 'hers' ? '#eed9b8' : '#fed7aa'}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer size={20} style={{ color: orange }} />
          <span className="font-semibold text-gray-800">Fasting</span>
        </div>
        <div className="relative">
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
          style={
            fastingStart
              ? { background: '#fee2e2', color: '#dc2626' }
              : { background: orange, color: '#fff' }
          }
        >
          {fastingStart ? <><Square size={16} /> Stop Fast</> : <><Play size={16} /> Start Fast</>}
        </button>
      </div>

      <div className="flex justify-between text-xs text-gray-400 border-t pt-3 mt-2" style={{ borderColor: orange + '33' }}>
        <span>Fast: {fastHours}h</span>
        <span>Eating window: {eatHours}h</span>
      </div>
    </div>
  )
}
