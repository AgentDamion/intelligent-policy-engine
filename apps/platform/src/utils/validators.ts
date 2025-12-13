export function isValidEmail(email: string): boolean {
  // Simple, pragmatic validation (matches typical auth UX needs)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

