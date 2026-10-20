/**
 * Client-side validation for the login / sign-up / reset forms. There is no auth backend yet,
 * so these rules are the only checks — keep them in sync with the API once it exists.
 */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 30
export const PASSWORD_MIN = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/

export function validateEmail(value: string): string | null {
  const v = value.trim()
  if (!v) return 'Email is required.'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
  return null
}

export function validateUsername(value: string): string | null {
  const v = value.trim()
  if (!v) return 'Username is required.'
  if (v.length < USERNAME_MIN || v.length > USERNAME_MAX) return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`
  if (!USERNAME_RE.test(v)) return 'Use only letters, numbers, dots, dashes and underscores.'
  return null
}

/** Login only checks presence — strength rules apply when the password is created. */
export function validateLoginPassword(value: string): string | null {
  return value ? null : 'Password is required.'
}

export function validateNewPassword(value: string): string | null {
  if (!value) return 'Password is required.'
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'Password must contain at least one letter and one number.'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return null
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

/** Rough 0–4 strength score for the sign-up meter (length + character variety). */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) return 0
  let score = 0
  if (value.length >= PASSWORD_MIN) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value) && /[^a-zA-Z0-9]/.test(value)) score++
  return Math.max(1, score) as PasswordStrength
}

/** Stand-in for the auth API: resolves after a short delay so loading states are visible. */
export function simulateAuthRequest(ms = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
