import { supabase, API_BASE } from './supabase'

/**
 * Typed fetch wrapper for the shared Next.js API.
 * ALL business-logic writes go through here — never direct DB writes.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; idempotencyKey?: string } = {}
): Promise<{ data: T | null; error: { code: string; message: string } | null }> {
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-app-version': '1.0.0',
  }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        data: null,
        error: json.error?.code
          ? json.error
          : { code: `HTTP_${res.status}`, message: json.error || json.message || 'Request failed' },
      }
    }
    // Support both { data, error } envelope (v1) and legacy raw payloads
    if ('data' in json || 'error' in json) return json
    return { data: json as T, error: null }
  } catch {
    return { data: null, error: { code: 'NETWORK', message: 'No connection — changes will retry' } }
  }
}
