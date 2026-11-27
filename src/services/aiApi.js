import { supabase } from '../lib/supabase.js'

const apiBase = (
  import.meta.env.VITE_AI_API_URL ??
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
).replace(/\/$/, '')

export async function postAiRequest(endpoint, body) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set the public Supabase URL and key, then sign in again.')
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Your sign-in session is missing or expired. Please sign in again.')
  }

  let response
  try {
    response = await fetch(`${apiBase}/api/ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    const serviceAddress = apiBase || window.location.origin
    throw new Error(`Could not reach the AI service at ${serviceAddress}. Check that the API service is deployed and available.`)
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
