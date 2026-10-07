import { useParams } from 'react-router-dom'
import { Button, LinkButton } from '../../components/common/Button'
import { Card, CardHeader } from '../../components/common/Card'
import { PageHeader } from '../../components/common/PageHeader'
import { RunStatusBadge } from '../../components/common/StatusBadge'
import { ErrorState, InlineError, Skeleton } from '../../components/common/States'
import { RunProgress } from '../../components/performance/RunProgress'
import { RunResultsTable } from '../../components/performance/RunResultsTable'
import { RunSummary } from '../../components/performance/RunSummary'
import { routes } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useRunProgress } from '../../hooks/useRunProgress'
import { useStartRun } from '../../hooks/useStartRun'
import { isRunActive, performanceService } from '../../services/performanceService'
import type { TestRun } from '../../types/api'
import { formatDateTime, pluralize } from '../../utils/format'

const TRIGGER_LABELS: Record<TestRun['trigger'], string> = {
  project: 'Project test',
  single_url: 'Single URL test',
  retry: 'Retry of failed URLs',
}

export function TestRunPage() {
  const { projectId = '', runId = '' } = useParams()
  const { run, error } = useRunProgress(runId)
  const { start, busyKey } = useStartRun()
  useDocumentTitle(run ? `Test run · ${run.project_name}` : 'Test run')

  if (!run) {
    return error ? (
      <Card>
        <ErrorState error={error} title="Could not load this test run" />
      </Card>
    ) : (
      <div className="space-y-4" role="status" aria-label="Loading test run…">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const active = isRunActive(run)
  // Reload the results table whenever progress changes.
  const progressKey = `${run.completed_urls}-${run.failed_urls}-${run.status}-${run.current_url ?? ''}`

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Projects', to: routes.projects() },
          { label: run.project_name, to: routes.project(projectId) },
          { label: 'Test runs', to: routes.projectRuns(projectId) },
          { label: formatDateTime(run.created_at) },
        ]}
        title={active ? 'Performance test running' : 'Performance test complete'}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <RunStatusBadge status={run.status} />
            <span>{TRIGGER_LABELS[run.trigger]}</span>
            <span>·</span>
            <span>{pluralize(run.total_urls, 'URL')}</span>
            {run.parent_run_id && (
              <LinkButton to={routes.run(projectId, run.parent_run_id)} size="sm" variant="ghost">
                View original run
              </LinkButton>
            )}
          </span>
        }
        actions={
          <>
            <LinkButton to={routes.project(projectId)}>Back to project</LinkButton>
            {!active && run.failed_urls > 0 && (
              <Button
                icon="refresh"
                loading={busyKey === 'retry'}
                onClick={() => start('retry', projectId, () => performanceService.retryFailed(run.id), `Retrying ${pluralize(run.failed_urls, 'failed URL')}…`)}
              >
                Retry {pluralize(run.failed_urls, 'failed URL')}
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {/* Shown when a poll fails but we still have the last known state. */}
        {error ? <InlineError error={error} /> : null}

        {active ? (
          <Card className="p-4 sm:p-5">
            <RunProgress run={run} />
            <p className="mt-3 text-xs text-slate-500">You can leave this page — the test keeps running on the server. Come back any time to see progress.</p>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Summary" />
            <div className="p-4 sm:p-5">
              <RunSummary run={run} />
            </div>
          </Card>
        )}

        <RunResultsTable run={run} refreshKey={progressKey} />
      </div>
    </>
  )
}
