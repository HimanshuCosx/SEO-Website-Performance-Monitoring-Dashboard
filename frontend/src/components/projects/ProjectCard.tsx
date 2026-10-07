import { Link } from 'react-router-dom'
import { routes } from '../../constants/routes'
import type { Project } from '../../types/api'
import { formatDateTime, pluralize } from '../../utils/format'
import { Button, LinkButton } from '../common/Button'
import { ScorePill } from '../performance/Score'
import { ProjectHealthBadge } from './ProjectHealth'

export function ProjectCard({ project, onRun, running }: { project: Project; onRun: () => void; running: boolean }) {
  const s = project.summary
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 font-semibold break-words text-slate-900">
          <Link to={routes.project(project.id)} className="hover:text-indigo-700 hover:underline">
            {project.name}
          </Link>
        </h3>
        <ProjectHealthBadge project={project} />
      </div>
      {project.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-slate-500">URLs</dt>
          <dd className="font-medium text-slate-900">{pluralize(project.url_count, 'URL')}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Last tested</dt>
          <dd className="font-medium text-slate-900">{formatDateTime(project.last_tested_at, 'Never')}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Avg performance</dt>
          <dd>
            <ScorePill score={s?.avg_performance} />
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Avg SEO</dt>
          <dd>
            <ScorePill score={s?.avg_seo} />
          </dd>
        </div>
        {s && s.failed_urls > 0 && (
          <div className="col-span-2">
            <dt className="sr-only">Failed URLs</dt>
            <dd className="text-poor">{pluralize(s.failed_urls, 'URL')} failed in the latest test</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
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
