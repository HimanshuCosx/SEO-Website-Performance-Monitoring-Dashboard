import type { Project } from '../../types/api'
import { getProjectHealth, type ProjectHealth } from '../../utils/projectHealth'
import { Badge } from '../common/StatusBadge'

const STYLES: Record<ProjectHealth, { label: string; tone: 'primary' | 'neutral' | 'warn' | 'good' }> = {
  running: { label: 'Test running', tone: 'primary' },
  not_tested: { label: 'Not tested', tone: 'neutral' },
  needs_attention: { label: 'Needs attention', tone: 'warn' },
  healthy: { label: 'Healthy', tone: 'good' },
}

export function ProjectHealthBadge({ project }: { project: Project }) {
  const health = getProjectHealth(project)
  const s = STYLES[health]
  return <Badge tone={s.tone} label={s.label} spinning={health === 'running'} />
}
