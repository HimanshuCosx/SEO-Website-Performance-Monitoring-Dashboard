import type { MetricKey } from '../types/api'

/**
 * Timestamps arrive from the backend in UTC (ISO 8601). They are displayed in the
 * viewer's local timezone using one consistent format: "06 Oct 2026, 11:45 AM".
 */
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const upperAmPm = (s: string) => s.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase())

export const formatDateTime = (value: string | null | undefined, fallback = '—') => {
  const d = toDate(value)
  return d ? upperAmPm(dateTimeFormatter.format(d)) : fallback
}

export const formatDate = (value: string | null | undefined, fallback = '—') => {
  const d = toDate(value)
  return d ? dateFormatter.format(d) : fallback
}

export const formatShortDate = (value: string | null | undefined, fallback = '—') => {
  const d = toDate(value)
  return d ? shortDateFormatter.format(d) : fallback
}

export const formatTime = (value: string | null | undefined, fallback = '—') => {
  const d = toDate(value)
  return d ? upperAmPm(timeFormatter.format(d)) : fallback
}

/** 143 → "2m 23s", 3725 → "1h 2m 5s", 9 → "9s" */
export function formatDuration(seconds: number | null | undefined, fallback = '—'): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds) || seconds < 0) return fallback
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Seconds elapsed between an ISO timestamp and now (or `end`). */
export function secondsBetween(start: string | null | undefined, end?: string | null): number | null {
  const s = toDate(start)
  if (!s) return null
  const e = end ? toDate(end) : new Date()
  if (!e) return null
  return Math.max(0, (e.getTime() - s.getTime()) / 1000)
}

/** Formats a metric for display: timings in s/ms, CLS as a unitless number. */
export function formatMetric(key: MetricKey, value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  if (key === 'cls') return value.toFixed(value < 1 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '') || '0'
  if (key === 'tbt') return `${Math.round(value).toLocaleString('en-US')} ms`
  return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`
}

export const formatScore = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : String(Math.round(value))

export const formatSignedDiff = (diff: number) => (diff > 0 ? `+${diff}` : String(diff))

/** "https://example.com/about?x=1" → "/about?x=1" (falls back to the full string). */
export function urlPath(value: string): string {
  try {
    const u = new URL(value)
    return `${u.pathname}${u.search}` || '/'
  } catch {
    return value
  }
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : plural}`
}
