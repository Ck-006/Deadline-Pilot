const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function api(path, options = {}) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      ...(options.body && typeof options.body !== 'string' ? { body: JSON.stringify(options.body) } : {}),
    })
  } catch {
    throw new Error('Could not reach DeadlinePilot. Check your connection and try again.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error?.message || 'Request failed. Please try again.')
    error.code = payload.error?.code
    error.details = payload.error?.details
    error.status = response.status
    throw error
  }
  return payload.data
}

export function localDateTime(date) {
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

export function formatDue(date, options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) {
  const value = new Date(date)
  return Number.isNaN(value.getTime()) ? 'Date not set' : new Intl.DateTimeFormat(undefined, options).format(value)
}
