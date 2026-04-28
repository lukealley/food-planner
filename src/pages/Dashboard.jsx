import { Link } from 'react-router-dom'
import { Plus, Camera, Barcode, Sparkles } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import CalorieRing from '../components/CalorieRing'
import WaterCard from '../components/WaterCard'
import SleepCard from '../components/SleepCard'
import FastingCard from '../components/FastingCard'
import CycleTracker from '../components/CycleTracker'
import ExerciseCard from '../components/ExerciseCard'

import { todayMT } from '../utils/dateUtils.js'
const todayStr = todayMT

export default function Dashboard() {
  const { activeUser, users, removeFoodEntry } = useAppStore()
  const t = themes[activeUser]
  const userData = users[activeUser]
  const { calorieGoal, foodLog, profile } = userData

  const entries  = foodLog[todayStr()] || []
  const consumed = entries.reduce((s, e) => s + (e.calories || 0), 0)
  const protein  = entries.reduce((s, e) => s + (e.protein  || 0), 0)

  const firstName = profile.name?.split(' ')[0] || (activeUser === 'his' ? 'Luke' : 'Love')

  return (
    <div className="pb-24">
      {/* Themed header */}
      <div className="px-4 pt-12 pb-6" style={{ backgroundColor: t.headerBg }}>
        <p className="text-sm" style={{ color: t.headerSubtext }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: t.headerText }}>
          {activeUser === 'his'
            ? `${greeting()}, ${firstName}.`
            : `Good ${greeting()}, ${firstName}.`}
        </h1>
        {activeUser === 'his' && (
          <p className="text-xs mt-1 font-medium tracking-widest uppercase" style={{ color: '#2d5a2d' }}>
            Stay disciplined. Stay strong.
          </p>
        )}
        {activeUser === 'hers' && (
          <p className="text-xs mt-1 italic" style={{ color: t.headerSubtext }}>
            Today is a new opportunity to nourish yourself well.
          </p>
        )}
      </div>

      <div
        className="min-h-screen"
        style={{ backgroundColor: activeUser === 'hers' ? '#fdf8f5' : '#f9fafb' }}
      >
        <div className="px-4 pt-4 space-y-4">
          {/* Calorie ring */}
          <div
            className="rounded-2xl p-5 flex flex-col items-center shadow-sm"
            style={{
              background: activeUser === 'his' ? '#ffffff' : '#fffaf7',
              border: activeUser === 'hers' ? `1px solid ${t.cardBorder}` : 'none',
            }}
          >
            <CalorieRing consumed={consumed} goal={calorieGoal} theme={t} />
            <div className="flex gap-3 mt-4 flex-wrap justify-center">
              <MacroPill label="Protein" value={`${protein}g`} t={t} />
            </div>
          </div>

          {/* Quick-add row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/log', Icon: Plus, label: 'Add Food' },
              { to: '/log?mode=barcode', Icon: Barcode, label: 'Barcode' },
              { to: '/log?mode=photo', Icon: Camera, label: 'Photo' },
            ].map(({ to, Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 rounded-2xl shadow-sm p-4"
                style={{
                  background: activeUser === 'his' ? '#ffffff' : '#fffaf7',
                  border: activeUser === 'hers' ? `1px solid ${t.cardBorder}` : 'none',
                }}
              >
                <Icon size={24} style={{ color: t.accent }} />
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </Link>
            ))}
          </div>

          {/* AI suggestions banner */}
          <Link
            to="/suggestions"
            className="flex items-center gap-3 rounded-2xl shadow-sm p-4"
            style={{
              background: activeUser === 'his'
                ? 'linear-gradient(135deg, #0d1f0d, #1a3a1a)'
                : 'linear-gradient(135deg, #3d1f25, #6b3a45)',
              color: '#fff',
            }}
          >
            <Sparkles size={22} style={{ color: t.accent }} />
            <div>
              <p className="font-semibold text-sm">AI Meal Suggestions</p>
              <p className="text-xs opacity-70">Based on your goals</p>
            </div>
          </Link>

          {/* Cycle tracker — hers only */}
          {activeUser === 'hers' && <CycleTracker />}

          {/* Water, Sleep, Exercise, Fasting */}
          <WaterCard />
          <SleepCard />
          <ExerciseCard />
          <FastingCard />

          {/* Today's log */}
          {entries.length > 0 && (
            <div
              className="rounded-2xl shadow-sm p-4"
              style={{
                background: activeUser === 'hers' ? '#fffaf7' : '#fff',
                border: activeUser === 'hers' ? `1px solid ${t.cardBorder}` : 'none',
              }}
            >
              <h2 className="font-semibold text-gray-800 mb-3">Today's Log</h2>
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{entry.name}</p>
                      <p className="text-xs text-gray-400">{entry.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: t.accent }}>
                        {entry.calories} cal
                      </span>
                      <button
                        onClick={() => removeFoodEntry(activeUser, todayStr(), entry.id)}
                        className="text-gray-300 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MacroPill({ label, value, t }) {
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: t.accentLight, color: t.accentText }}
    >
      {label}: {value}
    </span>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
