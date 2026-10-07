import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '../constants/routes'
import { ApiError } from '../services/api'
import type { ID, TestRun } from '../types/api'
import { getErrorMessage } from '../utils/errors'
import { useToast } from './useToast'

/**
 * Starts a test run (project-wide, single URL or retry) and navigates to its progress page.
 * If the backend says a run is already in progress (409), we open that run instead.
 */
export function useStartRun() {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const navigate = useNavigate()
  const toast = useToast()

  async function start(key: string, projectId: ID, action: () => Promise<TestRun>, successMessage: string) {
    setBusyKey(key)
    try {
      const run = await action()
      toast.success(successMessage)
      navigate(routes.run(projectId, run.id))
    } catch (err) {
      const activeRunId = err instanceof ApiError && err.status === 409 ? (err.body as { active_run_id?: ID } | undefined)?.active_run_id : undefined
      if (activeRunId) {
        toast.show('A test is already running for this project — showing its progress.')
        navigate(routes.run(projectId, activeRunId))
      } else {
        toast.error(getErrorMessage(err))
      }
    } finally {
      setBusyKey(null)
    }
  }

  return { start, busyKey }
}
