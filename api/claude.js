// Vercel serverless function — proxies requests to Anthropic so the API key
// is never exposed in the browser. Same logic as server/index.js (used in dev).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-claude-key']

  if (!apiKey) {
    return res.status(401).json({
      error: {
        type: 'auth_error',
        message: 'No API key. Set ANTHROPIC_API_KEY in Vercel env vars, or save your key in the app Profile page.',
      },
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(502).json({
      error: { type: 'proxy_error', message: err.message },
    })
  }
}
