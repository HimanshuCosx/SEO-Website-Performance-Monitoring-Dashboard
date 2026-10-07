import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import { SearchInput } from '../../components/common/SearchInput'
import { EmptyState, ErrorState, Skeleton } from '../../components/common/States'
import { ProjectCard } from '../../components/projects/ProjectCard'
import { ProjectFormModal } from '../../components/projects/ProjectFormModal'
import { routes } from '../../constants/routes'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useStartRun } from '../../hooks/useStartRun'
import { useToast } from '../../hooks/useToast'
import { performanceService } from '../../services/performanceService'
import { projectService } from '../../services/projectService'

const PAGE_SIZE = 24

export function ProjectsPage() {
  useDocumentTitle('Projects')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search)
  const navigate = useNavigate()
  const toast = useToast()
  const { start, busyKey } = useStartRun()

  const query = useApiQuery((signal) => projectService.list({ page, page_size: PAGE_SIZE, search: debouncedSearch }, signal), [page, debouncedSearch])
  const projects = query.data?.results ?? []

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project groups the URLs of one website."
        actions={
          <Button icon="plus" onClick={() => setCreateOpen(true)}>
            New project
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          label="Search projects"
          placeholder="Search projects…"
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
        />
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading projects…">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : query.error ? (
        <Card>
          <ErrorState error={query.error} title="Could not load projects" onRetry={query.reload} />
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          {debouncedSearch ? (
            <EmptyState icon="search" title="No matching projects" description={`No project names contain “${debouncedSearch}”.`} />
          ) : (
            <EmptyState
              title="No projects yet."
              description="Create a project for each website you want to monitor, then add its URLs."
              action={
                <Button icon="plus" onClick={() => setCreateOpen(true)}>
                  Create your first project
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                running={busyKey === p.id}
                onRun={() => start(p.id, p.id, () => performanceService.startProjectRun(p.id), `Performance test started for ${p.name}.`)}
              />
            ))}
          </div>
          <div className="mt-4">
            <Pagination page={page} pageSize={PAGE_SIZE} count={query.data?.count ?? 0} onPageChange={setPage} />
          </div>
        </>
      )}

      <ProjectFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(p) => {
          setCreateOpen(false)
          toast.success(`Project “${p.name}” created.`)
          navigate(routes.project(p.id))
        }}
      />
    </>
  )
}
