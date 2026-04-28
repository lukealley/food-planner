// Track the last touch/click position so fireworks burst from there
let _x = typeof window !== 'undefined' ? window.innerWidth  / 2 : 200
let _y = typeof window !== 'undefined' ? window.innerHeight / 2 : 300

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', e => {
    _x = e.clientX
    _y = e.clientY
  }, { passive: true })
}

// Color palettes — each burst picks one theme
const PALETTES = [
  ['#ff6b6b', '#ff922b', '#ffd93d'],           // warm fire
  ['#4d96ff', '#74c0fc', '#a5d8ff'],            // cool sky
  ['#cc5de8', '#f06595', '#ff8cc8'],            // pink/purple
  ['#6bcb77', '#a9e34b', '#ffd93d'],            // spring green
  ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'], // full rainbow
  ['#f06595', '#cc5de8', '#74c0fc'],            // sunset
  ['#ffd93d', '#ff922b', '#ff6b6b'],            // gold/orange
]

export function celebrate() {
  playSound()
  launchFireworks(_x, _y)
}

// ─── Sound ────────────────────────────────────────────────────────────────────

function playSound() {
  try {
    const ac     = new (window.AudioContext || window.webkitAudioContext)()
    const master = ac.createGain()
    master.gain.value = 0.28
    master.connect(ac.destination)

    // C major arpeggio
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(env)
      env.connect(master)
      const t = ac.currentTime + i * 0.09
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.6, t + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc.start(t)
      osc.stop(t + 0.5)
    })

    // Sparkle tail
    ;[1568, 1976, 2093].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.connect(env)
      env.connect(master)
      const t = ac.currentTime + 0.38 + i * 0.06
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.15, t + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.start(t)
      osc.stop(t + 0.25)
    })

    setTimeout(() => ac.close(), 2500)
  } catch {}
}

// ─── Fireworks ────────────────────────────────────────────────────────────────

function rnd(min, max) { return min + Math.random() * (max - min) }

function makeBurst(originX, originY) {
  const palette   = PALETTES[Math.floor(Math.random() * PALETTES.length)]
  const style     = Math.random()            // 0-0.4 glitter, 0.4-0.7 bloom, 0.7-1 streaks
  const spread    = rnd(30, 90)              // how far from touch point to place burst
  const angle     = Math.random() * Math.PI * 2
  const x         = originX + Math.cos(angle) * spread * (Math.random() > 0.5 ? 1 : 0)
  const y         = originY + Math.sin(angle) * spread * (Math.random() > 0.5 ? 1 : 0)

  let count, speedMin, speedMax, sizeMin, sizeMax, alphaStart, gravity

  if (style < 0.35) {
    // Glitter — many tiny fast particles
    count = Math.floor(rnd(35, 55));  speedMin = 3.5; speedMax = 7;
    sizeMin = 1; sizeMax = 2.5;       alphaStart = rnd(0.55, 0.75); gravity = 0.09
  } else if (style < 0.70) {
    // Bloom — fewer large slower particles
    count = Math.floor(rnd(18, 28));  speedMin = 1.5; speedMax = 4;
    sizeMin = 3; sizeMax = 6;         alphaStart = rnd(0.4, 0.65);  gravity = 0.07
  } else {
    // Streaks — medium count, medium speed, elongated feel
    count = Math.floor(rnd(24, 40));  speedMin = 2.5; speedMax = 6;
    sizeMin = 1.5; sizeMax = 4;       alphaStart = rnd(0.45, 0.70); gravity = 0.11
  }

  const particles = []
  for (let i = 0; i < count; i++) {
    const a     = (Math.PI * 2 * i) / count + rnd(-0.25, 0.25)
    const speed = rnd(speedMin, speedMax)
    particles.push({
      x, y,
      vx:    Math.cos(a) * speed,
      vy:    Math.sin(a) * speed,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: alphaStart,
      fade:  rnd(0.013, 0.022),
      r:     rnd(sizeMin, sizeMax),
      gravity,
    })
  }
  return particles
}

function launchFireworks(originX, originY) {
  const canvas = document.createElement('canvas')
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const all       = []
  const numBursts = Math.floor(rnd(4, 8))

  // First burst right at touch, rest fanned around it
  all.push(...makeBurst(originX, originY))
  for (let b = 1; b < numBursts; b++) {
    setTimeout(() => all.push(...makeBurst(originX, originY)), b * rnd(120, 220))
  }

  let frame = 0
  function animate() {
    // Clear completely — no white overlay, content stays visible
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let alive = false
    for (const p of all) {
      if (p.alpha <= 0) continue
      alive = true
      p.x  += p.vx
      p.y  += p.vy
      p.vy += p.gravity
      p.vx *= 0.97
      p.alpha = Math.max(0, p.alpha - p.fade)

      ctx.globalAlpha = p.alpha
      ctx.fillStyle   = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
    frame++
    if (alive || frame < 60) requestAnimationFrame(animate)
    else canvas.remove()
  }
  requestAnimationFrame(animate)
}
