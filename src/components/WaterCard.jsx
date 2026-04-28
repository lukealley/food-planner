import { useState } from 'react'
import { Droplets, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { todayMT, prevDay, nextDay, friendlyDate } from '../utils/dateUtils.js'
import { celebrate } from '../utils/celebrate.js'
import { goalCelebrate } from '../utils/goalCelebrate.js'

const QUICK_ADD = [8, 12, 16, 24]
const todayStr = todayMT

export default function WaterCard() {
  const { activeUser, users, addWater, resetWater } = useAppStore()
  const t = themes[activeUser]
  const { waterGoalOz, waterLog } = users[activeUser]

  const [logDate, setLogDate] = useState(todayStr())
  const isToday = logDate === todayStr()

  const oz      = waterLog[logDate] || 0
  const pct     = Math.min(oz / waterGoalOz, 1)
  const cups    = (oz / 8).toFixed(1)
  const goalCups = Math.round(waterGoalOz / 8)

  return (
    <div
      className="rounded-2xl shadow-sm p-4"
      style={{
        background: activeUser === 'hers' ? '#f0f4ff' : '#fff',
        border: activeUser === 'hers' ? '1px solid #d8e0f0' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={20} className="text-blue-500" />
          <span className="font-semibold text-gray-800">Water</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Day navigator */}
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
          <span className="text-xs text-gray-400 ml-1">{cups} / {goalCups} cups</span>
          <button onClick={() => resetWater(activeUser, logDate)} className="text-gray-300 hover:text-gray-400 transition-colors ml-1">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="relative h-3 bg-blue-50 rounded-full overflow-hidden mb-3">
        <div
          className="absolute inset-y-0 left-0 bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="flex gap-1 mb-3">
        {Array.from({ length: goalCups }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-5 rounded-sm transition-colors duration-300"
            style={{ background: i < Math.floor(oz / 8) ? '#60a5fa' : '#eff6ff' }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        {QUICK_ADD.map((oz_) => (
          <button
            key={oz_}
            onClick={() => {
              const prev = waterLog[logDate] || 0
              addWater(activeUser, logDate, oz_)
              if (prev < waterGoalOz && prev + oz_ >= waterGoalOz) goalCelebrate()
              else celebrate()
            }}
            className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors"
            style={{ background: '#dbeafe', color: '#1d4ed8' }}
          >
            +{oz_}oz
          </button>
        ))}
      </div>

      {oz >= waterGoalOz && (
        <p className="text-center text-xs text-blue-500 font-medium mt-2">Goal reached! Great job!</p>
      )}
    </div>
  )
}
