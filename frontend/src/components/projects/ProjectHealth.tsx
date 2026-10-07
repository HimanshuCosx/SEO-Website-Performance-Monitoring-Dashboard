import type { Project } from '../../types/api'
import { getProjectHealth, type ProjectHealth } from '../../utils/projectHealth'
import { Spinner } from '../common/Spinner'

const STYLES: Record<ProjectHealth, { label: string; cls: string }> = {
  running: { label: 'Test running', cls: 'bg-indigo-50 text-indigo-700' },
  not_tested: { label: 'Not tested', cls: 'bg-slate-100 text-slate-600' },
  needs_attention: { label: 'Needs attention', cls: 'bg-warn-bg text-warn' },
  healthy: { label: 'Healthy', cls: 'bg-good-bg text-good' },
}

export function ProjectHealthBadge({ project }: { project: Project }) {
  const health = getProjectHealth(project)
  const s = STYLES[health]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {health === 'running' && <Spinner className="h-3 w-3" />}
      {s.label}
    </span>
  )
}
