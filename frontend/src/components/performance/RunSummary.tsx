import type { TestRun } from '../../types/api'
import { formatDate, formatDuration, formatTime } from '../../utils/format'
import { StatCard } from '../common/StatCard'
import { ScoreMeter } from './Score'

function Detail({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium text-fg">
        {value}
        {sub && <span className="ml-1 font-normal text-fg-muted tabular-nums">{sub}</span>}
      </dd>
    </div>
  )
}

export function RunSummary({ run }: { run: TestRun }) {
  const s = run.summary
  const hasComparison = s && s.improved_count !== null && s.regressed_count !== null
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total URLs" icon="list" value={run.total_urls} />
        <StatCard label="Completed" icon="checkCircle" value={run.completed_urls} tone={run.completed_urls ? 'good' : 'default'} />
        <StatCard label="Failed" icon="xCircle" value={run.failed_urls} tone={run.failed_urls ? 'poor' : 'default'} />
        <StatCard label="Total duration" icon="clock" value={formatDuration(run.duration_seconds)} />
      </dl>

      {s && (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ScoreMeter label="Avg performance" score={s.avg_performance} />
          <ScoreMeter label="Avg accessibility" score={s.avg_accessibility} />
          <ScoreMeter label="Avg best practices" score={s.avg_best_practices} />
          <ScoreMeter label="Avg SEO" score={s.avg_seo} />
        </dl>
      )}

      {hasComparison && (
        <dl className="grid grid-cols-3 gap-3">
          <StatCard label="Improvements" value={`↑ ${s.improved_count}`} tone={s.improved_count ? 'good' : 'default'} hint="Performance vs previous test" />
          <StatCard label="Regressions" value={`↓ ${s.regressed_count}`} tone={s.regressed_count ? 'poor' : 'default'} hint="Performance vs previous test" />
          <StatCard label="No significant change" value={s.unchanged_count} hint="Change smaller than 5 points" />
        </dl>
      )}

      <dl className="grid gap-4 rounded-lg border border-line bg-surface px-4 py-3 shadow-card sm:grid-cols-3">
        <Detail label="Started" value={formatDate(run.started_at)} sub={formatTime(run.started_at)} />
        <Detail label="Completed" value={formatDate(run.completed_at)} sub={formatTime(run.completed_at)} />
        <Detail label="Strategy" value={run.strategy === 'desktop' ? 'Desktop' : 'Mobile'} />
      </dl>
    </div>
  )
}
