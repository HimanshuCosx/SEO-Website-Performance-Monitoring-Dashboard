import { RATING_STYLES } from '../../constants/ratingStyles'
import type { ResultStatus, TestRunStatus } from '../../types/api'
import { RATING_LABELS, type Rating } from '../../utils/lighthouse'
import { Spinner } from './Spinner'

type Tone = 'neutral' | 'primary' | 'good' | 'warn' | 'poor'

const TONES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'border-line bg-subtle text-fg-secondary', dot: 'bg-fg-subtle' },
  primary: { badge: 'border-primary/25 bg-primary-soft text-link', dot: 'bg-primary' },
  good: { badge: 'border-good/20 bg-good-soft text-good', dot: 'bg-good' },
  warn: { badge: 'border-warn/25 bg-warn-soft text-warn', dot: 'bg-warn' },
  poor: { badge: 'border-poor/20 bg-poor-soft text-poor', dot: 'bg-poor' },
}

/** Base status pill: coloured dot (or spinner) + text label, so status is never conveyed by colour alone. */
export function Badge({ tone, label, spinning = false }: { tone: Tone; label: string; spinning?: boolean }) {
  const t = TONES[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${t.badge}`}>
      {spinning ? <Spinner className="h-3 w-3" /> : <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {label}
    </span>
  )
}

const RESULT: Record<ResultStatus | 'untested', { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'neutral' },
  running: { label: 'Running', tone: 'primary' },
  completed: { label: 'Completed', tone: 'good' },
  failed: { label: 'Failed', tone: 'poor' },
  untested: { label: 'Not tested', tone: 'neutral' },
}

export function ResultStatusBadge({ status }: { status: ResultStatus | 'untested' }) {
  const s = RESULT[status]
  return <Badge tone={s.tone} label={s.label} spinning={status === 'running'} />
}

const RUN: Record<TestRunStatus, { label: string; tone: Tone }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  running: { label: 'Running', tone: 'primary' },
  completed: { label: 'Completed', tone: 'good' },
  completed_with_errors: { label: 'Completed with errors', tone: 'warn' },
  failed: { label: 'Failed', tone: 'poor' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export function RunStatusBadge({ status }: { status: TestRunStatus }) {
  const s = RUN[status]
  return <Badge tone={s.tone} label={s.label} spinning={status === 'running'} />
}

export function RatingBadge({ rating }: { rating: Rating | null }) {
  if (!rating) return <span className="text-fg-subtle">—</span>
  return <Badge tone={RATING_STYLES[rating].tone} label={RATING_LABELS[rating]} />
}
