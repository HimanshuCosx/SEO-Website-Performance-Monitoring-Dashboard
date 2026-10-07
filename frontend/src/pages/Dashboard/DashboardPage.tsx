import { Link } from 'react-router-dom'
import { LinkButton } from '../../components/common/Button'
import { Card, CardHeader } from '../../components/common/Card'
import { PageHeader } from '../../components/common/PageHeader'
import { StatCard } from '../../components/common/StatCard'
import { RunStatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, ErrorState, Skeleton } from '../../components/common/States'
import { ScoreMeter, ScorePill } from '../../components/performance/Score'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { dashboardService } from '../../services/dashboardService'
import type { DashboardSummary, Project } from '../../types/api'
import { formatDateTime, pluralize } from '../../utils/format'
import { RATING_LABELS, scoreRating } from '../../utils/lighthouse'

const SCORE_TONE = { good: 'good', needs_improvement: 'warn', poor: 'poor' } as const

/** Why a project is listed under "needs attention" (same rule as the backend: failures or avg perf < 50). */
function attentionReason(p: Project) {
  const reasons: string[] = []
  if (p.summary && p.summary.failed_urls > 0) reasons.push(`${pluralize(p.summary.failed_urls, 'URL')} failed`)
  if (p.summary?.avg_performance != null && p.summary.avg_performance < 50) reasons.push('Poor performance')
  return reasons.join(' · ')
}

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const query = useApiQuery((signal) => dashboardService.getSummary(signal), [])
  const d = query.data

  return (
    <>
      <PageHeader title="Dashboard" description="Performance and SEO health across all monitored websites." />

      {query.isLoading ? (
        <div className="space-y-3" role="status" aria-label="Loading dashboard…">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[92px] w-full" />
            ))}
          </div>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !d ? (
        <Card>
          <ErrorState error={query.error} title="Could not load the dashboard" onRetry={query.reload} />
        </Card>
      ) : d.total_projects === 0 ? (
        <Card>
          <EmptyState
            icon="folder"
            title="No projects yet."
            description="Create a project, add its URLs and run your first performance test. Results will appear here."
            action={<LinkButton to={routes.projects()} variant="primary" icon="plus">Create a project</LinkButton>}
          />
        </Card>
      ) : (
        <DashboardContent summary={d} />
      )}
    </>
  )
}

function DashboardContent({ summary: d }: { summary: DashboardSummary }) {
  // Projects only appear in projects_needing_attention when they have failures or poor performance,
  // so summing their failed_urls gives the total failing URLs across all projects.
  const failingUrls = d.projects_needing_attention.reduce((sum, p) => sum + (p.summary?.failed_urls ?? 0), 0)
  const perfRating = scoreRating(d.avg_performance)

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Projects" icon="folder" value={d.total_projects} />
        <StatCard label="URLs monitored" icon="globe" value={d.total_urls.toLocaleString()} />
        <StatCard label="Test runs" icon="activity" value={d.total_test_runs.toLocaleString()} />
        <StatCard
          label="Avg performance"
          icon="gauge"
          value={d.avg_performance ?? '—'}
          tone={perfRating ? SCORE_TONE[perfRating] : 'default'}
          hint={perfRating ? RATING_LABELS[perfRating] : 'No tests yet'}
        />
        <StatCard label="Failing URLs" icon="xCircle" value={failingUrls} tone={failingUrls ? 'poor' : 'default'} hint="In latest results" />
        <StatCard
          label="Needs attention"
          icon="alert"
          value={d.projects_needing_attention.length}
          tone={d.projects_needing_attention.length ? 'warn' : 'default'}
          hint={pluralize(d.projects_needing_attention.length, 'project')}
        />
      </dl>

      <section aria-labelledby="scores-heading">
        <h2 id="scores-heading" className="mb-3 text-sm font-semibold text-fg">
          Average Lighthouse scores
        </h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ScoreMeter label="Performance" score={d.avg_performance} />
          <ScoreMeter label="Accessibility" score={d.avg_accessibility} />
          <ScoreMeter label="Best Practices" score={d.avg_best_practices} />
          <ScoreMeter label="SEO" score={d.avg_seo} />
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Recent test runs" actions={<LinkButton to={routes.projects()} size="sm" variant="ghost">All projects</LinkButton>} />
          {d.recent_runs.length === 0 ? (
            <EmptyState icon="activity" title="No performance tests have been run yet." />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 sm:px-5">Project</th>
                    <th scope="col" className="hidden px-3 sm:table-cell">Started</th>
                    <th scope="col" className="px-3">Avg perf.</th>
                    <th scope="col" className="px-3 pr-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent_runs.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 sm:px-5">
                        <Link to={routes.run(r.project_id, r.id)} className="font-medium text-fg hover:text-link">
                          {r.project_name}
                        </Link>
                        <p className="text-xs text-fg-muted">{pluralize(r.total_urls, 'URL')}</p>
                      </td>
                      <td className="hidden px-3 py-2.5 whitespace-nowrap sm:table-cell">{formatDateTime(r.created_at)}</td>
                      <td className="px-3 py-2.5">
                        <ScorePill score={r.summary?.avg_performance} />
                      </td>
                      <td className="px-3 py-2.5 pr-5">
                        <RunStatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Projects needing attention" description="Failed URLs or average performance below 50" />
          {d.projects_needing_attention.length === 0 ? (
            <EmptyState icon="checkCircle" title="All clear" description="No project has failed URLs or poor average performance in its latest results." />
          ) : (
            <ul className="divide-y divide-line">
              {d.projects_needing_attention.map((p) => (
                <li key={p.id}>
                  <Link to={routes.project(p.id)} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-subtle/60 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-fg">{p.name}</p>
                      <p className="text-xs text-poor">{attentionReason(p)}</p>
                    </div>
                    <ScorePill score={p.summary?.avg_performance} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
