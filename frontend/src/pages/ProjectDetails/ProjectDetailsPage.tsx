import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, LinkButton } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { PageHeader } from '../../components/common/PageHeader'
import { ErrorState, Skeleton } from '../../components/common/States'
import { RunProgress } from '../../components/performance/RunProgress'
import { ProjectFormModal } from '../../components/projects/ProjectFormModal'
import { ProjectSummaryCards } from '../../components/projects/ProjectSummaryCards'
import { AddUrlsModal } from '../../components/urls/AddUrlsModal'
import { ProjectUrlsPanel } from '../../components/urls/ProjectUrlsPanel'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useRunProgress } from '../../hooks/useRunProgress'
import { useStartRun } from '../../hooks/useStartRun'
import { useToast } from '../../hooks/useToast'
import { isRunActive, performanceService } from '../../services/performanceService'
import { projectService } from '../../services/projectService'
import { formatDateTime, pluralize } from '../../utils/format'

export function ProjectDetailsPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { start, busyKey } = useStartRun()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [urlsVersion, setUrlsVersion] = useState(0)

  const projectQuery = useApiQuery((signal) => projectService.get(projectId, signal), [projectId])
  const project = projectQuery.data
  useDocumentTitle(project?.name)

  // Live progress for a run that's in progress (also resumes after a page refresh).
  const { run: activeRun } = useRunProgress(project?.active_run_id)
  const progressKey = activeRun ? `${activeRun.completed_urls}-${activeRun.failed_urls}-${activeRun.status}` : ''

  // When the active run finishes, refresh the project summary.
  const reloadProject = projectQuery.reload
  const wasActive = useRef(false)
  useEffect(() => {
    if (!activeRun) return
    const active = isRunActive(activeRun)
    if (wasActive.current && !active) reloadProject()
    wasActive.current = active
  }, [activeRun, reloadProject])

  const refreshAll = () => {
    projectQuery.reload()
    setUrlsVersion((v) => v + 1)
  }

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading project…">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (!project) {
    return (
      <Card>
        <ErrorState error={projectQuery.error} title="Could not load project" onRetry={projectQuery.reload} />
      </Card>
    )
  }

  const runInProgress = !!project.active_run_id && (!activeRun || isRunActive(activeRun))

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Projects', to: routes.projects() }, { label: project.name }]}
        title={project.name}
        description={
          <>
            {project.description && <p className="mb-1 text-slate-600">{project.description}</p>}
            <p>
              {pluralize(project.url_count, 'URL')} · Last tested: {formatDateTime(project.last_tested_at, 'Never')}
            </p>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" icon="edit" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" icon="trash" className="hover:text-red-600" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <LinkButton to={routes.projectRuns(project.id)} icon="history">
              View history
            </LinkButton>
            {runInProgress ? (
              <LinkButton to={routes.run(project.id, project.active_run_id!)} variant="primary">
                View progress
              </LinkButton>
            ) : (
              <Button
                icon="play"
                loading={busyKey === 'project'}
                disabled={project.url_count === 0}
                title={project.url_count === 0 ? 'Add URLs before running a test' : undefined}
                onClick={() => start('project', project.id, () => performanceService.startProjectRun(project.id), `Testing ${pluralize(project.url_count, 'URL')}…`)}
              >
                Run performance test
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {runInProgress && activeRun && (
          <Card className="border-indigo-200 p-4 sm:p-5">
            <RunProgress run={activeRun} />
            <LinkButton to={routes.run(project.id, activeRun.id)} size="sm" className="mt-3">
              View live results
            </LinkButton>
          </Card>
        )}

        {project.summary ? (
          <ProjectSummaryCards project={project} />
        ) : (
          project.url_count > 0 &&
          !runInProgress && (
            <Card className="p-5 text-sm text-slate-600">
              No performance tests have been run yet. Click <strong>Run performance test</strong> to test all {pluralize(project.url_count, 'URL')}.
            </Card>
          )
        )}

        <ProjectUrlsPanel project={project} refreshKey={`${urlsVersion}-${progressKey}`} onAddUrls={() => setAddOpen(true)} onChanged={refreshAll} />
      </div>

      <AddUrlsModal
        open={addOpen}
        projectId={project.id}
        onClose={() => setAddOpen(false)}
        onAdded={(n) => {
          if (n > 0) toast.success(`${pluralize(n, 'URL')} added.`)
          refreshAll()
        }}
      />
      <ProjectFormModal
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false)
          toast.success('Project updated.')
          projectQuery.reload()
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete project?"
        confirmLabel="Delete project"
        message={
          <>
            <p>
              Delete <strong className="text-slate-900">{project.name}</strong> and its {pluralize(project.url_count, 'URL')}?
            </p>
            <p className="mt-2">All test history for this project will be permanently deleted. This cannot be undone.</p>
          </>
        }
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await projectService.remove(project.id)
          toast.success(`Project “${project.name}” deleted.`)
          navigate(routes.projects())
        }}
      />
    </>
  )
}
