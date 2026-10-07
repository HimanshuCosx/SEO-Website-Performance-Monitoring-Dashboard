/**
 * Client-side validation for the "Add URLs" form. The backend re-validates
 * everything — this only gives the user instant feedback.
 */
export type InvalidReason = 'invalid_format' | 'unsupported_scheme' | 'missing_host'

export const INVALID_REASON_LABELS: Record<InvalidReason, string> = {
  invalid_format: 'Invalid URL format (include http:// or https://)',
  unsupported_scheme: 'Only http:// and https:// URLs are supported',
  missing_host: 'Missing or invalid domain name',
}

export interface UrlParseResult {
  /** Number of non-empty lines entered. */
  total: number
  valid: string[]
  invalid: { input: string; reason: InvalidReason }[]
  /** Lines that repeat a URL already listed above them in the same input. */
  duplicates: string[]
}

/** Validates a single URL. Returns the normalised URL or an error reason. */
export function validateUrl(input: string): { ok: true; url: string } | { ok: false; reason: InvalidReason } {
  const value = input.trim()
  if (!value || /\s/.test(value)) return { ok: false, reason: 'invalid_format' }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { ok: false, reason: 'invalid_format' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { ok: false, reason: 'unsupported_scheme' }

  const host = parsed.hostname
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
  const looksLikeDomain = /^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/i.test(host) && !host.startsWith('-')
  if (!host || (!isIp && !looksLikeDomain)) return { ok: false, reason: 'missing_host' }

  parsed.hash = '' // fragments don't change what Lighthouse loads
  return { ok: true, url: parsed.toString() }
}

/** Parses textarea input (one URL per line). Invalid lines never block valid ones. */
export function parseUrlList(text: string): UrlParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const result: UrlParseResult = { total: lines.length, valid: [], invalid: [], duplicates: [] }
  const seen = new Set<string>()

  for (const line of lines) {
    const check = validateUrl(line)
    if (!check.ok) {
      result.invalid.push({ input: line, reason: check.reason })
      continue
    }
    if (seen.has(check.url)) {
      result.duplicates.push(line)
      continue
    }
    seen.add(check.url)
    result.valid.push(check.url)
  }
  return result
}
