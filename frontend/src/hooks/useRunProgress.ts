import { useEffect, useState } from 'react'
import { performanceService } from '../services/performanceService'
import type { ID, TestRun } from '../types/api'

interface State {
  runId: ID | null
  run: TestRun | null
  error: unknown
}

/**
 * Live progress for a test run. Components don't know (or care) whether updates
 * come from polling, Server-Sent Events or WebSockets — see performanceService.subscribeToRun.
 */
export function useRunProgress(runId: ID | null | undefined) {
  const [state, setState] = useState<State>({ runId: null, run: null, error: null })

  useEffect(() => {
    if (!runId) return
    return performanceService.subscribeToRun(runId, {
      onUpdate: (run) => setState({ runId, run, error: null }),
      onError: (error) => setState((s) => ({ runId, run: s.runId === runId ? s.run : null, error })),
    })
  }, [runId])

  // Ignore state left over from a previous runId.
  const current = state.runId === runId
  return { run: current ? state.run : null, error: current ? state.error : null }
}
