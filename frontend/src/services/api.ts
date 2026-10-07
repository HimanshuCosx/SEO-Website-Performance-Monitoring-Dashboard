/**
 * The single HTTP client for the whole app. Every request to Django goes through `request()`.
 * Components never call fetch directly — they use the services (projectService, …) instead.
 */
import { env } from '../config/env'

export type ApiErrorKind =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'timeout'
  | 'rate_limited'
  | 'server_error'
  | 'unavailable'
  | 'network'
  | 'unknown'

/** Normalised error thrown by `request()` for every failure (HTTP, network, timeout). */
export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind
  /** Field-level validation messages, e.g. { name: ['This field is required.'] } */
  readonly fieldErrors: Record<string, string[]>
  /** Raw response body, for cases (like 409) where the backend returns useful data. */
  readonly body: unknown

  constructor(opts: {
    status: number
    kind: ApiErrorKind
    message: string
    fieldErrors?: Record<string, string[]>
    body?: unknown
  }) {
    super(opts.message)
    this.name = 'ApiError'
    this.status = opts.status
    this.kind = opts.kind
    this.fieldErrors = opts.fieldErrors ?? {}
    this.body = opts.body
  }
}

type QueryValue = string | number | boolean | undefined | null

export interface RequestOptions {
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

const DEFAULT_TIMEOUT_MS = 30_000

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'bad_request'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 408) return 'timeout'
  if (status === 409) return 'conflict'
  if (status === 429) return 'rate_limited'
  if (status === 502 || status === 503 || status === 504) return 'unavailable'
  if (status >= 500) return 'server_error'
  return 'unknown'
}

/**
 * Accepts both the preferred error envelope
 *   { "error": { "code", "message", "details": { field: [msg] } } }
 * and Django REST Framework defaults
 *   { "detail": "..." }  or  { "field": ["msg"], "non_field_errors": ["msg"] }
 */
export function parseErrorBody(body: unknown): { message?: string; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {}
  if (!body || typeof body !== 'object') return { fieldErrors }
  const obj = body as Record<string, unknown>

  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>
    const details = err.details && typeof err.details === 'object' ? (err.details as Record<string, unknown>) : {}
    for (const [key, value] of Object.entries(details)) {
      if (Array.isArray(value)) fieldErrors[key] = value.map(String)
      else if (typeof value === 'string') fieldErrors[key] = [value]
    }
    return { message: typeof err.message === 'string' ? err.message : undefined, fieldErrors }
  }

  if (typeof obj.detail === 'string') return { message: obj.detail, fieldErrors }

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) fieldErrors[key] = value as string[]
  }
  const nonField = fieldErrors.non_field_errors?.[0]
  return { message: nonField, fieldErrors }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function httpRequest<T>(method: HttpMethod, path: string, opts: RequestOptions): Promise<T> {
  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeoutController.signal]) : timeoutController.signal

  let response: Response
  try {
    response = await fetch(buildUrl(path, opts.query), {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        // Authentication will be added here once the backend introduces it.
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch (err) {
    // A caller-initiated abort should propagate as-is so callers can ignore it.
    if (opts.signal?.aborted) throw err
    if (timeoutController.signal.aborted) {
      throw new ApiError({ status: 0, kind: 'timeout', message: 'The request timed out.' })
    }
    throw new ApiError({ status: 0, kind: 'network', message: 'Network error — could not reach the server.' })
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let body: unknown = undefined
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined // e.g. an HTML error page from a proxy — never shown to the user
    }
  }

  if (!response.ok) {
    const parsed = parseErrorBody(body)
    throw new ApiError({
      status: response.status,
      kind: kindFromStatus(response.status),
      message: parsed.message ?? `Request failed with status ${response.status}.`,
      fieldErrors: parsed.fieldErrors,
      body,
    })
  }

  return body as T
}

/**
 * Send a request to the backend. In mock mode (VITE_USE_MOCK_API=true) the request is answered
 * by the in-browser simulated backend instead, which implements the same contract.
 */
export async function request<T>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> {
  if (env.useMockApi) {
    const { handleMockRequest } = await import('./mock/mockBackend')
    return handleMockRequest<T>(method, path, opts)
  }
  return httpRequest<T>(method, path, opts)
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T = void>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
}
