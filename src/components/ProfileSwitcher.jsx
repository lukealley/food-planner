import useAppStore from '../store/useAppStore'
import { computeWeekScore, scoreLabel } from '../utils/score'

function ScoreArc({ score, color, trackColor, size = 48 }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = score != null ? score / 100 : 0
  const dash = circ * pct

  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={score != null ? color : 'transparent'}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function CategoryDots({ scores, isHis }) {
  const cats = [
    { key: 'calories', label: 'Cal' },
    { key: 'water',    label: 'H₂O' },
    { key: 'sleep',    label: 'Zzz' },
  ]
  return (
    <div className="flex gap-2 mt-1 justify-center">
      {cats.map(({ key, label }) => {
        const v = scores?.[key]
        const { color } = scoreLabel(v)
        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: v != null ? color : '#374151' }}
            />
            <span className="text-center leading-none" style={{ fontSize: 8, color: v != null ? color : '#374151' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ProfileBadge({ user, isActive, onClick }) {
  const { users } = useAppStore()
  const userData = users[user]
  const name = userData.profile.name || (user === 'his' ? 'Luke' : 'Mary')
  const initial = name[0]?.toUpperCase() || (user === 'his' ? 'L' : 'M')

  const scores = computeWeekScore(userData)
  const { text: labelText, color: labelColor } = scoreLabel(scores?.overall)

  const isHis = user === 'his'
  const activeRingColor  = isHis ? '#22c55e' : '#c9a96e'
  const activeBg         = isHis ? '#22c55e' : '#c9a96e'
  const inactiveBg       = isHis ? '#1a2e1a' : '#3d1f25'
  const inactiveText     = isHis ? '#4ade80' : '#c9a96e'
  const trackColor       = isHis ? '#1a3a1a' : '#5a2a35'

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      {/* Avatar with score arc overlay */}
      <div className="relative" style={{ width: 48, height: 48 }}>
        {/* Score arc sits behind the avatar circle */}
        <div className="absolute inset-0">
          <ScoreArc score={scores?.overall} color={activeRingColor} trackColor={trackColor} size={48} />
        </div>
        {/* Avatar circle */}
        <div
          className="absolute inset-0 m-1.5 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200"
          style={
            isActive
              ? { background: activeBg, color: isHis ? '#0d1f0d' : '#3d1f25', boxShadow: `0 0 0 2px ${activeRingColor}` }
              : { background: inactiveBg, color: inactiveText }
          }
        >
          {initial}
        </div>
      </div>

      {/* Name */}
      <span
        className="text-xs font-semibold tracking-wide leading-none"
        style={{ color: isActive ? activeRingColor : (isHis ? '#2d4a2d' : '#5a3040') }}
      >
        {name.split(' ')[0].toUpperCase()}
      </span>

      {/* Score number */}
      <div className="flex items-baseline gap-0.5">
        <span
          className="font-bold leading-none"
          style={{ fontSize: 13, color: scores != null ? labelColor : '#374151' }}
        >
          {scores != null ? scores.overall : '—'}
        </span>
        {scores != null && (
          <span style={{ fontSize: 9, color: labelColor, lineHeight: 1 }}>{labelText}</span>
        )}
      </div>

      {/* Category dots */}
      <CategoryDots scores={scores} isHis={isHis} />
    </button>
  )
}

export default function ProfileSwitcher() {
  const { activeUser, setActiveUser } = useAppStore()

  return (
    <div
      className="flex items-center justify-center gap-4 px-4 py-2.5"
      style={{ backgroundColor: '#080f08' }}
    >
      <ProfileBadge user="his"  isActive={activeUser === 'his'}  onClick={() => setActiveUser('his')}  />

      <div className="flex flex-col items-center gap-0.5 px-2">
        <div className="w-px h-4" style={{ background: '#1e3a1e' }} />
        <span style={{ fontSize: 10, color: '#1e3a1e' }}>&amp;</span>
        <div className="w-px h-4" style={{ background: '#1e3a1e' }} />
        <span style={{ fontSize: 8, color: '#1e3a1e' }}>7d</span>
      </div>

      <ProfileBadge user="hers" isActive={activeUser === 'hers'} onClick={() => setActiveUser('hers')} />
    </div>
  )
}
