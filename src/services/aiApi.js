import { supabase } from '../lib/supabase.js'

const apiBase = (import.meta.env.VITE_AI_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '')
const allowedEndpoints = new Set(['journey', 'workload', 'simulator'])

export async function postAiRequest(endpoint, body) {
  if (!allowedEndpoints.has(endpoint)) throw new Error('Unknown AI service endpoint.')

  const headers = { 'Content-Type': 'application/json' }
  if (supabase) {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error('Could not read your sign-in. Please sign in again.')
    const accessToken = data.session?.access_token
    if (accessToken) headers.Authorization = 'Bearer ' + accessToken
  }

  let response
  try {
    response = await fetch(apiBase + '/api/ai/' + endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(import.meta.env.DEV
      ? 'Could not reach the AI service at ' + apiBase + '. Start the FastAPI server and try again.'
      : 'Could not reach the AI service. Check that the combined Vercel deployment is ready.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(result.detail)
      ? result.detail.map((issue) => (issue.loc || []).join('.') + ': ' + issue.msg).join('; ')
      : result.detail
    throw new Error(detail || 'AI request failed (' + response.status + ').')
  }
  return result
}
