/**
 * Central place to read build-time environment variables.
 * Never read `import.meta.env` anywhere else — import `env` from here instead.
 */
const pollInterval = Number(import.meta.env.VITE_POLL_INTERVAL_MS)

export const env = {
  /** Django REST API base URL, without a trailing slash. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  /** When true, requests are answered by the in-browser simulated backend (UI development only). */
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  /** How often to poll a running test run for progress. */
  pollIntervalMs: Number.isFinite(pollInterval) && pollInterval >= 500 ? pollInterval : 3000,
} as const
