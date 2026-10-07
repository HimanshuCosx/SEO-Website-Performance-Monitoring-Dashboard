import type { TestRun } from '../../types/api'
import { formatDateTime, formatDuration, formatTime } from '../../utils/format'
import { StatCard } from '../common/StatCard'
import { ScorePill } from './Score'

export function RunSummary({ run }: { run: TestRun }) {
  const s = run.summary
  const hasComparison = s && s.improved_count !== null && s.regressed_count !== null
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total URLs" value={run.total_urls} />
        <StatCard label="Completed" value={<span className="text-good">{run.completed_urls}</span>} />
        <StatCard label="Failed" value={<span className={run.failed_urls ? 'text-poor' : ''}>{run.failed_urls}</span>} />
        <StatCard label="Total duration" value={formatDuration(run.duration_seconds)} />
      </dl>

      {s && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Avg performance" value={<ScorePill score={s.avg_performance} />} />
          <StatCard label="Avg accessibility" value={<ScorePill score={s.avg_accessibility} />} />
          <StatCard label="Avg best practices" value={<ScorePill score={s.avg_best_practices} />} />
          <StatCard label="Avg SEO" value={<ScorePill score={s.avg_seo} />} />
        </dl>
      )}

      {hasComparison && (
        <dl className="grid grid-cols-3 gap-3">
          <StatCard label="Improvements" value={<span className="text-good">{s.improved_count} ↑</span>} hint="Performance vs previous test" />
          <StatCard label="Regressions" value={<span className="text-poor">{s.regressed_count} ↓</span>} hint="Performance vs previous test" />
          <StatCard label="No significant change" value={s.unchanged_count} />
        </dl>
      )}

      <dl className="grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <dt className="inline">Started: </dt>
          <dd className="inline font-medium text-slate-900">{formatDateTime(run.started_at)} <span className="text-slate-500">({formatTime(run.started_at)})</span></dd>
        </div>
        <div>
          <dt className="inline">Completed: </dt>
          <dd className="inline font-medium text-slate-900">{formatDateTime(run.completed_at)} <span className="text-slate-500">({formatTime(run.completed_at)})</span></dd>
        </div>
        <div>
          <dt className="inline">Strategy: </dt>
          <dd className="inline font-medium text-slate-900 capitalize">{run.strategy}</dd>
        </div>
      </dl>
    </div>
  )
}
