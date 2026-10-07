/**
 * Types that mirror the Django REST API contract (see BACKEND_API_REQUIREMENTS.md).
 * If the backend contract changes, update it here first — TypeScript will then
 * point at every component that needs to change.
 *
 * Conventions:
 *  - IDs are strings (UUIDs recommended).
 *  - Timestamps are ISO 8601 strings in UTC, e.g. "2026-10-06T10:00:00Z".
 *  - Durations are integer seconds (`duration_seconds`).
 *  - Lighthouse timing metrics are milliseconds; CLS is unitless.
 *  - Category scores are integers 0–100. Metric scores are Lighthouse audit scores 0–1.
 */

export type ID = string
export type ISODateString = string

/** Django REST Framework page-number pagination envelope. */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PageParams {
  page?: number
  page_size?: number
}

// ---------------------------------------------------------------------------
// Scores & metrics
// ---------------------------------------------------------------------------

export type Strategy = 'mobile' | 'desktop'

export interface CategoryScores {
  performance: number | null
  accessibility: number | null
  best_practices: number | null
  seo: number | null
}

export type ScoreKey = keyof CategoryScores

export interface Metrics {
  fcp_ms: number | null
  lcp_ms: number | null
  tbt_ms: number | null
  cls: number | null
  speed_index_ms: number | null
}

/** Lighthouse audit score (0–1) for each metric — used to show Good / Needs Improvement / Poor. */
export interface MetricScores {
  fcp: number | null
  lcp: number | null
  tbt: number | null
  cls: number | null
  speed_index: number | null
}

export type MetricKey = keyof MetricScores

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export type ResultStatus = 'pending' | 'running' | 'completed' | 'failed'

export type ResultErrorCode =
  | 'timeout'
  | 'invalid_url'
  | 'page_unavailable'
  | 'pagespeed_api_error'
  | 'rate_limited'
  | 'backend_error'
  | 'unknown'

export interface ResultError {
  code: ResultErrorCode
  message: string
}

/** One URL tested inside one test run. Never overwritten — each run creates new results. */
export interface UrlTestResult {
  id: ID
  test_run_id: ID
  url_id: ID
  url: string
  status: ResultStatus
  strategy: Strategy
  scores: CategoryScores | null
  metrics: Metrics | null
  metric_scores: MetricScores | null
  /** Scores of this URL's previous *completed* result (before this run), or null if none. */
  previous_scores: CategoryScores | null
  error: ResultError | null
  started_at: ISODateString | null
  completed_at: ISODateString | null
  duration_seconds: number | null
  lighthouse_version: string | null
}

// ---------------------------------------------------------------------------
// Test runs
// ---------------------------------------------------------------------------

export type TestRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled'

export type TestRunTrigger = 'project' | 'single_url' | 'retry'

export interface RunSummary {
  avg_performance: number | null
  avg_accessibility: number | null
  avg_best_practices: number | null
  avg_seo: number | null
  /** Only present when at least one URL had a previous completed result. */
  improved_count: number | null
  regressed_count: number | null
  unchanged_count: number | null
}

export interface TestRun {
  id: ID
  project_id: ID
  project_name: string
  trigger: TestRunTrigger
  strategy: Strategy
  status: TestRunStatus
  /** For retry runs: the run whose failed URLs are being retried. */
  parent_run_id: ID | null
  total_urls: number
  completed_urls: number
  failed_urls: number
  /** URL currently being analysed (null when idle or finished). */
  current_url: string | null
  created_at: ISODateString
  started_at: ISODateString | null
  completed_at: ISODateString | null
  duration_seconds: number | null
  summary: RunSummary | null
}

export interface StartRunRequest {
  strategy?: Strategy
}

// ---------------------------------------------------------------------------
// Projects & URLs
// ---------------------------------------------------------------------------

export interface ProjectSummary {
  avg_performance: number | null
  avg_accessibility: number | null
  avg_best_practices: number | null
  avg_seo: number | null
  tested_urls: number
  successful_urls: number
  failed_urls: number
}

export interface Project {
  id: ID
  name: string
  description: string
  url_count: number
  created_at: ISODateString
  updated_at: ISODateString
  last_tested_at: ISODateString | null
  /** Id of a queued/running test run, if any. Used to resume progress after refresh. */
  active_run_id: ID | null
  /** Based on each URL's latest result. Null when nothing has been tested yet. */
  summary: ProjectSummary | null
}

export interface ProjectInput {
  name: string
  description?: string
}

export interface ProjectUrl {
  id: ID
  project_id: ID
  url: string
  created_at: ISODateString
  updated_at: ISODateString
  /** Most recent result for this URL (any status), or null if never tested. */
  latest_result: UrlTestResult | null
}

export interface BulkAddUrlsRequest {
  urls: string[]
}

export type UrlRejectionReason = 'invalid_format' | 'duplicate' | 'unsupported_scheme' | 'other'

export interface BulkAddUrlsResponse {
  created: ProjectUrl[]
  rejected: { url: string; reason: UrlRejectionReason; message: string }[]
}

export interface UrlListParams extends PageParams {
  search?: string
  status?: ResultStatus | 'untested'
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  total_projects: number
  total_urls: number
  total_test_runs: number
  avg_performance: number | null
  avg_accessibility: number | null
  avg_best_practices: number | null
  avg_seo: number | null
  recent_runs: TestRun[]
  projects_needing_attention: Project[]
}
