import { useState } from 'react'
import {
  MessageCircle, Star, Dumbbell, Heart, Sun, Users,
  BookOpen, Smile, Utensils, Zap, X, ChevronLeft, Info,
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { todayMT, prevDay, nextDay, friendlyDate } from '../utils/dateUtils.js'
import { celebrate } from '../utils/celebrate.js'

// ─── The 10 Cor-Card items ────────────────────────────────────────────────────

const ITEMS = [
  {
    key: 'affirmation',
    label: 'Affirmation',
    icon: MessageCircle,
    color: '#7c3aed',
    placeholder: 'Write a positive affirmation…',
    description:
      'Write a positive affirmation to strengthen a healthier attachment to your true self. Think of it as internal boundary work — you are establishing healthy boundaries around who you truly are. You can\'t replace something with nothing.',
  },
  {
    key: 'celebrating',
    label: 'I Am Celebrating',
    icon: Star,
    color: '#d97706',
    placeholder: 'What are you grateful for today?',
    description:
      'Actively look for things in your daily life that you have been blessed with. This is a principle of Gratitude — a simple acknowledgement of seeing God\'s hand in your life and helping to instill a deeper belief that you are loved and blessed.',
  },
  {
    key: 'physical',
    label: 'Physical',
    icon: Dumbbell,
    color: '#16a34a',
    placeholder: 'What is your physical goal today?',
    description:
      'Choose a physical wellness goal to accomplish today — something that gets your body moving and cared for. We need balance across all areas of wellness. Do this consciously and mindfully; you may already be doing many things, we just want to be more present during them.',
  },
  {
    key: 'emotional',
    label: 'Emotional',
    icon: Heart,
    color: '#e11d48',
    placeholder: 'What is your emotional goal today?',
    description:
      'Choose an emotional wellness goal — something that helps you process, express, or nurture your emotional health today. If we are depleted in any wellness area, we are "running on a flat" and can increase the likelihood of additional triggers and crises in life.',
  },
  {
    key: 'spiritual',
    label: 'Spiritual',
    icon: Sun,
    color: '#b45309',
    placeholder: 'What is your spiritual goal today?',
    description:
      'Choose a spiritual wellness goal — something that connects you to your faith, values, or sense of deeper purpose today. The wellness wheel reminds us that we need balance and that each area matters.',
  },
  {
    key: 'social',
    label: 'Social',
    icon: Users,
    color: '#0891b2',
    placeholder: 'What is your social goal today?',
    description:
      'Choose a social wellness goal — something that nurtures your relationships and connection with others today. Pick a goal and do it more consciously and mindfully.',
  },
  {
    key: 'intellectual',
    label: 'Intellectual',
    icon: BookOpen,
    color: '#4f46e5',
    placeholder: 'What is your intellectual goal today?',
    description:
      'Choose an intellectual wellness goal — something that engages your mind, curiosity, or creativity today. Conscious living means being more present in all areas, including how we grow mentally.',
  },
  {
    key: 'selfCompassion',
    label: 'Self-Compassion',
    icon: Smile,
    color: '#db2777',
    placeholder: 'What will you do for yourself today?',
    description:
      'Identify something you choose to do specifically for yourself to express love and self-compassion. Examples: a hobby, watching a favorite show, reading a book, treating yourself to something special, or taking a few quiet minutes to yourself. This is the practice of Nurturing.',
  },
  {
    key: 'foodPlan',
    label: 'Food Plan',
    icon: Utensils,
    color: '#059669',
    placeholder: 'What is your food plan or healthy goal today?',
    description:
      'Plan out your meals for the day, or set a simple healthy food goal — like eating a fruit or vegetable. Some people plan every meal; others just set one small healthy intention.',
  },
  {
    key: 'procrastination',
    label: 'Stop Putting It Off',
    icon: Zap,
    color: '#dc2626',
    placeholder: 'What have you been putting off that you can do today?',
    description:
      'Identify one thing you\'ve been procrastinating and commit to doing it today. Tomorrow never comes — if you want something done, do it today. One of the most common issues of change is making great plans and then saying "I\'ll start tomorrow."',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CorCard() {
  const { activeUser, users, updateCorCard } = useAppStore()
  const t = themes[activeUser]
  const userData = users[activeUser]

  const [logDate, setLogDate]     = useState(todayMT())
  const [infoItem, setInfoItem]   = useState(null)  // which item's info modal is open
  const [infoOpen, setInfoOpen]   = useState(false) // info panel open

  const isToday = logDate === todayMT()
  const dayLog  = (userData.corCardLog || {})[logDate] || {}

  function getItem(key) {
    return dayLog[key] || { text: '', done: false }
  }

  function setText(key, text) {
    updateCorCard(activeUser, logDate, key, { text })
  }

  function toggleDone(key) {
    const current = getItem(key)
    const wasDone = current.done
    updateCorCard(activeUser, logDate, key, { done: !wasDone })
    if (!wasDone) celebrate()
  }

  const completedCount = ITEMS.filter(item => getItem(item.key).done).length
  const pct = Math.round((completedCount / ITEMS.length) * 100)

  // Build 7-day strip: today and the 6 days before it
  function nDaysAgo(n) {
    let d = todayMT()
    for (let i = 0; i < n; i++) d = prevDay(d)
    return d
  }
  const sevenDays = Array.from({ length: 7 }, (_, i) => nDaysAgo(6 - i))

  function dayPct(dateStr) {
    const dl = (userData.corCardLog || {})[dateStr] || {}
    const done = ITEMS.filter(item => (dl[item.key] || {}).done).length
    return Math.round((done / ITEMS.length) * 100)
  }

  function dayAbbrev(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
  }

  function dayNum(dateStr) {
    return parseInt(dateStr.split('-')[2])
  }

  const accent = '#7c3aed'

  return (
    <div className="pb-28 min-h-screen" style={{ background: '#f5f3ff' }}>

      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Cor-Card</h1>
            <p className="text-sm text-purple-200 mt-0.5">A tool for conscious living</p>
          </div>
          <button
            onClick={() => setInfoOpen(v => !v)}
            className="p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <Info size={20} className="text-white" />
          </button>
        </div>

        {/* 7-day strip */}
        <div className="flex gap-1 mt-3">
          {/* Older-days arrow */}
          <button
            onClick={() => setLogDate(d => prevDay(d))}
            className="flex items-center justify-center w-7 shrink-0 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronLeft size={14} className="text-white" />
          </button>

          {sevenDays.map(dateStr => {
            const p       = dayPct(dateStr)
            const isSelected = dateStr === logDate
            const isTdy  = dateStr === todayMT()
            const radius = 16
            const circ   = 2 * Math.PI * radius
            const dash   = (p / 100) * circ
            const color  = p === 100 ? '#4ade80' : p > 0 ? '#c4b5fd' : 'rgba(255,255,255,0.3)'

            return (
              <button
                key={dateStr}
                onClick={() => setLogDate(dateStr)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                style={{ background: isSelected ? 'rgba(255,255,255,0.22)' : 'transparent' }}
              >
                {/* Day abbrev */}
                <span className="text-purple-200 leading-none" style={{ fontSize: '10px' }}>
                  {dayAbbrev(dateStr)}
                </span>

                {/* SVG ring with date number inside */}
                <div className="relative flex items-center justify-center" style={{ width: 38, height: 38 }}>
                  <svg width="38" height="38" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {/* Background ring */}
                    <circle cx="19" cy="19" r={radius} fill="none"
                      stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                    {/* Progress arc */}
                    {p > 0 && (
                      <circle cx="19" cy="19" r={radius} fill="none"
                        stroke={color} strokeWidth="3"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 19 19)"
                      />
                    )}
                  </svg>
                  <span
                    className="font-bold relative z-10"
                    style={{
                      fontSize: 13,
                      color: isSelected ? '#fff' : isTdy ? '#e9d5ff' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {dayNum(dateStr)}
                  </span>
                </div>

                {/* Pct label */}
                <span
                  className="font-semibold leading-none"
                  style={{ fontSize: '9px', color: p === 100 ? '#4ade80' : 'rgba(255,255,255,0.6)' }}
                >
                  {p > 0 ? `${p}%` : '—'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected day label */}
        <p className="text-center text-xs text-purple-200 mt-1.5">
          {friendlyDate(logDate)}{!isToday && (
            <button
              onClick={() => setLogDate(todayMT())}
              className="ml-2 text-white font-semibold underline underline-offset-2"
            >
              → Today
            </button>
          )}
        </p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-purple-200 mb-1">
            <span>{completedCount} of {ITEMS.length} complete</span>
            <span className="font-bold text-white">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#4ade80' : '#fff' }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ── Info panel ── */}
        {infoOpen && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-800">About the Cor-Card</p>
              <button onClick={() => setInfoOpen(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 px-4 pt-3 pb-2 leading-relaxed">
              The <strong>Cor-Card</strong> is a tool designed to help strengthen the Pre-Frontal Cortex
              of the brain and increase conscious living. Tap any icon below to learn about each of the
              10 daily items.
            </p>
            <div className="grid grid-cols-5 gap-3 px-4 pb-4 pt-2">
              {ITEMS.map(item => {
                const Icon = item.icon
                const isSelected = infoItem === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setInfoItem(isSelected ? null : item.key)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-95"
                      style={{
                        background: isSelected ? item.color : item.color + '18',
                        boxShadow: isSelected ? `0 4px 12px ${item.color}44` : 'none',
                      }}
                    >
                      <Icon size={20} style={{ color: isSelected ? '#fff' : item.color }} />
                    </div>
                    <span className="text-xs text-gray-500 text-center leading-tight" style={{ fontSize: '9px' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Description for selected icon */}
            {infoItem && (() => {
              const item = ITEMS.find(i => i.key === infoItem)
              if (!item) return null
              const Icon = item.icon
              return (
                <div className="mx-4 mb-4 rounded-xl p-3" style={{ background: item.color + '12' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.color }}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">{item.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Daily card items ── */}
        {ITEMS.map(item => {
          const Icon  = item.icon
          const entry = getItem(item.key)
          return (
            <div
              key={item.key}
              className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all"
              style={{ borderLeft: `4px solid ${entry.done ? item.color : '#e5e7eb'}` }}
            >
              <div className="p-4">
                {/* Row: icon + label + checkbox */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: item.color + '18' }}
                  >
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                  <span className="font-semibold text-gray-800 flex-1 text-sm">{item.label}</span>
                  <button
                    onClick={() => toggleDone(item.key)}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    style={{
                      borderColor: entry.done ? item.color : '#d1d5db',
                      background: entry.done ? item.color : '#fff',
                    }}
                  >
                    {entry.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Text input */}
                <textarea
                  value={entry.text}
                  onChange={e => setText(item.key, e.target.value)}
                  placeholder={item.placeholder}
                  rows={2}
                  className="w-full text-sm text-gray-700 placeholder-gray-300 resize-none rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: entry.done ? item.color + '0c' : '#f9fafb',
                    focusRingColor: item.color,
                    border: `1px solid ${entry.done ? item.color + '40' : '#f3f4f6'}`,
                  }}
                />

                {/* Done label */}
                {entry.done && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: item.color }}>✓ Done</p>
                )}
              </div>
            </div>
          )
        })}

        {/* Completion message */}
        {completedCount === ITEMS.length && (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <p className="text-2xl font-bold text-white">🎉 Perfect Day!</p>
            <p className="text-purple-200 text-sm mt-1">All 10 items complete. You're living consciously.</p>
          </div>
        )}
      </div>

      {/* Info item modal overlay */}
      {!infoOpen && infoItem && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setInfoItem(null)}>
          <div
            className="w-full max-w-md mx-auto rounded-t-3xl p-5 pb-10 shadow-2xl"
            style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const item = ITEMS.find(i => i.key === infoItem)
              if (!item) return null
              const Icon = item.icon
              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.color }}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-800 text-base">{item.label}</span>
                    <button onClick={() => setInfoItem(null)} className="ml-auto">
                      <X size={18} className="text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
