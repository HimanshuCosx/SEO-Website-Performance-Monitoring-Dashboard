/**
 * ⚠️ DEVELOPMENT-ONLY SIMULATED BACKEND ⚠️
 *
 * Active only when VITE_USE_MOCK_API=true. It implements the same REST contract as
 * BACKEND_API_REQUIREMENTS.md so the UI can be built and QA'd before the Django
 * backend exists. All Lighthouse numbers produced here are RANDOM and NOT REAL.
 *
 * Data is kept in localStorage so it survives page refreshes (useful for testing
 * "refresh during a running test"). Progress is computed from timestamps, so a run
 * keeps "progressing" even while the page is closed.
 *
 * QA helpers:
 *  - Any URL containing "fail" always fails (to test failure / retry flows).
 *  - Other URLs fail randomly ~10% of the time.
 *  - Clear data: localStorage.removeItem('seo-dashboard-mock-db-v1')
 */
import type {
  BulkAddUrlsResponse,
  CategoryScores,
  DashboardSummary,
  Metrics,
  MetricScores,
  Paginated,
  Project,
  ProjectSummary,
  ProjectUrl,
  ResultError,
  ResultStatus,
  RunSummary,
  Strategy,
  TestRun,
  TestRunStatus,
  TestRunTrigger,
  UrlTestResult,
} from '../../types/api'
import { validateUrl } from '../../utils/urlValidation'
import { ApiError, type HttpMethod, type RequestOptions } from '../api'
import { SIGNIFICANT_SCORE_CHANGE } from '../../constants/lighthouse'

const STORAGE_KEY = 'seo-dashboard-mock-db-v1'
const CONCURRENCY = 2

interface DbProject {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}
interface DbUrl {
  id: string
  project_id: string
  url: string
  created_at: string
  updated_at: string
}
interface DbRun {
  id: string
  project_id: string
  trigger: TestRunTrigger
  strategy: Strategy
  parent_run_id: string | null
  created_at: string
}
interface DbResult {
  id: string
  run_id: string
  url_id: string
  url: string
  strategy: Strategy
  sim_start: number
  sim_end: number
  outcome: 'completed' | 'failed'
  error: ResultError | null
  scores: CategoryScores
  metrics: Metrics
  metric_scores: MetricScores
}
interface Db {
  projects: DbProject[]
  urls: DbUrl[]
  runs: DbRun[]
  results: DbResult[]
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* ignore corrupt or unavailable storage */
  }
  return { projects: [], urls: [], runs: [], results: [] }
}

function save(db: Db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    /* storage full / unavailable — mock keeps working in memory for this request */
  }
}

const uuid = () => crypto.randomUUID()
const iso = (ms: number) => new Date(ms).toISOString()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const avg = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function notFound(): never {
  throw new ApiError({ status: 404, kind: 'not_found', message: 'Not found.' })
}

function badRequest(message: string, fieldErrors: Record<string, string[]> = {}): never {
  throw new ApiError({
    status: 400,
    kind: 'bad_request',
    message,
    fieldErrors,
    body: { error: { code: 'validation_error', message, details: fieldErrors } },
  })
}

function paginate<T>(items: T[], query: RequestOptions['query']): Paginated<T> {
  const page = Math.max(1, Number(query?.page) || 1)
  const size = clamp(Number(query?.page_size) || 25, 1, 100)
  const start = (page - 1) * size
  if (start > 0 && start >= items.length) notFound() // DRF returns 404 for out-of-range pages
  return {
    count: items.length,
    next: start + size < items.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: items.slice(start, start + size),
  }
}

// ---------------------------------------------------------------------------
// Fake Lighthouse result generation (NOT REAL DATA)
// ---------------------------------------------------------------------------

const FAILURES: ResultError[] = [
  { code: 'timeout', message: 'Lighthouse timed out while loading the page.' },
  { code: 'page_unavailable', message: 'The page returned HTTP 503.' },
  { code: 'pagespeed_api_error', message: 'PageSpeed Insights returned an error.' },
  { code: 'rate_limited', message: 'PageSpeed Insights quota exceeded.' },
]

function fakeOutcome(url: string, strategy: Strategy) {
  const base = 55 + (hash(url) % 40) + (strategy === 'desktop' ? 8 : 0)
  const jitter = () => Math.round((Math.random() - 0.5) * 16)
  const perf = clamp(base + jitter(), 5, 100)
  const scores: CategoryScores = {
    performance: perf,
    accessibility: clamp(80 + (hash(url + 'a') % 21) + jitter() / 4, 0, 100),
    best_practices: clamp(75 + (hash(url + 'b') % 26) + jitter() / 4, 0, 100),
    seo: clamp(82 + (hash(url + 's') % 19) + jitter() / 4, 0, 100),
  }
  for (const k of Object.keys(scores) as (keyof CategoryScores)[]) scores[k] = Math.round(scores[k] as number)

  const slowness = (100 - perf) / 100 // 0 = fast, 1 = slow
  const metrics: Metrics = {
    fcp_ms: Math.round(800 + slowness * 3500 + Math.random() * 300),
    lcp_ms: Math.round(1200 + slowness * 6000 + Math.random() * 500),
    tbt_ms: Math.round(20 + slowness * 1200 + Math.random() * 80),
    cls: Math.round(Math.random() * slowness * 0.4 * 1000) / 1000,
    speed_index_ms: Math.round(1000 + slowness * 5500 + Math.random() * 400),
  }
  const ms = (v: number) => Math.round(clamp(1 - v + (Math.random() - 0.5) * 0.15, 0, 1) * 100) / 100
  const metric_scores: MetricScores = {
    fcp: ms(slowness),
    lcp: ms(slowness * 1.1),
    tbt: ms(slowness * 0.9),
    cls: ms(metrics.cls! * 3),
    speed_index: ms(slowness),
  }

  const forcedFail = url.toLowerCase().includes('fail')
  const failed = forcedFail || Math.random() < 0.1
  return {
    outcome: failed ? ('failed' as const) : ('completed' as const),
    error: failed ? FAILURES[Math.floor(Math.random() * FAILURES.length)] : null,
    scores,
    metrics,
    metric_scores,
  }
}

/** Schedules results across CONCURRENCY "workers" starting now. */
function scheduleResults(run: DbRun, urls: DbUrl[]): DbResult[] {
  const lanes = Array.from({ length: CONCURRENCY }, () => Date.now() + 800)
  return urls.map((u) => {
    const lane = lanes.indexOf(Math.min(...lanes))
    const start = lanes[lane]
    const end = start + 2500 + Math.random() * 3000
    lanes[lane] = end
    return { id: uuid(), run_id: run.id, url_id: u.id, url: u.url, strategy: run.strategy, sim_start: start, sim_end: end, ...fakeOutcome(u.url, run.strategy) }
  })
}

// ---------------------------------------------------------------------------
// Serializers — derive "live" state from timestamps
// ---------------------------------------------------------------------------

function resultStatus(r: DbResult, now: number): ResultStatus {
  if (now >= r.sim_end) return r.outcome
  if (now >= r.sim_start) return 'running'
  return 'pending'
}

function previousCompleted(db: Db, r: DbResult, now: number): DbResult | null {
  let best: DbResult | null = null
  for (const other of db.results) {
    if (other.url_id !== r.url_id || other.id === r.id || other.outcome !== 'completed') continue
    if (other.sim_end >= r.sim_end || other.sim_end > now) continue
    if (!best || other.sim_end > best.sim_end) best = other
  }
  return best
}

function serializeResult(db: Db, r: DbResult, now: number): UrlTestResult {
  const status = resultStatus(r, now)
  const done = status === 'completed'
  return {
    id: r.id,
    test_run_id: r.run_id,
    url_id: r.url_id,
    url: r.url,
    status,
    strategy: r.strategy,
    scores: done ? r.scores : null,
    metrics: done ? r.metrics : null,
    metric_scores: done ? r.metric_scores : null,
    previous_scores: previousCompleted(db, r, now)?.scores ?? null,
    error: status === 'failed' ? r.error : null,
    started_at: now >= r.sim_start ? iso(r.sim_start) : null,
    completed_at: now >= r.sim_end ? iso(r.sim_end) : null,
    duration_seconds: now >= r.sim_end ? Math.round((r.sim_end - r.sim_start) / 1000) : null,
    lighthouse_version: done ? '12.x (simulated)' : null,
  }
}

function serializeRun(db: Db, run: DbRun, now: number): TestRun {
  const results = db.results.filter((r) => r.run_id === run.id)
  const statuses = results.map((r) => resultStatus(r, now))
  const completed = statuses.filter((s) => s === 'completed').length
  const failed = statuses.filter((s) => s === 'failed').length
  const running = results.filter((_, i) => statuses[i] === 'running')
  const allDone = completed + failed === results.length
  const startedMs = Math.min(...results.map((r) => r.sim_start))
  const endMs = Math.max(...results.map((r) => r.sim_end))

  let status: TestRunStatus
  if (allDone) status = failed === 0 ? 'completed' : completed === 0 ? 'failed' : 'completed_with_errors'
  else status = now >= startedMs ? 'running' : 'queued'

  let summary: RunSummary | null = null
  if (completed > 0) {
    const done = results.filter((_, i) => statuses[i] === 'completed').map((r) => serializeResult(db, r, now))
    const withPrev = done.filter((r) => r.previous_scores?.performance != null)
    const diffs = withPrev.map((r) => r.scores!.performance! - r.previous_scores!.performance!)
    summary = {
      avg_performance: avg(done.map((r) => r.scores!.performance)),
      avg_accessibility: avg(done.map((r) => r.scores!.accessibility)),
      avg_best_practices: avg(done.map((r) => r.scores!.best_practices)),
      avg_seo: avg(done.map((r) => r.scores!.seo)),
      improved_count: withPrev.length ? diffs.filter((d) => d >= SIGNIFICANT_SCORE_CHANGE).length : null,
      regressed_count: withPrev.length ? diffs.filter((d) => d <= -SIGNIFICANT_SCORE_CHANGE).length : null,
      unchanged_count: withPrev.length ? diffs.filter((d) => Math.abs(d) < SIGNIFICANT_SCORE_CHANGE).length : null,
    }
  }

  return {
    id: run.id,
    project_id: run.project_id,
    project_name: db.projects.find((p) => p.id === run.project_id)?.name ?? 'Deleted project',
    trigger: run.trigger,
    strategy: run.strategy,
    status,
    parent_run_id: run.parent_run_id,
    total_urls: results.length,
    completed_urls: completed,
    failed_urls: failed,
    current_url: running[0]?.url ?? null,
    created_at: run.created_at,
    started_at: now >= startedMs ? iso(startedMs) : null,
    completed_at: allDone ? iso(endMs) : null,
    duration_seconds: allDone ? Math.round((endMs - startedMs) / 1000) : null,
    summary,
  }
}

function latestResultFor(db: Db, urlId: string): DbResult | null {
  let best: DbResult | null = null
  for (const r of db.results) if (r.url_id === urlId && (!best || r.sim_start > best.sim_start)) best = r
  return best
}

function serializeUrl(db: Db, u: DbUrl, now: number): ProjectUrl {
  const latest = latestResultFor(db, u.id)
  return { ...u, latest_result: latest ? serializeResult(db, latest, now) : null }
}

function serializeProject(db: Db, p: DbProject, now: number): Project {
  const urls = db.urls.filter((u) => u.project_id === p.id)
  const runs = db.runs.filter((r) => r.project_id === p.id).map((r) => serializeRun(db, r, now))
  const active = runs.find((r) => r.status === 'queued' || r.status === 'running')
  const lastTested = runs
    .map((r) => r.completed_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  // Summary uses each URL's latest *finished* result
  const finished = urls
    .map((u) =>
      db.results
        .filter((r) => r.url_id === u.id && now >= r.sim_end)
        .sort((a, b) => b.sim_end - a.sim_end)[0],
    )
    .filter((r): r is DbResult => !!r)
  let summary: ProjectSummary | null = null
  if (finished.length) {
    const ok = finished.filter((r) => r.outcome === 'completed')
    summary = {
      avg_performance: avg(ok.map((r) => r.scores.performance)),
      avg_accessibility: avg(ok.map((r) => r.scores.accessibility)),
      avg_best_practices: avg(ok.map((r) => r.scores.best_practices)),
      avg_seo: avg(ok.map((r) => r.scores.seo)),
      tested_urls: finished.length,
      successful_urls: ok.length,
      failed_urls: finished.length - ok.length,
    }
  }

  return {
    ...p,
    url_count: urls.length,
    last_tested_at: lastTested ?? null,
    active_run_id: active?.id ?? null,
    summary,
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

type Handler = (ctx: { db: Db; params: string[]; body: unknown; query: RequestOptions['query']; now: number }) => unknown

const routes: [HttpMethod, RegExp, Handler][] = []
const route = (method: HttpMethod, pattern: string, handler: Handler) =>
  routes.push([method, new RegExp(`^${pattern.replace(/:id/g, '([^/]+)')}/?$`), handler])

const findProject = (db: Db, id: string) => db.projects.find((p) => p.id === id) ?? notFound()
const findUrl = (db: Db, id: string) => db.urls.find((u) => u.id === id) ?? notFound()
const findRun = (db: Db, id: string) => db.runs.find((r) => r.id === id) ?? notFound()

function validateProjectInput(body: unknown, partial: boolean) {
  const b = (body ?? {}) as { name?: unknown; description?: unknown }
  const name = typeof b.name === 'string' ? b.name.trim() : undefined
  if (!partial || b.name !== undefined) {
    if (!name) badRequest('Project name is required.', { name: ['This field may not be blank.'] })
    if (name.length > 120) badRequest('Project name is too long.', { name: ['Ensure this field has no more than 120 characters.'] })
  }
  const description = typeof b.description === 'string' ? b.description.trim() : undefined
  return { name, description }
}

function startRun(db: Db, projectId: string, urls: DbUrl[], trigger: TestRunTrigger, body: unknown, parent: string | null, now: number) {
  const active = db.runs
    .filter((r) => r.project_id === projectId)
    .map((r) => serializeRun(db, r, now))
    .find((r) => r.status === 'queued' || r.status === 'running')
  if (active) {
    throw new ApiError({
      status: 409,
      kind: 'conflict',
      message: 'A test run is already in progress for this project.',
      body: { error: { code: 'run_in_progress', message: 'A test run is already in progress for this project.' }, active_run_id: active.id },
    })
  }
  if (urls.length === 0) badRequest('There are no URLs to test.')
  const strategy: Strategy = (body as { strategy?: Strategy })?.strategy === 'desktop' ? 'desktop' : 'mobile'
  const run: DbRun = { id: uuid(), project_id: projectId, trigger, strategy, parent_run_id: parent, created_at: iso(now) }
  db.runs.push(run)
  db.results.push(...scheduleResults(run, urls))
  return serializeRun(db, run, now)
}

// Projects
route('GET', '/projects', ({ db, query, now }) => {
  const search = String(query?.search ?? '').toLowerCase()
  const list = db.projects
    .filter((p) => !search || p.name.toLowerCase().includes(search))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => serializeProject(db, p, now))
  return paginate(list, query)
})
route('POST', '/projects', ({ db, body, now }) => {
  const { name, description } = validateProjectInput(body, false)
  if (db.projects.some((p) => p.name.toLowerCase() === name!.toLowerCase()))
    badRequest('A project with this name already exists.', { name: ['A project with this name already exists.'] })
  const p: DbProject = { id: uuid(), name: name!, description: description ?? '', created_at: iso(now), updated_at: iso(now) }
  db.projects.push(p)
  return serializeProject(db, p, now)
})
route('GET', '/projects/:id', ({ db, params, now }) => serializeProject(db, findProject(db, params[0]), now))
route('PATCH', '/projects/:id', ({ db, params, body, now }) => {
  const p = findProject(db, params[0])
  const { name, description } = validateProjectInput(body, true)
  if (name && db.projects.some((o) => o.id !== p.id && o.name.toLowerCase() === name.toLowerCase()))
    badRequest('A project with this name already exists.', { name: ['A project with this name already exists.'] })
  if (name) p.name = name
  if (description !== undefined) p.description = description
  p.updated_at = iso(now)
  return serializeProject(db, p, now)
})
route('DELETE', '/projects/:id', ({ db, params }) => {
  const p = findProject(db, params[0])
  const runIds = new Set(db.runs.filter((r) => r.project_id === p.id).map((r) => r.id))
  db.projects = db.projects.filter((x) => x.id !== p.id)
  db.urls = db.urls.filter((u) => u.project_id !== p.id)
  db.runs = db.runs.filter((r) => !runIds.has(r.id))
  db.results = db.results.filter((r) => !runIds.has(r.run_id))
  return undefined
})

// URLs
route('GET', '/projects/:id/urls', ({ db, params, query, now }) => {
  findProject(db, params[0])
  const search = String(query?.search ?? '').toLowerCase()
  const status = query?.status ? String(query.status) : ''
  const list = db.urls
    .filter((u) => u.project_id === params[0])
    .filter((u) => !search || u.url.toLowerCase().includes(search))
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.url.localeCompare(b.url))
    .map((u) => serializeUrl(db, u, now))
    .filter((u) => !status || (status === 'untested' ? !u.latest_result : u.latest_result?.status === status))
  return paginate(list, query)
})
route('POST', '/projects/:id/urls', ({ db, params, body, now }) => {
  findProject(db, params[0])
  const urls = (body as { urls?: unknown })?.urls
  if (!Array.isArray(urls) || urls.length === 0) badRequest('Provide at least one URL.', { urls: ['This list may not be empty.'] })
  if (urls.length > 1000) badRequest('Too many URLs in one request (max 1000).')
  const existing = new Set(db.urls.filter((u) => u.project_id === params[0]).map((u) => u.url))
  const res: BulkAddUrlsResponse = { created: [], rejected: [] }
  for (const raw of urls) {
    const check = validateUrl(String(raw))
    if (!check.ok) {
      res.rejected.push({ url: String(raw), reason: check.reason === 'unsupported_scheme' ? 'unsupported_scheme' : 'invalid_format', message: 'Enter a valid URL.' })
    } else if (existing.has(check.url)) {
      res.rejected.push({ url: check.url, reason: 'duplicate', message: 'This URL already exists in the project.' })
    } else {
      existing.add(check.url)
      const u: DbUrl = { id: uuid(), project_id: params[0], url: check.url, created_at: iso(now), updated_at: iso(now) }
      db.urls.push(u)
      res.created.push(serializeUrl(db, u, now))
    }
  }
  return res
})
route('GET', '/urls/:id', ({ db, params, now }) => serializeUrl(db, findUrl(db, params[0]), now))
route('PATCH', '/urls/:id', ({ db, params, body, now }) => {
  const u = findUrl(db, params[0])
  const check = validateUrl(String((body as { url?: unknown })?.url ?? ''))
  if (!check.ok) badRequest('Enter a valid URL.', { url: ['Enter a valid URL.'] })
  if (db.urls.some((o) => o.id !== u.id && o.project_id === u.project_id && o.url === check.url))
    badRequest('This URL already exists in the project.', { url: ['This URL already exists in the project.'] })
  u.url = check.url
  u.updated_at = iso(now)
  return serializeUrl(db, u, now)
})
route('DELETE', '/urls/:id', ({ db, params }) => {
  findUrl(db, params[0])
  db.urls = db.urls.filter((u) => u.id !== params[0])
  return undefined
})
route('GET', '/urls/:id/history', ({ db, params, query, now }) => {
  findUrl(db, params[0])
  const list = db.results
    .filter((r) => r.url_id === params[0])
    .sort((a, b) => b.sim_start - a.sim_start)
    .map((r) => serializeResult(db, r, now))
  return paginate(list, query)
})
route('POST', '/urls/:id/test-runs', ({ db, params, body, now }) => {
  const u = findUrl(db, params[0])
  return startRun(db, u.project_id, [u], 'single_url', body, null, now)
})

// Test runs
route('GET', '/projects/:id/test-runs', ({ db, params, query, now }) => {
  findProject(db, params[0])
  const list = db.runs
    .filter((r) => r.project_id === params[0])
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => serializeRun(db, r, now))
  return paginate(list, query)
})
route('POST', '/projects/:id/test-runs', ({ db, params, body, now }) => {
  findProject(db, params[0])
  return startRun(db, params[0], db.urls.filter((u) => u.project_id === params[0]), 'project', body, null, now)
})
route('GET', '/test-runs/:id', ({ db, params, now }) => serializeRun(db, findRun(db, params[0]), now))
route('GET', '/test-runs/:id/results', ({ db, params, query, now }) => {
  findRun(db, params[0])
  const status = query?.status ? String(query.status) : ''
  const search = String(query?.search ?? '').toLowerCase()
  const list = db.results
    .filter((r) => r.run_id === params[0])
    .sort((a, b) => a.sim_start - b.sim_start)
    .map((r) => serializeResult(db, r, now))
    .filter((r) => (!status || r.status === status) && (!search || r.url.toLowerCase().includes(search)))
  return paginate(list, query)
})
route('POST', '/test-runs/:id/retry-failed', ({ db, params, now }) => {
  const run = findRun(db, params[0])
  const failedUrlIds = new Set(
    db.results.filter((r) => r.run_id === run.id && resultStatus(r, now) === 'failed').map((r) => r.url_id),
  )
  const urls = db.urls.filter((u) => failedUrlIds.has(u.id)) // URLs deleted since are skipped
  if (urls.length === 0) badRequest('This run has no failed URLs to retry.')
  return startRun(db, run.project_id, urls, 'retry', { strategy: run.strategy }, run.id, now)
})

// Dashboard
route('GET', '/dashboard/summary', ({ db, now }): DashboardSummary => {
  const projects = db.projects.map((p) => serializeProject(db, p, now))
  const withSummary = projects.filter((p) => p.summary)
  return {
    total_projects: projects.length,
    total_urls: db.urls.length,
    total_test_runs: db.runs.length,
    avg_performance: avg(withSummary.map((p) => p.summary!.avg_performance)),
    avg_accessibility: avg(withSummary.map((p) => p.summary!.avg_accessibility)),
    avg_best_practices: avg(withSummary.map((p) => p.summary!.avg_best_practices)),
    avg_seo: avg(withSummary.map((p) => p.summary!.avg_seo)),
    recent_runs: [...db.runs]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((r) => serializeRun(db, r, now)),
    projects_needing_attention: withSummary.filter(
      (p) => p.summary!.failed_urls > 0 || (p.summary!.avg_performance ?? 100) < 50,
    ),
  }
})

export async function handleMockRequest<T>(method: HttpMethod, path: string, opts: RequestOptions): Promise<T> {
  await sleep(150 + Math.random() * 250) // simulate network latency
  if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const cleanPath = path.split('?')[0]
  for (const [m, re, handler] of routes) {
    const match = m === method ? re.exec(cleanPath) : null
    if (!match) continue
    const db = load()
    // Round-trip through JSON so callers never share references with the "database".
    const result = handler({ db, params: match.slice(1), body: opts.body, query: opts.query, now: Date.now() })
    if (method !== 'GET') save(db)
    return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T
  }
  notFound()
}
