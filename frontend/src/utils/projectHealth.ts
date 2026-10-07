import type { Project } from '../types/api'

export type ProjectHealth = 'running' | 'not_tested' | 'needs_attention' | 'healthy'

/** Simple, explainable status for the project list. "Needs attention" = any failed URL or avg performance below 50 (Lighthouse "poor"). */
export function getProjectHealth(p: Project): ProjectHealth {
  if (p.active_run_id) return 'running'
  if (!p.summary) return 'not_tested'
  if (p.summary.failed_urls > 0 || (p.summary.avg_performance ?? 100) < 50) return 'needs_attention'
  return 'healthy'
}
