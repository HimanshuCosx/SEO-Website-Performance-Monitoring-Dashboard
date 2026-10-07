import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { isAbortError } from '../utils/errors'

export interface QueryState<T> {
  data: T | undefined
  error: unknown
  /** True only for the first load (no data yet) — use it to show skeletons. */
  isLoading: boolean
  /** True whenever a request is in flight, including background reloads. */
  isFetching: boolean
  reload: () => void
}

/**
 * Runs `fetcher` when `deps` change and tracks loading / error / data.
 * Cancels the previous request when deps change or the component unmounts,
 * so a slow old response can never overwrite newer data.
 */
export function useApiQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList): QueryState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<unknown>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const controller = new AbortController()
    setIsFetching(true)
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
        setError(null)
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return
        setError(err)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFetching(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { data, error, isLoading: isFetching && data === undefined, isFetching, reload }
}
