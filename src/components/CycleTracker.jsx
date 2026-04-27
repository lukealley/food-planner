import { useState } from 'react'
import { ChevronDown, ChevronUp, Flower2, Info } from 'lucide-react'
import useAppStore from '../store/useAppStore'

const PHASES = [
  {
    name: 'Low Hormone',
    days: [1, 5],
    icon: '🌑',
    color: '#c87070',
    bg: '#fff0f0',
    border: '#f0d0d0',
    subtitle: 'Rest & reset',
    body: 'Estrogen and progesterone are at their lowest point. Without a uterus there is no bleeding, but the hormonal drop is still real — your ovaries have completed one cycle and are beginning another. You may feel lower energy, more emotional, or notice shifts in appetite. This is not imaginary; it is hormonal.',
    weight: 'The water retention from the luteal phase begins to resolve as hormone levels fall. You may notice the scale dropping back toward your baseline over the next few days.',
    eat: [
      'Magnesium-rich foods — dark chocolate, pumpkin seeds, almonds (support mood and energy during the hormonal dip)',
      'Warm, nourishing foods — soups, stews, roasted vegetables (comfort without overindulging)',
      'Anti-inflammatory foods — ginger, turmeric, salmon, walnuts',
      'Iron is less critical than for those who bleed, but leafy greens are still excellent for energy',
    ],
    avoid: ['Excessive caffeine — can amplify low-hormone fatigue', 'Alcohol — worsens mood dips during low-hormone phases'],
    tip: 'You may feel the hormonal shift even without a period. Honour your body\'s signals — they are still real.',
  },
  {
    name: 'Follicular',
    days: [6, 13],
    icon: '🌒',
    color: '#7a9b6e',
    bg: '#f0f7ee',
    border: '#d0e8cc',
    subtitle: 'Energy rising',
    body: 'Your ovaries are developing a dominant follicle and estrogen is rising steadily. Energy, mood, focus, and motivation naturally improve. Your metabolism is at its most flexible and your body responds well to nutrition changes.',
    weight: 'Weight tends to be at its lowest and most stable during this phase. A good time to establish baseline measurements.',
    eat: [
      'Fresh, light foods — salads, lean protein, whole grains',
      'Fermented foods — yogurt, kefir, kimchi (gut health supports estrogen metabolism)',
      'Phytoestrogens — flaxseed, edamame (gently support rising estrogen)',
      'Leafy greens — broccoli, kale, spinach',
    ],
    avoid: [],
    tip: 'This is your most receptive window for new habits. Changes made now tend to stick.',
  },
  {
    name: 'Ovulation',
    days: [14, 16],
    icon: '🌕',
    color: '#c9a96e',
    bg: '#fdf5ec',
    border: '#eed9b8',
    subtitle: 'Peak energy',
    body: 'Your ovaries release an egg — this is the hormonal event your entire cycle revolves around. LH surges, estrogen peaks, and testosterone briefly rises. Even without a uterus, ovulation still occurs fully and drives your hormonal health. You may feel your most vibrant, energetic, and social.',
    weight: 'A brief 0.5–1 lb increase around ovulation from fluid retention is common and completely normal. It passes within a day or two.',
    eat: [
      'Antioxidant-rich foods — berries, colourful vegetables, citrus (support egg quality and hormonal balance)',
      'Fibre — helps the body process estrogen efficiently',
      'Lean protein — chicken, fish, eggs',
      'Zinc — pumpkin seeds, beef, chickpeas (supports ovarian function)',
    ],
    avoid: ['Heavily processed foods'],
    tip: 'This is the best window for tracking your cycle. LH strips or a slight rise in basal body temperature confirm ovulation.',
  },
  {
    name: 'Luteal',
    days: [17, 28],
    icon: '🌘',
    color: '#9b6b75',
    bg: '#fdf0f4',
    border: '#e8c8d0',
    subtitle: 'Slow & steady',
    body: 'After ovulation, the corpus luteum (the remnant of the released follicle) produces progesterone — and your ovaries still do this fully. Progesterone rises significantly in the second half of the cycle. PMS-equivalent symptoms — bloating, mood changes, fatigue, breast tenderness, food cravings — are all driven by this hormonal shift, not by having a uterus. They are real and they are yours.',
    weight: 'Water retention driven by progesterone can add 2–5 lbs on the scale. This is NOT fat — it is fluid your body is temporarily holding. Without a period to trigger hormone withdrawal, the drop happens gradually as progesterone naturally falls. Do not be alarmed by the number.',
    eat: [
      'Magnesium — dark chocolate, pumpkin seeds, almonds (the single best nutrient for luteal symptoms)',
      'Complex carbohydrates — sweet potato, oats, brown rice (honour the carb cravings with nourishing versions)',
      'Calcium — dairy, leafy greens, sardines (clinically shown to reduce hormonal mood symptoms)',
      'Vitamin B6 — salmon, poultry, bananas (supports progesterone and mood regulation)',
    ],
    avoid: [
      'Salty foods — worsen fluid retention and bloating',
      'Refined sugar — worsens mood instability',
      'Alcohol — significantly amplifies hormonal mood symptoms in the luteal phase',
    ],
    tip: 'Cravings in this phase are hormonal and well-documented. Meeting them with nourishing foods is wisdom, not weakness.',
  },
]

function getCurrentPhase(cycleStartDate, cycleLength) {
  if (!cycleStartDate) return null
  const start = new Date(cycleStartDate)
  const today = new Date()
  const dayOfCycle = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  const normalised = ((dayOfCycle - 1) % cycleLength) + 1

  for (const phase of PHASES) {
    if (normalised >= phase.days[0] && normalised <= Math.min(phase.days[1], cycleLength)) {
      return { ...phase, dayOfCycle: normalised, cycleLength }
    }
  }
  return { ...PHASES[3], dayOfCycle: normalised, cycleLength }
}

function daysUntilReset(cycleStartDate, cycleLength) {
  if (!cycleStartDate) return null
  const start = new Date(cycleStartDate)
  const today = new Date()
  const dayOfCycle = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  const normalised = ((dayOfCycle - 1) % cycleLength) + 1
  return cycleLength - normalised + 1
}

export default function CycleTracker() {
  const { users, setCycleData } = useAppStore()
  const { cycleData } = users.hers
  const [expanded, setExpanded] = useState(false)
  const [settingDate, setSettingDate] = useState(false)
  const [showTrackingHelp, setShowTrackingHelp] = useState(false)
  const [dateInput, setDateInput] = useState(cycleData.lastPeriodStart || '')
  const [lengthInput, setLengthInput] = useState(String(cycleData.cycleLength))

  const phase    = getCurrentPhase(cycleData.lastPeriodStart, cycleData.cycleLength)
  const daysLeft = daysUntilReset(cycleData.lastPeriodStart, cycleData.cycleLength)

  function handleSave() {
    setCycleData({ lastPeriodStart: dateInput, cycleLength: Number(lengthInput) || 28 })
    setSettingDate(false)
    setShowTrackingHelp(false)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ border: `1px solid ${phase?.border || '#f0d0d0'}`, background: phase?.bg || '#fff0f0' }}
    >
      {/* Header */}
      <button className="w-full flex items-center justify-between p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2">
          <Flower2 size={20} style={{ color: '#9b6b75' }} />
          <span className="font-semibold" style={{ color: '#3d1f25' }}>Hormonal Cycle</span>
        </div>
        <div className="flex items-center gap-2">
          {phase ? (
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: phase.color + '22', color: phase.color }}>
              {phase.icon} {phase.name} · Day {phase.dayOfCycle}
            </span>
          ) : (
            <span className="text-sm" style={{ color: '#9b6b75' }}>Set cycle date</span>
          )}
          {expanded
            ? <ChevronUp size={16} style={{ color: '#9b6b75' }} />
            : <ChevronDown size={16} style={{ color: '#9b6b75' }} />}
        </div>
      </button>

      {/* Collapsed summary bar */}
      {phase && !expanded && (
        <div className="px-4 pb-3">
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#f0d0d080' }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{ width: `${(phase.dayOfCycle / phase.cycleLength) * 100}%`, background: phase.color }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: '#9b6b75' }}>Day {phase.dayOfCycle} of {phase.cycleLength}</span>
            <span className="text-xs" style={{ color: '#9b6b75' }}>{daysLeft}d until cycle resets</span>
          </div>
          <p className="text-xs mt-1 italic" style={{ color: '#7c4a5c' }}>{phase.subtitle}</p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">

          {/* Context note */}
          <div className="rounded-xl p-3" style={{ background: '#3d1f2512', border: '1px solid #3d1f2525' }}>
            <p className="text-xs" style={{ color: '#3d1f25' }}>
              Your ovaries continue to regulate a complete hormonal cycle — estrogen, LH, progesterone — through ovulation. Without a uterus there is no bleeding, but all four hormonal phases still occur and affect your energy, mood, appetite, and weight throughout the month.
            </p>
          </div>

          {/* Phase pills */}
          <div className="flex gap-1.5 flex-wrap">
            {PHASES.map(p => (
              <span
                key={p.name}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: phase?.name === p.name ? p.color : p.color + '22',
                  color: phase?.name === p.name ? '#fff' : p.color,
                }}
              >
                {p.icon} {p.name}
              </span>
            ))}
          </div>

          {phase ? (
            <div className="space-y-3">
              {/* What's happening */}
              <div className="rounded-xl p-3" style={{ background: '#ffffff88', border: `1px solid ${phase.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: phase.color }}>
                  What's happening
                </p>
                <p className="text-sm" style={{ color: '#4a3540' }}>{phase.body}</p>
              </div>

              {/* Weight */}
              <div className="rounded-xl p-3" style={{ background: '#c9a96e18', border: '1px solid #c9a96e44' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#c9a96e' }}>
                  About your weight
                </p>
                <p className="text-sm" style={{ color: '#4a3540' }}>{phase.weight}</p>
              </div>

              {/* Eat */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: phase.color }}>
                  Nourish yourself with
                </p>
                <div className="space-y-1.5">
                  {phase.eat.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span style={{ color: phase.color }}>✦</span>
                      <p className="text-sm" style={{ color: '#4a3540' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid */}
              {phase.avoid.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9b6b75' }}>
                    Worth limiting
                  </p>
                  <div className="space-y-1.5">
                    {phase.avoid.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span style={{ color: '#c9a96e' }}>◦</span>
                        <p className="text-sm" style={{ color: '#4a3540' }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              <div className="rounded-xl p-3 text-center italic" style={{ background: '#3d1f2518', border: '1px solid #3d1f2530' }}>
                <p className="text-sm" style={{ color: '#3d1f25' }}>"{phase.tip}"</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: '#9b6b75' }}>
              Set your cycle reference date below to see personalised guidance.
            </p>
          )}

          {/* Settings */}
          {settingDate ? (
            <div className="space-y-3 pt-2 border-t" style={{ borderColor: '#f0d0d0' }}>
              {/* Tracking help */}
              <button
                onClick={() => setShowTrackingHelp(h => !h)}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: '#9b6b75' }}
              >
                <Info size={13} /> How do I track without periods?
              </button>
              {showTrackingHelp && (
                <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: '#fff', border: '1px solid #f0d0d0', color: '#4a3540' }}>
                  <p><strong>LH strips (easiest)</strong> — test daily from around day 10. The day of your LH surge is ~1–2 days before ovulation. Count that day as day 13–14, then set your cycle start to 13–14 days earlier.</p>
                  <p><strong>Basal body temperature</strong> — take your temperature each morning before getting up. A sustained rise of ~0.2°F marks ovulation. Count back 13–14 days for your cycle start.</p>
                  <p><strong>Symptoms</strong> — mid-cycle breast tenderness, increased energy, or a brief sharp pain on one side can indicate ovulation.</p>
                  <p><strong>Just estimate</strong> — if your cycle was regular before, use the same length and pick a reference date. The guidance will still be meaningful.</p>
                </div>
              )}

              <div>
                <label className="text-xs mb-1 block" style={{ color: '#9b6b75' }}>
                  Estimated cycle start date
                </label>
                <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#e8c0c8', background: '#fff' }} />
                <p className="text-xs mt-1" style={{ color: '#b89ba0' }}>
                  Day 1 of your cycle — estimated from ovulation tracking or symptom patterns
                </p>
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: '#9b6b75' }}>Average cycle length (days)</label>
                <input type="number" value={lengthInput} onChange={e => setLengthInput(e.target.value)}
                  min={21} max={40} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#e8c0c8', background: '#fff' }} />
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setSettingDate(false); setShowTrackingHelp(false) }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: '#f0d0d0', color: '#9b6b75' }}>
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: '#9b6b75', color: '#fff' }}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSettingDate(true)}
              className="w-full py-2 rounded-xl text-sm font-medium mt-1"
              style={{ background: '#f0d0d0', color: '#9b6b75' }}
            >
              {cycleData.lastPeriodStart ? 'Update cycle reference date' : 'Set cycle reference date'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
