// API Service Layer - Vite-compatible fetch wrappers using VITE_API_URL

const API_BASE = import.meta.env.VITE_API_URL ?? ''

function withBase(url: string): string {
  if (!API_BASE) return url
  // Avoid double slashes
  return `${API_BASE.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function get<T>(url: string): Promise<T> {
  const response = await fetch(withBase(url), {
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

export async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(withBase(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

export async function put<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(withBase(url), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

export async function del<T>(url: string): Promise<T> {
  const response = await fetch(withBase(url), {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  return response.json()
}


