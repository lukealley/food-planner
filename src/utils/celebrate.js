const COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff922b', '#cc5de8', '#f06595', '#74c0fc',
  '#ff8cc8', '#a9e34b',
]

export function celebrate() {
  playSound()
  launchFireworks()
}

function playSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const master = ac.createGain()
    master.gain.value = 0.3
    master.connect(ac.destination)

    // C major arpeggio — C5 E5 G5 C6
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

    // Sparkle tail — quick high notes after the arpeggio
    ;[1568, 1976, 2093].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.connect(env)
      env.connect(master)
      const t = ac.currentTime + 0.38 + i * 0.06
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.18, t + 0.01)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.start(t)
      osc.stop(t + 0.25)
    })

    setTimeout(() => ac.close(), 2500)
  } catch {}
}

function burst(particles, canvas) {
  const x     = canvas.width  * (0.1 + Math.random() * 0.8)
  const y     = canvas.height * (0.08 + Math.random() * 0.5)
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const count = 30 + Math.floor(Math.random() * 18)

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
    const speed = 2.5 + Math.random() * 5
    particles.push({
      x, y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      color: Math.random() > 0.25 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
      r:     2 + Math.random() * 3,
      trail: [],
    })
  }
}

function launchFireworks() {
  const canvas = document.createElement('canvas')
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const particles = []
  const numBursts = 4 + Math.floor(Math.random() * 3)
  for (let b = 0; b < numBursts; b++) {
    setTimeout(() => burst(particles, canvas), b * 170)
  }

  let frame = 0
  function animate() {
    // Fade trail effect
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let alive = false
    for (const p of particles) {
      if (p.alpha <= 0) continue
      alive = true
      p.x  += p.vx
      p.y  += p.vy
      p.vy += 0.1
      p.vx *= 0.985
      p.alpha -= 0.014
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.fillStyle   = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
    frame++
    if (alive || frame < 100) requestAnimationFrame(animate)
    else canvas.remove()
  }
  requestAnimationFrame(animate)
}
