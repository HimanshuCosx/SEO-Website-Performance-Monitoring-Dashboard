import type { ID } from '../types/api'

/** Build app URLs in one place so links never drift out of sync with the router. */
export const routes = {
  dashboard: () => '/',
  projects: () => '/projects',
  project: (projectId: ID) => `/projects/${projectId}`,
  projectRuns: (projectId: ID) => `/projects/${projectId}/runs`,
  run: (projectId: ID, runId: ID) => `/projects/${projectId}/runs/${runId}`,
  url: (projectId: ID, urlId: ID) => `/projects/${projectId}/urls/${urlId}`,
}
