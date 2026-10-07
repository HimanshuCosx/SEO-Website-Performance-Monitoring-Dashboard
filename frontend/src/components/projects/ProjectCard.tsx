import { Link } from 'react-router-dom'
import { routes } from '../../constants/routes'
import type { Project } from '../../types/api'
import { formatDateTime, pluralize } from '../../utils/format'
import { Button, LinkButton } from '../common/Button'
import { Icon } from '../common/Icon'
import { ScorePill } from '../performance/Score'
import { ProjectHealthBadge } from './ProjectHealth'

export function ProjectCard({ project, onRun, running }: { project: Project; onRun: () => void; running: boolean }) {
  const s = project.summary
  return (
    <article className="group flex flex-col rounded-lg border border-line bg-surface shadow-card transition-colors hover:border-line-strong">
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-subtle text-fg-muted">
              <Icon name="globe" className="h-4 w-4" />
            </span>
            <h3 className="min-w-0 text-sm font-semibold break-words text-fg">
              <Link to={routes.project(project.id)} className="hover:text-link">
                {project.name}
              </Link>
            </h3>
          </div>
          <ProjectHealthBadge project={project} />
        </div>
        {project.description && <p className="mt-2 line-clamp-2 text-[13px] text-fg-muted">{project.description}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
          <div>
            <dt className="text-fg-muted">URLs</dt>
            <dd className="mt-0.5 font-medium text-fg tabular-nums">{project.url_count.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Last tested</dt>
            <dd className="mt-0.5 font-medium text-fg">{formatDateTime(project.last_tested_at, 'Never')}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Avg performance</dt>
            <dd className="mt-0.5">
              <ScorePill score={s?.avg_performance} />
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Avg SEO</dt>
            <dd className="mt-0.5">
              <ScorePill score={s?.avg_seo} />
            </dd>
          </div>
        </dl>
        {s && s.failed_urls > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-poor">
            <Icon name="alert" className="h-3.5 w-3.5" />
            {pluralize(s.failed_urls, 'URL')} failed in the latest test
          </p>
        )}
      </div>

      <div className="flex gap-2 border-t border-line px-4 py-3">
        <LinkButton to={routes.project(project.id)} size="sm" className="flex-1">
          Open project
        </LinkButton>
        {project.active_run_id ? (
          <LinkButton to={routes.run(project.id, project.active_run_id)} size="sm" variant="primary" className="flex-1">
            View progress
          </LinkButton>
        ) : (
          <Button size="sm" icon="play" className="flex-1" onClick={onRun} loading={running} disabled={project.url_count === 0} title={project.url_count === 0 ? 'Add URLs before running a test' : undefined}>
            Run test
          </Button>
        )}
      </div>
    </article>
  )
}
