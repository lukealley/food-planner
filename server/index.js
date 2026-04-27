import express from 'express'

const app  = express()
const PORT = 3001

app.use(express.json({ limit: '20mb' })) // 20mb to handle base64 food photos

app.post('/api/claude', async (req, res) => {
  // API key can come from env var or from the client request header
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-claude-key']

  if (!apiKey) {
    return res.status(401).json({
      error: { type: 'auth_error', message: 'No API key. Set ANTHROPIC_API_KEY env var or save key in the app.' }
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
      error: { type: 'proxy_error', message: err.message }
    })
  }
})

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`)
  console.log(`API key source: ${process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY env var' : 'passed from app'}`)
})
