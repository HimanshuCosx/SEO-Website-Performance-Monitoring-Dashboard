import { useState } from 'react'
import { RESULT_ERROR_LABELS } from '../../constants/errors'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { performanceService } from '../../services/performanceService'
import type { ResultStatus, TestRun } from '../../types/api'
import { formatDuration, formatMetric } from '../../utils/format'
import { Card, CardHeader } from '../common/Card'
import { Pagination } from '../common/Pagination'
import { Select } from '../common/SearchInput'
import { ResultStatusBadge } from '../common/StatusBadge'
import { EmptyState, ErrorState, TableSkeleton } from '../common/States'
import { UrlCell } from '../urls/UrlCell'
import { ScoreDelta, ScorePill } from './Score'

const PAGE_SIZE = 25
type Filter = ResultStatus | ''

export function RunResultsTable({ run, refreshKey }: { run: TestRun; refreshKey: string }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<Filter>('')
  const query = useApiQuery(
    (signal) => performanceService.getRunResults(run.id, { page, page_size: PAGE_SIZE, status: status || undefined }, signal),
    [run.id, page, status, refreshKey],
  )
  const results = query.data?.results ?? []

  return (
    <Card>
      <CardHeader
        title="Results by URL"
        actions={
          <Select
            label="Filter results by status"
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'running', label: 'Running' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        }
      />
      {query.isLoading ? (
        <TableSkeleton label="Loading results…" />
      ) : query.error && !query.data ? (
        <ErrorState error={query.error} title="Could not load results" onRetry={query.reload} />
      ) : results.length === 0 ? (
        <EmptyState icon="search" title="No results match this filter" />
      ) : (
        <>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5 sm:px-5">URL</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">Perf.</th>
                  <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">A11y</th>
                  <th scope="col" className="hidden px-3 py-2.5 sm:table-cell">Best Pr.</th>
                  <th scope="col" className="px-3 py-2.5">SEO</th>
                  <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">LCP</th>
                  <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">TBT</th>
                  <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">CLS</th>
                  <th scope="col" className="hidden px-3 py-2.5 md:table-cell">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 sm:px-5">
                      <UrlCell url={r.url} to={routes.url(run.project_id, r.url_id)} />
                    </td>
                    <td className="px-3 py-2.5">
                      <ResultStatusBadge status={r.status} />
                      {r.status === 'failed' && r.error && (
                        <div className="mt-0.5 max-w-[14rem] text-xs text-poor" title={r.error.message}>
                          {RESULT_ERROR_LABELS[r.error.code] ?? 'Error'}: {r.error.message}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <ScorePill score={r.scores?.performance} />
                        {r.scores && <ScoreDelta current={r.scores.performance} previous={r.previous_scores?.performance} showUnchanged={false} />}
                      </div>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell"><ScorePill score={r.scores?.accessibility} /></td>
                    <td className="hidden px-3 py-2.5 sm:table-cell"><ScorePill score={r.scores?.best_practices} /></td>
                    <td className="px-3 py-2.5"><ScorePill score={r.scores?.seo} /></td>
                    <td className="hidden px-3 py-2.5 whitespace-nowrap tabular-nums lg:table-cell">{formatMetric('lcp', r.metrics?.lcp_ms)}</td>
                    <td className="hidden px-3 py-2.5 whitespace-nowrap tabular-nums lg:table-cell">{formatMetric('tbt', r.metrics?.tbt_ms)}</td>
                    <td className="hidden px-3 py-2.5 whitespace-nowrap tabular-nums lg:table-cell">{formatMetric('cls', r.metrics?.cls)}</td>
                    <td className="hidden px-3 py-2.5 whitespace-nowrap tabular-nums md:table-cell">{formatDuration(r.duration_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count ?? 0} onPageChange={setPage} />
        </>
      )}
    </Card>
  )
}
