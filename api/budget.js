const BASE  = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY   = 'family-budget-v1'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!BASE || !TOKEN) {
    if (req.method === 'GET') return res.status(200).json(null)
    return res.status(200).json({ ok: true })
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${BASE}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      })
      const { result } = await r.json()
      return res.status(200).json(result ? JSON.parse(result) : null)
    }

    if (req.method === 'POST') {
      await fetch(BASE, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', KEY, JSON.stringify(req.body)]),
      })
      return res.status(200).json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    console.error('budget api error', err)
    res.status(500).json({ error: err.message })
  }
}
