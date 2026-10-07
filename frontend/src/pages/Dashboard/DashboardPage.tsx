import { Link } from 'react-router-dom'
import { LinkButton } from '../../components/common/Button'
import { Card, CardHeader } from '../../components/common/Card'
import { PageHeader } from '../../components/common/PageHeader'
import { StatCard } from '../../components/common/StatCard'
import { RunStatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, ErrorState, Skeleton } from '../../components/common/States'
import { ScorePill } from '../../components/performance/Score'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { dashboardService } from '../../services/dashboardService'
import { formatDateTime, pluralize } from '../../utils/format'

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const query = useApiQuery((signal) => dashboardService.getSummary(signal), [])
  const d = query.data

  return (
    <>
      <PageHeader title="Dashboard" description="Performance and SEO health across all monitored websites." />

      {query.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="status" aria-label="Loading dashboard…">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !d ? (
        <Card>
          <ErrorState error={query.error} title="Could not load the dashboard" onRetry={query.reload} />
        </Card>
      ) : d.total_projects === 0 ? (
        <Card>
          <EmptyState
            title="No projects yet."
            description="Create a project, add its URLs and run your first performance test."
            action={<LinkButton to={routes.projects()} variant="primary" icon="plus">Go to projects</LinkButton>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-3 gap-3">
            <StatCard label="Projects" value={d.total_projects} />
            <StatCard label="URLs" value={d.total_urls.toLocaleString()} />
            <StatCard label="Test runs" value={d.total_test_runs.toLocaleString()} />
          </dl>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Avg performance" value={<ScorePill score={d.avg_performance} />} hint={d.avg_performance === null ? 'No tests yet' : 'Across tested projects'} />
            <StatCard label="Avg accessibility" value={<ScorePill score={d.avg_accessibility} />} />
            <StatCard label="Avg best practices" value={<ScorePill score={d.avg_best_practices} />} />
            <StatCard label="Avg SEO" value={<ScorePill score={d.avg_seo} />} />
          </dl>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recent test runs" />
              {d.recent_runs.length === 0 ? (
                <EmptyState icon="history" title="No performance tests have been run yet." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {d.recent_runs.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <Link to={routes.run(r.project_id, r.id)} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">
                          {r.project_name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(r.created_at)} · {pluralize(r.total_urls, 'URL')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ScorePill score={r.summary?.avg_performance} />
                        <RunStatusBadge status={r.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Projects needing attention" description="Failed URLs or average performance below 50" />
              {d.projects_needing_attention.length === 0 ? (
                <EmptyState icon="check" title="Nothing needs attention" description="No project has failed URLs or poor average performance in its latest results." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {d.projects_needing_attention.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <Link to={routes.project(p.id)} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">
                          {p.name}
                        </Link>
                        {p.summary && p.summary.failed_urls > 0 && <p className="text-xs text-poor">{pluralize(p.summary.failed_urls, 'URL')} failed</p>}
                      </div>
                      <ScorePill score={p.summary?.avg_performance} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
