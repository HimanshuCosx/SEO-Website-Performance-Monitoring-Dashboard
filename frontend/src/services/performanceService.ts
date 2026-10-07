import { env } from '../config/env'
import type {
  ID,
  PageParams,
  Paginated,
  ResultStatus,
  StartRunRequest,
  TestRun,
  TestRunStatus,
  UrlTestResult,
} from '../types/api'
import { api } from './api'

export const TERMINAL_RUN_STATUSES: readonly TestRunStatus[] = [
  'completed',
  'completed_with_errors',
  'failed',
  'cancelled',
]

export const isRunActive = (run: Pick<TestRun, 'status'>) => !TERMINAL_RUN_STATUSES.includes(run.status)

export interface RunResultsParams extends PageParams {
  status?: ResultStatus
  search?: string
}

export const performanceService = {
  /** Starts a test of every URL in the project. Returns immediately; the backend works in the background. */
  startProjectRun: (projectId: ID, body: StartRunRequest = {}) =>
    api.post<TestRun>(`/projects/${projectId}/test-runs/`, body),

  /** Starts a test of a single URL (creates a one-URL test run). */
  startUrlRun: (urlId: ID, body: StartRunRequest = {}) => api.post<TestRun>(`/urls/${urlId}/test-runs/`, body),

  /** Creates a new run containing only the failed URLs of `runId`. */
  retryFailed: (runId: ID) => api.post<TestRun>(`/test-runs/${runId}/retry-failed/`),

  listProjectRuns: (projectId: ID, params: PageParams = {}, signal?: AbortSignal) =>
    api.get<Paginated<TestRun>>(`/projects/${projectId}/test-runs/`, { query: { ...params }, signal }),

  getRun: (runId: ID, signal?: AbortSignal) => api.get<TestRun>(`/test-runs/${runId}/`, { signal }),

  getRunResults: (runId: ID, params: RunResultsParams = {}, signal?: AbortSignal) =>
    api.get<Paginated<UrlTestResult>>(`/test-runs/${runId}/results/`, { query: { ...params }, signal }),

  /**
   * Subscribe to progress updates for a run. Today this polls; later it can be swapped for
   * Server-Sent Events or WebSockets without changing any component (same signature).
   * Returns an unsubscribe function.
   */
  subscribeToRun(
    runId: ID,
    handlers: { onUpdate: (run: TestRun) => void; onError: (err: unknown) => void },
  ): () => void {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()

    const poll = async () => {
      try {
        const run = await performanceService.getRun(runId, controller.signal)
        if (stopped) return
        handlers.onUpdate(run)
        if (!isRunActive(run)) return
      } catch (err) {
        if (stopped) return
        handlers.onError(err)
        // keep polling — a transient network error should not end progress tracking
      }
      timer = setTimeout(poll, env.pollIntervalMs)
    }

    void poll()
    return () => {
      stopped = true
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  },
}
