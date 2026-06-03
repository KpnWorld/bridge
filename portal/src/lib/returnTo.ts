// kpn-bridge :: returnTo persistence with TTL
// License: AGPL-3.0

const STORAGE_KEY = 'returnTo'
const TTL_MS = 10 * 60 * 1000 // 10 minutes

type StoredReturnTo = {
  path: string
  expires: number
}

export function saveReturnTo(path: string): void {
  const value: StoredReturnTo = {
    path,
    expires: Date.now() + TTL_MS,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export function consumeReturnTo(): string {
  const raw = localStorage.getItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)

  if (!raw) return '/dashboard'

  try {
    const value: StoredReturnTo = JSON.parse(raw)
    if (Date.now() > value.expires) return '/dashboard'
    return value.path || '/dashboard'
  } catch {
    return '/dashboard'
  }
}
