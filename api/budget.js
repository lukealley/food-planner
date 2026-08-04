import { kv } from '@vercel/kv'

const KEY = 'family-budget-v1'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Gracefully degrade when KV isn't configured (local dev)
  if (!process.env.KV_REST_API_URL) {
    if (req.method === 'GET') return res.status(200).json(null)
    return res.status(200).json({ ok: true })
  }

  try {
    if (req.method === 'GET') {
      const data = await kv.get(KEY)
      return res.status(200).json(data ?? null)
    }
    if (req.method === 'POST') {
      await kv.set(KEY, req.body)
      return res.status(200).json({ ok: true })
    }
    res.status(405).end()
  } catch (err) {
    console.error('budget api error', err)
    res.status(500).json({ error: err.message })
  }
}
