// All Claude API calls go through the local Express proxy at /api/claude.
// The proxy forwards to api.anthropic.com server-side, avoiding CORS.

export async function callClaude(body) {
  const apiKey = localStorage.getItem('claude_api_key') || ''

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'content-type':  'application/json',
      'x-claude-key':  apiKey,   // proxy reads this and puts it on the Anthropic request
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }

  return data
}
