// Photos fly in from screen edges when a goal is achieved
const PHOTOS = [
  '/family/kid1.jpg',
  '/family/kid2.jpg',
  '/family/kid3.jpg',
  '/family/kid4.jpg',
]

const MESSAGES = [
  'You crushed it!',
  'Goal achieved! Amazing!',
  'Look at you go!',
  'Absolutely killing it!',
  'The family is cheering for you!',
  'Champion behavior!',
  "That's what we're talking about!",
  "You're on fire!",
  'Unstoppable!',
  'So proud of you!',
  'Goals? Smashed!',
  "You're incredible!",
  'Keep it going!',
  'Legend behavior!',
  'Nothing can stop you!',
]

function rnd(min, max) { return min + Math.random() * (max - min) }

function playGoalSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const master = ac.createGain()
    master.gain.value = 0.22
    master.connect(ac.destination)

    // Triumphant major chord sweep
    ;[261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(env)
      env.connect(master)
      const t = ac.currentTime + i * 0.07
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.5, t + 0.04)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.start(t)
      osc.stop(t + 1)
    })
    setTimeout(() => ac.close(), 3000)
  } catch {}
}

function launchPhoto(src, delay) {
  const img = document.createElement('img')
  img.src = src
  const size = rnd(110, 175)
  const W = window.innerWidth
  const H = window.innerHeight

  const edge = Math.floor(Math.random() * 4)
  let startX, startY
  if (edge === 0)      { startX = rnd(0, W);    startY = -size - 30 }
  else if (edge === 1) { startX = W + size + 30; startY = rnd(0, H) }
  else if (edge === 2) { startX = rnd(0, W);    startY = H + size + 30 }
  else                 { startX = -size - 30;   startY = rnd(0, H) }

  const endX = rnd(W * 0.05, W * 0.9) - size / 2
  const endY = rnd(H * 0.05, H * 0.9) - size / 2
  const rot  = rnd(-30, 30)
  const midX = (startX + endX) / 2 + rnd(-80, 80)
  const midY = (startY + endY) / 2 + rnd(-80, 80)

  Object.assign(img.style, {
    position: 'fixed',
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '18px',
    left: '0',
    top: '0',
    zIndex: '99998',
    pointerEvents: 'none',
    boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
    border: '4px solid white',
  })
  document.body.appendChild(img)

  setTimeout(() => {
    img.animate(
      [
        { transform: `translate(${startX}px,${startY}px) rotate(${rot}deg) scale(0.5)`, opacity: 0 },
        { transform: `translate(${midX}px,${midY}px) rotate(${rot * 0.5}deg) scale(1.08)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${endX}px,${endY}px) rotate(${-rot * 0.2}deg) scale(1)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${endX + rnd(-50, 50)}px,${endY + rnd(-50, 50)}px) rotate(${rnd(-20, 20)}deg) scale(0.75)`, opacity: 0 },
      ],
      { duration: rnd(2500, 3400), easing: 'ease-in-out', fill: 'forwards' }
    ).onfinish = () => img.remove()
  }, delay)
}

function showMessage() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const el = document.createElement('div')
  el.textContent = msg
  Object.assign(el.style, {
    position: 'fixed',
    top: '44%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '99999',
    pointerEvents: 'none',
    fontSize: '32px',
    fontWeight: '900',
    color: '#fff',
    textShadow: '0 2px 24px rgba(0,0,0,0.7), 0 0 60px rgba(255,210,0,0.6)',
    textAlign: 'center',
    padding: '20px 32px',
    borderRadius: '28px',
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)',
    maxWidth: '82vw',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  })
  document.body.appendChild(el)

  el.animate(
    [
      { opacity: 0, transform: 'translate(-50%, -36%) scale(0.7)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1.05)', offset: 0.18 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)',     offset: 0.22 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)',     offset: 0.73 },
      { opacity: 0, transform: 'translate(-50%, -62%) scale(0.85)' },
    ],
    { duration: 3400, easing: 'ease-out', fill: 'forwards' }
  ).onfinish = () => el.remove()
}

export function goalCelebrate() {
  playGoalSound()

  // Shuffle and launch all 4 photos with staggered timing
  const shuffled = [...PHOTOS].sort(() => Math.random() - 0.5)
  shuffled.forEach((src, i) => launchPhoto(src, i * rnd(180, 320)))

  setTimeout(showMessage, 250)
}

// Returns recommended sleep hours based on profile age
export function sleepGoalHours(profile) {
  const age = parseFloat(profile?.age) || 30
  return age < 18 ? 8 : 7
}
