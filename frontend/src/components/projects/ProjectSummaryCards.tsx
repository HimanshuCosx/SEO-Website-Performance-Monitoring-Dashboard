import type { Project } from '../../types/api'
import { StatCard } from '../common/StatCard'
import { ScoreMeter } from '../performance/Score'

/** Averages are based on each URL's latest completed test. */
export function ProjectSummaryCards({ project }: { project: Project }) {
  const s = project.summary
  if (!s) return null
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ScoreMeter label="Performance" score={s.avg_performance} />
        <ScoreMeter label="Accessibility" score={s.avg_accessibility} />
        <ScoreMeter label="Best Practices" score={s.avg_best_practices} />
        <ScoreMeter label="SEO" score={s.avg_seo} />
      </dl>
      <dl className="grid grid-cols-3 gap-3">
        <StatCard label="URLs tested" icon="list" value={s.tested_urls} hint={`of ${project.url_count} in project`} />
        <StatCard label="Successful" icon="checkCircle" value={s.successful_urls} tone={s.successful_urls ? 'good' : 'default'} />
        <StatCard label="Failed" icon="xCircle" value={s.failed_urls} tone={s.failed_urls ? 'poor' : 'default'} />
      </dl>
    </div>
  )
}
