import { useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import { themes } from '../themes'
import { callClaude } from '../utils/claudeApi'

const ACTIVITY = [
  { value: 'sedentary',   label: 'Sedentary (desk job, little exercise)' },
  { value: 'light',       label: 'Light (1-3 days/week)' },
  { value: 'moderate',    label: 'Moderate (3-5 days/week)' },
  { value: 'active',      label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (physical job + training)' },
]

const ACTIVITY_MULT = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }

function calcCalories(p) {
  const w = parseFloat(p.currentWeight) * 0.453592
  const h = (parseFloat(p.heightFt) * 12 + parseFloat(p.heightIn)) * 2.54
  const a = parseFloat(p.age)
  if (!w || !h || !a) return null
  const bmr = p.sex === 'male'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161
  const tdee = bmr * (ACTIVITY_MULT[p.activityLevel] || 1.55)
  const goalW = parseFloat(p.goalWeight) * 0.453592
  const deficit = goalW < w ? 500 : goalW > w ? -300 : 0
  return Math.round(tdee - deficit)
}

function ProfileForm({ user, t }) {
  const { users, setProfile, setCalorieGoal } = useAppStore()
  const [local, setLocal] = useState(users[user].profile)
  const [saved, setSaved] = useState(false)
  const [apiKey,     setApiKey]     = useState(localStorage.getItem('claude_api_key') || '')
  const [showKey,    setShowKey]    = useState(false)
  const [testStatus, setTestStatus] = useState('idle') // 'idle' | 'testing' | 'ok' | 'fail'
  const [testMsg,    setTestMsg]    = useState('')
  const [testDetail, setTestDetail] = useState('')

  // Show stored key info on mount so user can see what's actually saved
  const storedKey = localStorage.getItem('claude_api_key') || ''
  const keyPreview = apiKey.trim()
    ? `${apiKey.trim().slice(0, 14)}…${apiKey.trim().slice(-4)} (${apiKey.trim().length} chars)`
    : 'None'

  async function testApiKey() {
    const key = apiKey.trim()
    if (!key) { setTestStatus('fail'); setTestMsg('No key entered.'); setTestDetail(''); return }
    // Save the key so callClaude picks it up from localStorage
    localStorage.setItem('claude_api_key', key)
    setTestStatus('testing')
    setTestMsg('')
    setTestDetail('')
    try {
      const data = await callClaude({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })
      if (data.content?.[0]?.text) {
        setTestStatus('ok')
        setTestMsg('API key is working.')
        setTestDetail('')
      } else {
        setTestStatus('fail')
        setTestMsg('Unexpected response from API.')
        setTestDetail(JSON.stringify(data).slice(0, 120))
      }
    } catch (e) {
      setTestStatus('fail')
      setTestMsg(e.message || 'Request failed.')
      setTestDetail('Make sure the proxy server is running (npm run dev starts both).')
    }
  }

  const computed = calcCalories(local)
  const lbsToLose = local.currentWeight && local.goalWeight
    ? parseFloat(local.currentWeight) - parseFloat(local.goalWeight)
    : null

  function handleSave() {
    setProfile(user, local)
    if (computed) setCalorieGoal(user, computed)
    if (apiKey) localStorage.setItem('claude_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isHers = user === 'hers'

  return (
    <div className="space-y-4">
      {/* Goal summary */}
      {lbsToLose !== null && computed && (
        <div
          className="rounded-2xl p-4"
          style={{ background: t.accentLight, border: `1px solid ${t.cardBorder}` }}
        >
          <p className="text-sm font-medium" style={{ color: t.accentText }}>
            {lbsToLose > 0
              ? `Lose ${lbsToLose.toFixed(0)} lbs → eat ~${computed} cal/day`
              : lbsToLose < 0
              ? `Gain ${Math.abs(lbsToLose).toFixed(0)} lbs → eat ~${computed} cal/day`
              : `Maintain weight → eat ~${computed} cal/day`}
          </p>
          <p className="text-xs mt-0.5 opacity-60" style={{ color: t.accentText }}>
            ~500 cal/day deficit = ~1 lb/week loss
          </p>
        </div>
      )}

      <Field label="Name" isHers={isHers}>
        <input name="name" value={local.name} onChange={e => setLocal(p => ({ ...p, name: e.target.value }))}
          className="input" placeholder={isHers ? 'Your name' : 'Your name'} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Current Weight (lbs)" isHers={isHers}>
          <input type="number" value={local.currentWeight}
            onChange={e => setLocal(p => ({ ...p, currentWeight: e.target.value }))}
            className="input" placeholder="160" />
        </Field>
        <Field label="Goal Weight (lbs)" isHers={isHers}>
          <input type="number" value={local.goalWeight}
            onChange={e => setLocal(p => ({ ...p, goalWeight: e.target.value }))}
            className="input" placeholder="145" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Height (ft)" isHers={isHers}>
          <input type="number" value={local.heightFt}
            onChange={e => setLocal(p => ({ ...p, heightFt: e.target.value }))}
            className="input" placeholder="5" />
        </Field>
        <Field label="Height (in)" isHers={isHers}>
          <input type="number" value={local.heightIn}
            onChange={e => setLocal(p => ({ ...p, heightIn: e.target.value }))}
            className="input" placeholder="6" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age" isHers={isHers}>
          <input type="number" value={local.age}
            onChange={e => setLocal(p => ({ ...p, age: e.target.value }))}
            className="input" placeholder="34" />
        </Field>
        <Field label="Sex" isHers={isHers}>
          <select value={local.sex} onChange={e => setLocal(p => ({ ...p, sex: e.target.value }))} className="input">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
      </div>

      <Field label="Activity Level" isHers={isHers}>
        <select value={local.activityLevel}
          onChange={e => setLocal(p => ({ ...p, activityLevel: e.target.value }))} className="input">
          {ACTIVITY.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </Field>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: isHers ? '#9b6b75' : '#6b7280' }}>
          Daily Calorie Goal
        </label>

        {/* Calculated */}
        <div className="mb-2">
          <p className="text-xs text-gray-400 mb-1">
            Calculated from your stats above
            {computed ? ` — based on your height, weight, age, and activity level` : ' (fill in your stats above)'}
          </p>
          <input
            type="number"
            value={computed ?? ''}
            readOnly
            className="input bg-gray-50 text-gray-500 cursor-not-allowed"
            placeholder="Fill in your stats above"
          />
        </div>

        {/* Manual override */}
        <div>
          <p className="text-xs text-gray-400 mb-1">
            Your goal <span className="font-medium text-gray-500">(edit to override the calculated number)</span>
          </p>
          <input
            type="number"
            value={users[user].calorieGoal}
            onChange={e => setCalorieGoal(user, Number(e.target.value))}
            className="input"
            placeholder="e.g. 1800"
          />
        </div>
      </div>

      <Field label="Claude API Key (for AI features)" isHers={isHers}>
        {/* Input row */}
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setTestStatus('idle'); setTestMsg(''); setTestDetail('') }}
            className="input flex-1 font-mono text-sm"
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => setShowKey(s => !s)}
            className="px-3 py-2 rounded-xl text-sm text-gray-400 bg-gray-100 shrink-0"
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={testApiKey}
            disabled={testStatus === 'testing'}
            className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
            style={{
              background: testStatus === 'ok'   ? '#dcfce7'
                        : testStatus === 'fail' ? '#fee2e2'
                        : '#f3f4f6',
              color:      testStatus === 'ok'   ? '#15803d'
                        : testStatus === 'fail' ? '#dc2626'
                        : '#6b7280',
            }}
          >
            {testStatus === 'testing' ? '…'
           : testStatus === 'ok'      ? 'Works!'
           : testStatus === 'fail'    ? 'Failed'
           : 'Test'}
          </button>
        </div>

        {/* Key diagnostics */}
        <div className="mt-1.5 space-y-1">
          <p className="text-xs text-gray-400">
            {apiKey.trim()
              ? <>Entered: <span className="font-mono">{keyPreview}</span></>
              : 'No key entered in this field.'}
          </p>
          {storedKey && storedKey !== apiKey.trim() && (
            <p className="text-xs text-amber-500">
              Stored key differs from what's typed — hit Save Profile or re-enter.
            </p>
          )}
          {!storedKey && (
            <p className="text-xs text-amber-500">
              No key saved yet — enter your key and tap Save Profile.
            </p>
          )}
        </div>

        {/* Test result */}
        {testMsg && (
          <div className={`mt-2 rounded-xl px-3 py-2 text-xs ${testStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p className="font-medium">{testMsg}</p>
            {testDetail && <p className="mt-0.5 opacity-70 font-mono">{testDetail}</p>}
          </div>
        )}
      </Field>

      <button
        onClick={handleSave}
        className="w-full font-semibold py-3 rounded-2xl transition-colors text-white"
        style={{ background: t.buttonBg }}
      >
        {saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  )
}

function Field({ label, children, isHers }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: isHers ? '#9b6b75' : '#6b7280' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export default function Profile() {
  const { activeUser, users } = useAppStore()
  const t = themes[activeUser]
  const isHers = activeUser === 'hers'

  return (
    <div className="pb-28 min-h-screen" style={{ background: isHers ? '#fdf8f5' : '#f9fafb' }}>
      <div className="px-4 pt-12 pb-6" style={{ backgroundColor: t.headerBg }}>
        <h1 className="text-2xl font-bold" style={{ color: t.headerText }}>
          {isHers ? 'Your Profile' : 'Profile'}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: t.headerSubtext }}>
          {isHers ? 'Work backwards from where you want to be' : 'Work backwards from your goal'}
        </p>
      </div>

      <div className="px-4 pt-5">
        <ProfileForm user={activeUser} t={t} />
      </div>
    </div>
  )
}
