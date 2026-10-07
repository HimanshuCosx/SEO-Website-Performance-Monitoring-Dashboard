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

  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium text-slate-900">
          <Spinner className="h-4 w-4 text-indigo-600" />
          {run.status === 'queued' ? 'Queued — waiting to start…' : `Running performance test: ${done} / ${run.total_urls}`}
        </p>
        <p className="text-sm text-slate-500 tabular-nums">Elapsed {formatDuration(elapsed, '0s')}</p>
      </div>
      <div className="mt-3">
        <ProgressBar label="Test run progress" completed={run.completed_urls} failed={run.failed_urls} total={run.total_urls} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          <span className="font-medium text-slate-900">{run.completed_urls}</span> completed
        </span>
        <span>
          <span className={`font-medium ${run.failed_urls ? 'text-poor' : 'text-slate-900'}`}>{run.failed_urls}</span> failed
        </span>
        <span>
          <span className="font-medium text-slate-900">{run.total_urls - done}</span> remaining
        </span>
      </div>
      {!compact && run.current_url && (
        <p className="mt-2 truncate text-sm text-slate-600" title={run.current_url}>
          Analyzing performance… <span className="font-mono text-xs text-slate-800">{run.current_url}</span>
        </p>
      )}
    </div>
  )
}
