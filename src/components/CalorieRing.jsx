import useAppStore from '../store/useAppStore'
import { themes } from '../themes'

export default function CalorieRing({ consumed, goal, burned = 0 }) {
  const activeUser = useAppStore(s => s.activeUser)
  const t = themes[activeUser]

  const net  = Math.max(consumed - burned, 0)
  const pct  = Math.min(net / goal, 1)
  const r    = 54
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const remaining = Math.max(goal - net, 0)
  const over = net > goal

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke={t.ringTrack} strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={over ? '#ef4444' : t.ringColor}
            strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{remaining}</span>
          <span className="text-xs text-gray-500">{over ? 'over' : 'left'}</span>
        </div>
      </div>
      <div className="flex gap-5 mt-2 text-sm text-gray-500 flex-wrap justify-center">
        <span><span className="font-semibold text-gray-800">{consumed}</span> eaten</span>
        <span><span className="font-semibold text-gray-800">{goal}</span> goal</span>
        {burned > 0 && (
          <span><span className="font-semibold" style={{ color: '#f97316' }}>{burned}</span> burned</span>
        )}
      </div>
    </div>
  )
}
