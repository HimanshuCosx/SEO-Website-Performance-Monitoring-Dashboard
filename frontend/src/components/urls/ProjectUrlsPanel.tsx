import { useState } from 'react'
import { routes } from '../../constants/routes'
import { RESULT_ERROR_LABELS } from '../../constants/errors'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useStartRun } from '../../hooks/useStartRun'
import { useToast } from '../../hooks/useToast'
import { performanceService } from '../../services/performanceService'
import { urlService } from '../../services/urlService'
import type { Project, ProjectUrl, UrlListParams } from '../../types/api'
import { formatDateTime, pluralize } from '../../utils/format'
import { Button, LinkButton } from '../common/Button'
import { Card, CardHeader } from '../common/Card'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { Pagination } from '../common/Pagination'
import { SearchInput, Select } from '../common/SearchInput'
import { ResultStatusBadge } from '../common/StatusBadge'
import { EmptyState, ErrorState, TableSkeleton } from '../common/States'
import { ScoreDelta, ScorePill } from '../performance/Score'
import { EditUrlModal } from './EditUrlModal'
import { UrlCell } from './UrlCell'

const PAGE_SIZE = 25
type StatusFilter = NonNullable<UrlListParams['status']> | ''

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'running', label: 'Running' },
  { value: 'pending', label: 'Pending' },
  { value: 'untested', label: 'Not tested' },
]

/**
 * The project's URL table. Server-side pagination + filtering keeps it fast even with 500+ URLs.
 * `refreshKey` lets the parent force a reload (e.g. when a test run makes progress).
 */
export function ProjectUrlsPanel({ project, refreshKey, onAddUrls, onChanged }: { project: Project; refreshKey: string | number; onAddUrls: () => void; onChanged: () => void }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [editing, setEditing] = useState<ProjectUrl | null>(null)
  const [deleting, setDeleting] = useState<ProjectUrl | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const toast = useToast()
  const { start, busyKey } = useStartRun()
  const runActive = !!project.active_run_id

  const query = useApiQuery(
    (signal) => urlService.list(project.id, { page, page_size: PAGE_SIZE, search: debouncedSearch, status: status || undefined }, signal),
    [project.id, page, debouncedSearch, status, refreshKey],
  )

  const count = query.data?.count ?? 0
  const urls = query.data?.results ?? []
  const filtered = !!debouncedSearch || !!status

  return (
    <Card>
      <CardHeader
        title="URL performance"
        description={pluralize(project.url_count, 'URL') + ' in this project'}
        actions={
          <Button size="sm" icon="plus" variant="secondary" onClick={onAddUrls}>
            Add URLs
          </Button>
        }
      />

      {project.url_count > 0 && (
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <SearchInput label="Search URLs" placeholder="Search URLs…" value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
          <Select label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={STATUS_OPTIONS} />
        </div>
      )}

      {query.isLoading ? (
        <TableSkeleton label="Loading URLs…" />
      ) : query.error && !query.data ? (
        <ErrorState error={query.error} title="Could not load URLs" onRetry={query.reload} />
      ) : urls.length === 0 ? (
        filtered ? (
          <EmptyState icon="search" title="No URLs match your filters" />
        ) : (
          <EmptyState
            icon="link"
            title="No URLs added to this project."
            description="Add the pages you want to monitor — you can paste many URLs at once."
            action={<Button icon="plus" onClick={onAddUrls}>Add URLs</Button>}
          />
        )
      ) : (
        <>
          <div className="relative overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-2.5 sm:px-5">URL</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">Performance</th>
                  <th scope="col" className="hidden px-3 py-2.5 xl:table-cell">Accessibility</th>
                  <th scope="col" className="hidden px-3 py-2.5 xl:table-cell">Best Practices</th>
                  <th scope="col" className="px-3 py-2.5">SEO</th>
                  <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">Last tested</th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {urls.map((u) => {
                  const r = u.latest_result
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-2.5 sm:px-5">
                        <UrlCell url={u.url} to={routes.url(project.id, u.id)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <ResultStatusBadge status={r?.status ?? 'untested'} />
                        {r?.status === 'failed' && r.error && <div className="mt-0.5 text-xs text-poor">{RESULT_ERROR_LABELS[r.error.code] ?? 'Error'}</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <ScorePill score={r?.scores?.performance} />
                          {r?.scores && <ScoreDelta current={r.scores.performance} previous={r.previous_scores?.performance} showUnchanged={false} />}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2.5 xl:table-cell"><ScorePill score={r?.scores?.accessibility} /></td>
                      <td className="hidden px-3 py-2.5 xl:table-cell"><ScorePill score={r?.scores?.best_practices} /></td>
                      <td className="px-3 py-2.5"><ScorePill score={r?.scores?.seo} /></td>
                      <td className="hidden px-3 py-2.5 whitespace-nowrap text-fg-secondary lg:table-cell">{formatDateTime(r?.completed_at)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <LinkButton to={routes.url(project.id, u.id)} size="sm" variant="ghost" icon="history" ariaLabel={`View results and history for ${u.url}`} title="View results & history" />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={r?.status === 'failed' ? 'refresh' : 'play'}
                            loading={busyKey === u.id}
                            disabled={runActive}
                            title={runActive ? 'A test is already running for this project' : r?.status === 'failed' ? 'Retry this URL' : 'Run test for this URL'}
                            aria-label={`${r?.status === 'failed' ? 'Retry' : 'Run test for'} ${u.url}`}
                            onClick={() => start(u.id, project.id, () => performanceService.startUrlRun(u.id), 'Test started for 1 URL.')}
                          />
                          <Button size="sm" variant="ghost" icon="edit" aria-label={`Edit ${u.url}`} title="Edit" onClick={() => setEditing(u)} />
                          <Button size="sm" variant="ghost" icon="trash" aria-label={`Delete ${u.url}`} title="Delete" className="hover:text-poor" onClick={() => setDeleting(u)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} count={count} onPageChange={setPage} />
        </>
      )}

      <EditUrlModal
        url={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          toast.success('URL updated.')
          query.reload()
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete URL?"
        message={
          <>
            <p>
              Remove <span className="font-mono break-all text-fg">{deleting?.url}</span> from this project?
            </p>
            <p className="mt-2">It will no longer be included in future test runs. This cannot be undone.</p>
          </>
        }
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await urlService.remove(deleting!.id)
          toast.success('URL deleted.')
          if (urls.length === 1 && page > 1) setPage(page - 1) // deleted the last row on this page
          onChanged()
        }}
      />
    </Card>
  )
}
