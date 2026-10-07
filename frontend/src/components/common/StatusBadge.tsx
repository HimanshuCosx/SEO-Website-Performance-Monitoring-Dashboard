import type { ResultStatus, TestRunStatus } from '../../types/api'
import { RATING_STYLES } from '../../constants/ratingStyles'
import { RATING_LABELS, type Rating } from '../../utils/lighthouse'
import { Spinner } from './Spinner'

const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap'

const RESULT: Record<ResultStatus | 'untested', { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-slate-100 text-slate-600' },
  running: { label: 'Running', cls: 'bg-indigo-50 text-indigo-700' },
  completed: { label: 'Completed', cls: 'bg-good-bg text-good' },
  failed: { label: 'Failed', cls: 'bg-poor-bg text-poor' },
  untested: { label: 'Not tested', cls: 'bg-slate-100 text-slate-500' },
}

export function ResultStatusBadge({ status }: { status: ResultStatus | 'untested' }) {
  const s = RESULT[status]
  return (
    <span className={`${base} ${s.cls}`}>
      {status === 'running' && <Spinner className="h-3 w-3" />}
      {s.label}
    </span>
  )
}

const RUN: Record<TestRunStatus, { label: string; cls: string }> = {
  queued: { label: 'Queued', cls: 'bg-slate-100 text-slate-600' },
  running: { label: 'Running', cls: 'bg-indigo-50 text-indigo-700' },
  completed: { label: 'Completed', cls: 'bg-good-bg text-good' },
  completed_with_errors: { label: 'Completed with errors', cls: 'bg-warn-bg text-warn' },
  failed: { label: 'Failed', cls: 'bg-poor-bg text-poor' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600' },
}

export function RunStatusBadge({ status }: { status: TestRunStatus }) {
  const s = RUN[status]
  return (
    <span className={`${base} ${s.cls}`}>
      {status === 'running' && <Spinner className="h-3 w-3" />}
      {s.label}
    </span>
  )
}

export function RatingBadge({ rating }: { rating: Rating | null }) {
  if (!rating) return <span className="text-slate-400">—</span>
  const s = RATING_STYLES[rating]
  return <span className={`${base} ${s.bg} ${s.text}`}>{RATING_LABELS[rating]}</span>
}
