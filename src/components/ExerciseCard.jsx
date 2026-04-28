import { useState } from 'react'
import { Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { todayMT, prevDay, nextDay, friendlyDate } from '../utils/dateUtils.js'

export default function ExerciseCard() {
  const { activeUser, users, toggleExercise } = useAppStore()
  const t = themes[activeUser]
  const { exerciseLog } = users[activeUser]

  const [logDate, setLogDate] = useState(todayMT())
  const isToday = logDate === todayMT()
  const done = !!exerciseLog[logDate]

  return (
    <div
      className="rounded-2xl shadow-sm p-4"
      style={{
        background: activeUser === 'hers' ? '#f0fff4' : '#fff',
        border: activeUser === 'hers' ? '1px solid #c6e8d0' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={20} className="text-emerald-500" />
          <span className="font-semibold text-gray-800">Exercise</span>
        </div>

        {/* Day navigator */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLogDate(d => prevDay(d))}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-gray-500 w-16 text-center">
            {friendlyDate(logDate)}
          </span>
          <button
            onClick={() => setLogDate(d => nextDay(d))}
            disabled={isToday}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Checkbox row */}
      <button
        onClick={() => toggleExercise(activeUser, logDate)}
        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
        style={{
          background: done ? (activeUser === 'hers' ? '#dcfce7' : '#dcfce7') : '#f9fafb',
          border: `2px solid ${done ? '#22c55e' : '#e5e7eb'}`,
        }}
      >
        {/* Custom checkbox */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ background: done ? '#22c55e' : '#fff', border: `2px solid ${done ? '#22c55e' : '#d1d5db'}` }}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className="text-left">
          <p className="text-sm font-semibold" style={{ color: done ? '#15803d' : '#374151' }}>
            {done ? '30+ min — nice work!' : '30+ minutes of exercise'}
          </p>
          <p className="text-xs" style={{ color: done ? '#16a34a' : '#9ca3af' }}>
            {done ? 'Tap to unmark' : 'Tap to mark as done'}
          </p>
        </div>
      </button>
    </div>
  )
}
