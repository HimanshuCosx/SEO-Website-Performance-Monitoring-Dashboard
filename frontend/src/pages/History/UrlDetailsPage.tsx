import { lazy, Suspense, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Card, CardHeader } from '../../components/common/Card'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '../../components/common/States'
import { UrlHistoryTable } from '../../components/history/UrlHistoryTable'
import { MetricsList, ScoresOverview } from '../../components/performance/ResultDetails'
import { EditUrlModal } from '../../components/urls/EditUrlModal'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useStartRun } from '../../hooks/useStartRun'
import { useToast } from '../../hooks/useToast'
import { performanceService } from '../../services/performanceService'
import { projectService } from '../../services/projectService'
import { urlService } from '../../services/urlService'
import { formatDateTime, formatDuration, urlPath } from '../../utils/format'

// Recharts is large — load it only when a history chart is actually shown.
const ScoreHistoryChart = lazy(() => import('../../components/history/ScoreHistoryChart').then((m) => ({ default: m.ScoreHistoryChart })))

const TABLE_PAGE_SIZE = 20
const CHART_POINTS = 100

export function UrlDetailsPage() {
  const { projectId = '', urlId = '' } = useParams()
  const [page, setPage] = useState(1)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const { start, busyKey } = useStartRun()

  const urlQuery = useApiQuery((signal) => urlService.get(urlId, signal), [urlId])
  const project = useApiQuery((signal) => projectService.get(projectId, signal), [projectId])
  const recent = useApiQuery((signal) => urlService.history(urlId, { page: 1, page_size: CHART_POINTS }, signal), [urlId])
  const table = useApiQuery((signal) => urlService.history(urlId, { page, page_size: TABLE_PAGE_SIZE }, signal), [urlId, page])

  const url = urlQuery.data
  useDocumentTitle(url ? urlPath(url.url) : 'URL')

  if (urlQuery.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading URL…">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (!url) {
    return (
      <Card>
        <ErrorState error={urlQuery.error} title="Could not load this URL" onRetry={urlQuery.reload} />
      </Card>
    )
  }

  const latestCompleted = recent.data?.results.find((r) => r.status === 'completed')
  const runActive = !!project.data?.active_run_id

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Projects', to: routes.projects() },
          { label: project.data?.name ?? '…', to: routes.project(projectId) },
          { label: urlPath(url.url) },
        ]}
        title={urlPath(url.url)}
        description={
          <a href={url.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs break-all hover:underline">
            {url.url}
          </a>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" icon="trash" className="hover:text-red-600" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <Button
              icon="play"
              loading={busyKey === 'url'}
              disabled={runActive}
              title={runActive ? 'A test is already running for this project' : undefined}
              onClick={() => start('url', projectId, () => performanceService.startUrlRun(url.id), 'Test started for this URL.')}
            >
              Run test
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Latest result"
            description={
              latestCompleted
                ? `Tested ${formatDateTime(latestCompleted.completed_at)} · took ${formatDuration(latestCompleted.duration_seconds)} · ${latestCompleted.strategy}`
                : undefined
            }
          />
          {recent.isLoading ? (
            <TableSkeleton rows={3} label="Loading latest result…" />
          ) : recent.error && !recent.data ? (
            <ErrorState error={recent.error} onRetry={recent.reload} />
          ) : !latestCompleted ? (
            <EmptyState icon="history" title="No completed tests yet." description="Run a test to see this page's Lighthouse scores and Core Web Vitals." />
          ) : (
            <div className="space-y-6 p-4 sm:p-5">
              <ScoresOverview result={latestCompleted} />
              {!latestCompleted.previous_scores && <p className="text-center text-xs text-slate-500">This is the first completed test for this URL — nothing to compare against yet.</p>}
              <MetricsList result={latestCompleted} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Performance history" description="Every test of this URL is kept. Newest first." />
          {table.isLoading ? (
            <TableSkeleton label="Loading test history…" />
          ) : table.error && !table.data ? (
            <ErrorState error={table.error} title="Could not load test history" onRetry={table.reload} />
          ) : (table.data?.count ?? 0) === 0 ? (
            <EmptyState icon="history" title="No historical data available." />
          ) : (
            <>
              {recent.data && (
                <Suspense fallback={<Skeleton className="mx-5 my-4 h-64" />}>
                  <ScoreHistoryChart results={recent.data.results} />
                </Suspense>
              )}
              <UrlHistoryTable results={table.data!.results} />
              <Pagination page={page} pageSize={TABLE_PAGE_SIZE} count={table.data!.count} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <EditUrlModal
        url={editOpen ? url : null}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false)
          toast.success('URL updated.')
          urlQuery.reload()
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete URL?"
        message={
          <p>
            Remove <span className="font-mono break-all text-slate-900">{url.url}</span> from this project? It will no longer be tested. This cannot be undone.
          </p>
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await urlService.remove(url.id)
          toast.success('URL deleted.')
          navigate(routes.project(projectId))
        }}
      />
    </>
  )
}
