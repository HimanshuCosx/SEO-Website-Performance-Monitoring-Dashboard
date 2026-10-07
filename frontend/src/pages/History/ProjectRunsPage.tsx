import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/common/Card'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { RunStatusBadge } from '../../components/common/StatusBadge'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import { ScorePill } from '../../components/performance/Score'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { performanceService } from '../../services/performanceService'
import { projectService } from '../../services/projectService'
import { formatDateTime, formatDuration } from '../../utils/format'
import type { TestRun } from '../../types/api'

const PAGE_SIZE = 20
const TRIGGER: Record<TestRun['trigger'], string> = { project: 'All URLs', single_url: 'Single URL', retry: 'Retry failed' }

export function ProjectRunsPage() {
  const { projectId = '' } = useParams()
  const [page, setPage] = useState(1)
  const project = useApiQuery((signal) => projectService.get(projectId, signal), [projectId])
  const runs = useApiQuery((signal) => performanceService.listProjectRuns(projectId, { page, page_size: PAGE_SIZE }, signal), [projectId, page])
  useDocumentTitle(project.data ? `History · ${project.data.name}` : 'Test history')
  const list = runs.data?.results ?? []

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Projects', to: routes.projects() }, { label: project.data?.name ?? '…', to: routes.project(projectId) }, { label: 'Test history' }]}
        title="Test history"
        description="Every test run is kept — new tests never overwrite old results."
      />
      <Card>
        {runs.isLoading ? (
          <TableSkeleton label="Loading test history…" />
        ) : runs.error && !runs.data ? (
          <ErrorState error={runs.error} title="Could not load test history" onRetry={runs.reload} />
        ) : list.length === 0 ? (
          <EmptyState icon="history" title="No performance tests have been run yet." />
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 sm:px-5">Started</th>
                    <th scope="col" className="px-3 py-2.5">Status</th>
                    <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">Type</th>
                    <th scope="col" className="px-3 py-2.5">URLs</th>
                    <th scope="col" className="px-3 py-2.5">Avg perf.</th>
                    <th scope="col" className="hidden px-3 py-2.5 md:table-cell">Avg SEO</th>
                    <th scope="col" className="hidden px-3 py-2.5 md:table-cell">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 whitespace-nowrap sm:px-5">
                        <Link to={routes.run(projectId, r.id)} className="font-medium text-indigo-700 hover:underline">
                          {formatDateTime(r.started_at ?? r.created_at)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5"><RunStatusBadge status={r.status} /></td>
                      <td className="hidden px-3 py-2.5 text-slate-600 sm:table-cell">{TRIGGER[r.trigger]}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {r.completed_urls}/{r.total_urls}
                        {r.failed_urls > 0 && <span className="ml-1 text-poor">({r.failed_urls} failed)</span>}
                      </td>
                      <td className="px-3 py-2.5"><ScorePill score={r.summary?.avg_performance} /></td>
                      <td className="hidden px-3 py-2.5 md:table-cell"><ScorePill score={r.summary?.avg_seo} /></td>
                      <td className="hidden px-3 py-2.5 tabular-nums md:table-cell">{formatDuration(r.duration_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} count={runs.data?.count ?? 0} onPageChange={setPage} />
          </>
        )}
      </Card>
    </>
  )
}
