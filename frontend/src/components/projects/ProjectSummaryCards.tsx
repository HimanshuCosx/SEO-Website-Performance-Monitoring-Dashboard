import type { Project } from '../../types/api'
import { StatCard } from '../common/StatCard'
import { ScorePill } from '../performance/Score'

/** Averages are based on each URL's latest completed test. */
export function ProjectSummaryCards({ project }: { project: Project }) {
  const s = project.summary
  if (!s) return null
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Avg performance" value={<ScorePill score={s.avg_performance} />} />
        <StatCard label="Avg accessibility" value={<ScorePill score={s.avg_accessibility} />} />
        <StatCard label="Avg best practices" value={<ScorePill score={s.avg_best_practices} />} />
        <StatCard label="Avg SEO" value={<ScorePill score={s.avg_seo} />} />
      </dl>
      <dl className="grid grid-cols-3 gap-3">
        <StatCard label="URLs tested" value={s.tested_urls} hint={`of ${project.url_count}`} />
        <StatCard label="Successful" value={<span className="text-good">{s.successful_urls}</span>} />
        <StatCard label="Failed" value={<span className={s.failed_urls ? 'text-poor' : ''}>{s.failed_urls}</span>} />
      </dl>
    </div>
  )
}
