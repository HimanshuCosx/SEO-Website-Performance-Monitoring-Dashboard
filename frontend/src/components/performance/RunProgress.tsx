import { useEffect, useState } from 'react'
import type { TestRun } from '../../types/api'
import { formatDuration, secondsBetween } from '../../utils/format'
import { ProgressBar } from '../common/ProgressBar'
import { Spinner } from '../common/Spinner'

/** Ticks once a second so "elapsed" keeps moving between polls. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}

export function RunProgress({ run, compact = false }: { run: TestRun; compact?: boolean }) {
  const done = run.completed_urls + run.failed_urls
  useNow(true)
  const elapsed = secondsBetween(run.started_at)

  const pct = run.total_urls ? Math.round((done / run.total_urls) * 100) : 0

  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <Spinner className="h-4 w-4 text-link" />
          {run.status === 'queued' ? 'Queued — waiting to start…' : `Running performance test: ${done} / ${run.total_urls}`}
        </p>
        <p className="flex items-center gap-3 text-[13px] text-fg-muted tabular-nums">
          <span className="font-medium text-fg">{pct}%</span>
          <span>Elapsed {formatDuration(elapsed, '0s')}</span>
        </p>
      </div>
      <div className="mt-3">
        <ProgressBar label="Test run progress" completed={run.completed_urls} failed={run.failed_urls} total={run.total_urls} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-medium text-fg tabular-nums">{run.completed_urls}</span> completed
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-poor" />
          <span className="font-medium text-fg tabular-nums">{run.failed_urls}</span> failed
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="font-medium text-fg tabular-nums">{run.total_urls - done}</span> remaining
        </span>
      </div>
      {!compact && run.current_url && (
        <p className="mt-3 flex min-w-0 items-center gap-2 rounded-md border border-line bg-subtle px-3 py-2 text-[13px] text-fg-muted" title={run.current_url}>
          <span className="shrink-0">Analyzing</span>
          <span className="truncate font-mono text-xs text-fg">{run.current_url}</span>
        </p>
      )}
    </div>
  )
}
