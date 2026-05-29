import { useState, useEffect, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { todayMT, prevDay } from '../utils/dateUtils'

// ─── Streak calculation ───────────────────────────────────────────────────────

function computeStreak(streakLog) {
  if (!streakLog) return 0
  let count = 0
  let d = todayMT()
  // Grace: if today not checked in, start from yesterday so badge shows ongoing streak
  if (!streakLog[d]) d = prevDay(d)
  while (streakLog[d]) {
    count++
    d = prevDay(d)
  }
  return count
}

function ordinal(n) {
  if ([11, 12, 13].includes(n % 100)) return `${n}th`
  return `${n}${ ['th', 'st', 'nd', 'rd'][n % 10] || 'th' }`
}

const QUOTES = [
  '"One does not simply miss a day."',
  '"Frightfully well done."',
  '"Most distinguished, indeed."',
  '"The staff are most impressed."',
  '"Carson would be proud."',
  '"Lady Mary would approve."',
  '"You honour Downpound Alley."',
  '"Perfectly splendid."',
  '"Rather extraordinary."',
  '"Quite remarkable, my lord."',
  '"The Dowager Countess is pleased."',
  '"This calls for a small celebration."',
  '"Mrs. Patmore shall bake a cake."',
]

// ─── Full-screen Downton banner ───────────────────────────────────────────────

function DowntonBanner({ streak, onClose }) {
  const [progress, setProgress] = useState(100)
  const DURATION = 5500
  const quote = QUOTES[streak % QUOTES.length]

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      setProgress(pct)
      if (pct === 0) { clearInterval(id); onClose() }
    }, 40)
    return () => clearInterval(id)
  }, [onClose])

  const gold   = '#c9a74a'
  const goldLt = '#d4b96a'
  const cream  = '#f0e6d3'
  const navy   = '#0b1120'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(4, 6, 14, 0.97)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          margin: '0 20px',
          maxWidth: 360,
          width: '100%',
          background: `linear-gradient(160deg, #0b1120 0%, #111827 50%, #0b1120 100%)`,
          border: `2px solid ${gold}`,
          borderRadius: 2,
          padding: '40px 32px 28px',
          textAlign: 'center',
          boxShadow: `0 0 100px rgba(201,167,74,0.2), 0 0 30px rgba(201,167,74,0.1), inset 0 0 80px rgba(0,0,0,0.5)`,
          position: 'relative',
        }}
      >
        {/* Inner border frame */}
        <div style={{
          position: 'absolute', inset: 7,
          border: `1px solid ${gold}33`,
          borderRadius: 0,
          pointerEvents: 'none',
        }} />

        {/* Crest row */}
        <div style={{ color: gold, fontSize: 11, letterSpacing: 12, marginBottom: 6 }}>✦ ✦ ✦</div>

        {/* Title */}
        <div style={{
          color: gold,
          fontSize: 9,
          letterSpacing: 7,
          fontFamily: 'Georgia, "Times New Roman", serif',
          marginBottom: 4,
        }}>
          DOWNPOUND ALLEY
        </div>

        {/* Ornamental rule */}
        <div style={{ color: `${gold}55`, fontSize: 9, letterSpacing: 3, marginBottom: 22 }}>
          ───────────────────
        </div>

        {/* Subtitle */}
        <div style={{
          color: `${cream}88`,
          fontSize: 9,
          letterSpacing: 5,
          fontFamily: 'Georgia, serif',
          marginBottom: 8,
        }}>
          CONSECUTIVE DAYS
        </div>

        {/* Giant number */}
        <div style={{
          color: gold,
          fontSize: streak >= 100 ? 78 : 100,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 'bold',
          lineHeight: 1,
          textShadow: `0 0 50px ${gold}77, 0 0 100px ${gold}33`,
          marginBottom: 8,
        }}>
          {streak}
        </div>

        {/* Ordinal */}
        <div style={{
          color: cream,
          fontSize: 12,
          letterSpacing: 4,
          fontFamily: 'Georgia, serif',
          marginBottom: 22,
          textTransform: 'uppercase',
        }}>
          The {ordinal(streak)} Day
        </div>

        {/* Quote */}
        <div style={{
          borderTop: `1px solid ${gold}44`,
          borderBottom: `1px solid ${gold}44`,
          padding: '14px 4px',
          marginBottom: 20,
        }}>
          <p style={{
            color: goldLt,
            fontSize: 12.5,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            {quote}
          </p>
        </div>

        {/* Auto-close progress bar */}
        <div style={{
          height: 1.5,
          background: `${gold}22`,
          borderRadius: 1,
          marginBottom: 18,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${gold}88, ${gold})`,
            transition: 'width 0.04s linear',
          }} />
        </div>

        {/* Bottom crest */}
        <div style={{ color: `${gold}55`, fontSize: 9, letterSpacing: 3, marginBottom: 8 }}>
          ───────────────────
        </div>
        <div style={{ color: gold, fontSize: 11, letterSpacing: 10, marginBottom: 14 }}>✦</div>

        <button
          onClick={onClose}
          style={{
            color: `${gold}55`,
            fontSize: 8,
            fontFamily: 'Georgia, serif',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ─── Side badge ───────────────────────────────────────────────────────────────

export default function StreakBadge() {
  const { activeUser, users, checkInStreak } = useAppStore()
  const userData  = users[activeUser]
  const streakLog = userData.streakLog || {}
  const streak    = computeStreak(streakLog)
  const checkedInToday = !!streakLog[todayMT()]

  const [showBanner, setShowBanner] = useState(false)
  const closeBanner = useCallback(() => setShowBanner(false), [])

  function handlePress() {
    checkInStreak(activeUser)
    setShowBanner(true)
  }

  const gold = '#c9a74a'

  return (
    <>
      {/* Side badge — sticks out from right edge */}
      <button
        onClick={handlePress}
        aria-label="Streak check-in"
        style={{
          position: 'fixed',
          right: 0,
          top: '42%',
          transform: 'translateY(-50%)',
          zIndex: 40,
          background: 'linear-gradient(180deg, #0d1622 0%, #111827 100%)',
          border: `1.5px solid ${gold}`,
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '14px 8px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          boxShadow: `-4px 0 20px rgba(201,167,74,0.18)`,
          cursor: 'pointer',
        }}
      >
        {/* Candle icon — more Downton than a flame */}
        <span style={{ fontSize: 16, lineHeight: 1 }}>🕯️</span>

        {/* Streak number */}
        <span style={{
          color: gold,
          fontSize: streak >= 100 ? 13 : 17,
          fontWeight: 'bold',
          fontFamily: 'Georgia, serif',
          lineHeight: 1,
          textShadow: `0 0 8px ${gold}66`,
        }}>
          {streak || '—'}
        </span>

        {/* Label */}
        <span style={{
          color: `${gold}88`,
          fontSize: 6.5,
          letterSpacing: 1,
          fontFamily: 'Georgia, serif',
          textTransform: 'uppercase',
        }}>
          days
        </span>

        {/* Green dot if checked in today */}
        <div style={{
          width: 5, height: 5,
          borderRadius: '50%',
          background: checkedInToday ? '#22c55e' : `${gold}33`,
          marginTop: 2,
        }} />
      </button>

      {showBanner && streak > 0 && (
        <DowntonBanner streak={streak} onClose={closeBanner} />
      )}
    </>
  )
}
