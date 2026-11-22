const apiBase = (import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export async function postAiRequest(endpoint, body) {
  let response
  try {
    response = await fetch(`${apiBase}/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(`Could not reach the AI service at ${apiBase}. Start the FastAPI server and try again.`)
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(result.detail)
      ? result.detail.map((issue) => `${issue.loc?.join('.')}: ${issue.msg}`).join('; ')
      : result.detail
    throw new Error(detail || `AI request failed (${response.status}).`)
  }
  return result
}
