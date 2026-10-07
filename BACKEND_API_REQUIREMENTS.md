# Backend API Requirements — SEO & Website Performance Monitoring Dashboard

**Audience:** Satyaprakash (backend owner)
**From:** Frontend (React + Vite + TypeScript)
**Status:** 📝 Proposal v0.1. Everything here is open for discussion. Once we agree, the frontend will match the final contract.

The frontend is already built against this contract and runs today against an in-browser
**mock backend** that implements it (`frontend/src/services/mock/mockBackend.ts`). That file is
also an executable reference for the behaviour described below.

> Where the types live in the frontend: `frontend/src/types/api.ts`. If you change a field,
> tell me and I'll update that file. TypeScript then shows every screen that needs changing.

---

## 1. Responsibilities

| Concern | Owner |
|---|---|
| Django, DRF, PostgreSQL, models, migrations | Backend |
| Calling PageSpeed Insights / Lighthouse, **Google API key** | Backend only. The key must never reach the browser |
| Background processing of test runs (queue/worker/threads) | Backend |
| Storing every result (history is never overwritten) | Backend |
| Computing averages, comparisons and progress counts | Backend (frontend only displays them) |
| UI, validation UX, polling, charts | Frontend |

---

## 2. Conventions

| Topic | Convention |
|---|---|
| Base URL | `/api` (frontend reads it from `VITE_API_BASE_URL`, e.g. `https://api.example.com/api`) |
| Trailing slashes | Yes, DRF default (`/api/projects/`) |
| Format | JSON (`Content-Type: application/json`) |
| IDs | Strings. **UUIDs recommended** (not guessable, safe to expose) |
| Timestamps | ISO 8601 **UTC** with `Z`, e.g. `"2026-10-06T10:00:00Z"`. Frontend converts to the viewer's timezone |
| Durations | Integer **seconds**, field name `duration_seconds` |
| Lighthouse timings | **Milliseconds** (`fcp_ms`, `lcp_ms`, `tbt_ms`, `speed_index_ms`). That's Lighthouse's `numericValue`, with no conversion needed |
| CLS | Unitless number (e.g. `0.02`) |
| Category scores | Integers **0–100** (Lighthouse `categories.*.score × 100`, rounded) |
| Metric scores | Lighthouse audit `score` **0–1** (used to show Good / Needs Improvement / Poor) |
| Nullable | Use `null`, never omit fields or send `""` for missing values |
| Field naming | `snake_case` |

### Pagination (DRF `PageNumberPagination`)

All list endpoints are paginated with `?page=<n>&page_size=<n>` (default 25, max 100).

```json
{ "count": 125, "next": "https://…?page=3", "previous": "https://…?page=1", "results": [ … ] }
```

Projects may have **500+ URLs**, so please paginate and filter server-side. The frontend never loads all URLs at once.

---

## 3. Error format

Preferred envelope for all 4xx/5xx responses:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Project name is required.",
    "details": { "name": ["This field may not be blank."] }
  }
}
```

The frontend **also understands DRF's default formats** (`{"detail": "..."}` and `{"field": ["msg"]}`),
so a custom exception handler is nice to have, not a blocker.

| Status | When | Frontend behaviour |
|---|---|---|
| 400 | Validation error | Shows field errors next to inputs |
| 401 / 403 | Auth (later phase) | "Session expired" / "No permission" |
| 404 | Unknown ID, out-of-range page | "Not found / may have been deleted" |
| 408 / 504 | Timeout | "Server took too long" |
| 409 | Test run already in progress (see §6) | Opens the active run's progress page |
| 429 | Rate limited | "Too many requests, wait a moment" |
| 500 | Unexpected error | Generic message (**never return stack traces**, `DEBUG=False` in prod) |
| 502 / 503 | Down / deploying | "Temporarily unavailable" |

---

## 4. Data model (conceptual)

```
Project 1───* ProjectURL
Project 1───* TestRun 1───* URLTestResult *───1 ProjectURL
```

- **Project**: a website.
- **ProjectURL**: a page to monitor.
- **TestRun**: one click of "Run test" (whole project, single URL, or retry of failures).
- **URLTestResult**: Lighthouse output for one URL in one run. **Never updated after it completes. Never overwritten by later runs.**

---

## 5. Endpoints overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects/?search=&page=` | List projects |
| POST | `/api/projects/` | Create project |
| GET | `/api/projects/{id}/` | Project detail |
| PATCH | `/api/projects/{id}/` | Edit name/description |
| DELETE | `/api/projects/{id}/` | Delete project (and its URLs/runs/results) |
| GET | `/api/projects/{id}/urls/?search=&status=&page=` | List project URLs (with latest result) |
| POST | `/api/projects/{id}/urls/` | **Bulk add** URLs (partial success) |
| GET | `/api/urls/{id}/` | URL detail |
| PATCH | `/api/urls/{id}/` | Edit URL |
| DELETE | `/api/urls/{id}/` | Delete URL |
| GET | `/api/urls/{id}/history/?page=` | All results for one URL, newest first |
| POST | `/api/projects/{id}/test-runs/` | **Start test of all URLs** in project |
| GET | `/api/projects/{id}/test-runs/?page=` | Run history for a project, newest first |
| POST | `/api/urls/{id}/test-runs/` | Start test of a single URL |
| GET | `/api/test-runs/{id}/` | Run status + progress (**polled every 2–3 s**) |
| GET | `/api/test-runs/{id}/results/?status=&page=` | Per-URL results of a run |
| POST | `/api/test-runs/{id}/retry-failed/` | New run containing only the failed URLs |
| GET | `/api/dashboard/summary/` | Main dashboard numbers |

> **Naming note:** the original brief mixed `performance-tests` and `test-runs`. I used
> **`test-runs`** everywhere for consistency. Happy to rename.

---

## 6. Resources & endpoints in detail

### 6.1 Project

```json
{
  "id": "5b26ac91-ff01-4125-b77e-dcb6d7efc2d2",
  "name": "Akhand Jyoti Website",
  "description": "SEO and performance monitoring for the Akhand Jyoti website.",
  "url_count": 25,
  "created_at": "2026-10-06T09:12:00Z",
  "updated_at": "2026-10-06T09:12:00Z",
  "last_tested_at": "2026-10-06T10:12:45Z",
  "active_run_id": null,
  "summary": {
    "avg_performance": 89,
    "avg_accessibility": 95,
    "avg_best_practices": 93,
    "avg_seo": 97,
    "tested_urls": 25,
    "successful_urls": 23,
    "failed_urls": 2
  }
}
```

| Field | Rule |
|---|---|
| `name` | Required, trimmed, max 120 chars. **Suggest unique (case-insensitive)**. 400 on duplicate |
| `description` | Optional, may be `""` |
| `last_tested_at` | `completed_at` of the most recent finished run, `null` if never tested |
| `active_run_id` | ID of a `queued`/`running` run, else `null`. **Important:** lets the UI resume progress after a page refresh |
| `summary` | Based on **each URL's latest finished result**. Averages over completed results only. `null` if nothing tested yet |

**POST /api/projects/**: body `{ "name": "...", "description": "..." }` → `201` + Project.
**PATCH /api/projects/{id}/**: any subset of `name`, `description` → `200` + Project.
**DELETE /api/projects/{id}/**: `204`. *(Decision needed: hard delete vs soft delete; see §10.)*

### 6.2 ProjectURL

```json
{
  "id": "…",
  "project_id": "…",
  "url": "https://example.com/about",
  "created_at": "2026-10-06T09:15:00Z",
  "updated_at": "2026-10-06T09:15:00Z",
  "latest_result": { /* URLTestResult or null */ }
}
```

- `latest_result` = this URL's most recent result **of any status** (including `pending`/`running`), so the table shows live status during a run. `null` if never tested.

**GET /api/projects/{id}/urls/** query params:
- `search`: substring match on URL
- `status`: `completed | failed | running | pending | untested` (`untested` = no results yet), filtering on `latest_result.status`
- `page`, `page_size`
- Default ordering: `created_at` ascending

**POST /api/projects/{id}/urls/** (bulk add, **partial success**):

Request:
```json
{ "urls": ["https://example.com/", "https://example.com/about", "example.com/bad"] }
```
Response `201` (even if some were rejected):
```json
{
  "created": [ /* ProjectURL objects */ ],
  "rejected": [
    { "url": "example.com/bad", "reason": "invalid_format", "message": "Enter a valid URL." },
    { "url": "https://example.com/", "reason": "duplicate", "message": "This URL already exists in the project." }
  ]
}
```
- `reason`: `invalid_format | duplicate | unsupported_scheme | other`
- Only `http`/`https`. One invalid URL must **not** reject the valid ones.
- Duplicate = same normalised URL already in the **same project** (suggest a DB unique constraint on `(project, url)`). The frontend strips `#fragments` before sending.
- Max 1000 URLs per request → `400` above that.

**PATCH /api/urls/{id}/**: `{ "url": "https://…" }` → `200` + ProjectURL. `400` with `details.url` on invalid/duplicate.
**DELETE /api/urls/{id}/**: `204`.

### 6.3 TestRun

```json
{
  "id": "…",
  "project_id": "…",
  "project_name": "Akhand Jyoti Website",
  "trigger": "project",
  "strategy": "mobile",
  "status": "running",
  "parent_run_id": null,
  "total_urls": 25,
  "completed_urls": 12,
  "failed_urls": 1,
  "current_url": "https://example.com/about",
  "created_at": "2026-10-06T10:00:00Z",
  "started_at": "2026-10-06T10:00:02Z",
  "completed_at": null,
  "duration_seconds": null,
  "summary": null
}
```

| Field | Values / rule |
|---|---|
| `trigger` | `project` (all URLs) · `single_url` · `retry` |
| `strategy` | `mobile` (default) · `desktop`. Passed to PageSpeed `strategy=` |
| `status` | `queued` → `running` → `completed` · `completed_with_errors` (some failed) · `failed` (all failed / fatal) · `cancelled` (future) |
| `completed_urls` / `failed_urls` | Live counters, updated as each URL finishes |
| `current_url` | A URL currently being analysed (any one if parallel), `null` otherwise |
| `duration_seconds` | `completed_at − started_at`, `null` while running |
| `summary` | See below. May be `null` until at least one URL completes |

`summary`:
```json
{
  "avg_performance": 89, "avg_accessibility": 94, "avg_best_practices": 92, "avg_seo": 96,
  "improved_count": 4, "regressed_count": 1, "unchanged_count": 18
}
```
- Averages over **completed** results in this run.
- `improved/regressed/unchanged_count` compare each result's **performance** score with that URL's previous completed result. A change of **≥ 5 points** counts as improved/regressed (proposed threshold; Lighthouse varies by a few points run to run). **All three must be `null` when no URL in the run has a previous result.** Never return fake comparisons.

**POST /api/projects/{id}/test-runs/**: body `{ "strategy": "mobile" }` (optional).
- Creates the run **and returns immediately** with `201` + TestRun (`status: "queued"`). **Do not process URLs inside the HTTP request.** 25 URLs × ~20 s would time out.
- `400` if the project has no URLs.
- `409` if the project already has a queued/running run. **Include its ID** so the UI can open it:
  ```json
  { "error": { "code": "run_in_progress", "message": "A test run is already in progress for this project." }, "active_run_id": "…" }
  ```
  *(Proposal: one active run per project at a time. That avoids double-spending PageSpeed quota.)*

**POST /api/urls/{id}/test-runs/**: same as above but `total_urls = 1`, `trigger = "single_url"`. Same 409 rule.

**POST /api/test-runs/{id}/retry-failed/**: creates a **new** run (`trigger: "retry"`, `parent_run_id` = original) containing **only** the URLs that failed in run `{id}` (skipping URLs deleted since). Uses the original run's strategy. `400` if there are no failed URLs. The original run is left untouched (history).

**GET /api/test-runs/{id}/**: polled by the frontend every 2–3 s while active. **Keep it cheap**: counters only, no result list.

**GET /api/test-runs/{id}/results/**: paginated `URLTestResult` list, ordered by processing order. Optional `status=` and `search=` filters.

### 6.4 URLTestResult

```json
{
  "id": "…",
  "test_run_id": "…",
  "url_id": "…",
  "url": "https://example.com/about",
  "status": "completed",
  "strategy": "mobile",
  "scores": { "performance": 92, "accessibility": 98, "best_practices": 95, "seo": 100 },
  "metrics": { "fcp_ms": 1200, "lcp_ms": 2100, "tbt_ms": 150, "cls": 0.02, "speed_index_ms": 2400 },
  "metric_scores": { "fcp": 0.94, "lcp": 0.91, "tbt": 0.93, "cls": 1, "speed_index": 0.97 },
  "previous_scores": { "performance": 88, "accessibility": 98, "best_practices": 95, "seo": 100 },
  "error": null,
  "started_at": "2026-10-06T10:00:02Z",
  "completed_at": "2026-10-06T10:00:24Z",
  "duration_seconds": 22,
  "lighthouse_version": "12.2.1"
}
```

| Field | Rule |
|---|---|
| `status` | `pending` · `running` · `completed` · `failed` |
| `scores`, `metrics`, `metric_scores` | Only when `completed`, else `null`. Individual values may be `null` if Lighthouse didn't report them |
| `previous_scores` | `scores` of this URL's **previous completed** result (before this one), `null` if none. Powers the "+7 ↑ / −15 ↓" comparison |
| `error` | Only when `failed`: `{ "code": "...", "message": "human-readable" }` |
| `url` | Snapshot of the URL **at test time** (so history stays correct if the URL is edited later) |

**Mapping from the PageSpeed Insights v5 response** (`lighthouseResult`):

| Our field | PSI path |
|---|---|
| `scores.performance` | `categories.performance.score × 100` |
| `scores.accessibility` | `categories.accessibility.score × 100` |
| `scores.best_practices` | `categories["best-practices"].score × 100` |
| `scores.seo` | `categories.seo.score × 100` |
| `metrics.fcp_ms` / `metric_scores.fcp` | `audits["first-contentful-paint"].numericValue` / `.score` |
| `metrics.lcp_ms` / `metric_scores.lcp` | `audits["largest-contentful-paint"]` |
| `metrics.tbt_ms` / `metric_scores.tbt` | `audits["total-blocking-time"]` |
| `metrics.cls` / `metric_scores.cls` | `audits["cumulative-layout-shift"]` |
| `metrics.speed_index_ms` / `metric_scores.speed_index` | `audits["speed-index"]` |
| `lighthouse_version` | `lighthouseVersion` |

Request all four categories: `…/runPagespeed?url=…&strategy=mobile&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&key=<server-side key>`.

The frontend derives **Good / Needs Improvement / Poor** from these scores using Lighthouse's
documented bands (90–100 / 50–89 / 0–49). The backend doesn't need to compute ratings.

**Error codes** (`error.code`):

| Code | Typical cause |
|---|---|
| `timeout` | Lighthouse/PSI timed out |
| `invalid_url` | URL rejected by PSI |
| `page_unavailable` | Target returned 4xx/5xx or DNS failure (PSI `FAILED_DOCUMENT_REQUEST`, `ERRORED_DOCUMENT_REQUEST`, `DNS_FAILURE`) |
| `pagespeed_api_error` | Other PSI 4xx/5xx |
| `rate_limited` | PSI 429 / quota exceeded |
| `backend_error` | Our own exception |
| `unknown` | Anything else |

One failing URL must **not** fail the whole run.

### 6.5 URL history

**GET /api/urls/{id}/history/?page=&page_size=**: paginated `URLTestResult` list for this URL across **all runs**, **newest first**. The frontend requests `page_size=100` for the trend chart.

### 6.6 Dashboard

**GET /api/dashboard/summary/**
```json
{
  "total_projects": 4,
  "total_urls": 120,
  "total_test_runs": 37,
  "avg_performance": 86, "avg_accessibility": 94, "avg_best_practices": 92, "avg_seo": 96,
  "recent_runs": [ /* 5 most recent TestRun objects */ ],
  "projects_needing_attention": [ /* Project objects */ ]
}
```
- Averages: mean of project `summary` averages (projects with no tests excluded). `null` when nothing tested.
- `projects_needing_attention`: projects whose latest results have **any failed URL** or **avg performance < 50**.

---

## 7. Background processing

```
POST /test-runs  →  create TestRun + one pending URLTestResult per URL  →  return 201 immediately
                                       │
                         worker picks pending results
                                       │
             for each URL: status=running → call PSI → save → completed/failed
             update run counters (completed_urls / failed_urls / current_url)
                                       │
              all done → run.status, completed_at, duration_seconds, summary
```

- **Phase 1:** anything that doesn't block the request (thread pool, `django-q`, `django-rq`, or a management-command worker).
- **Phase 3:** Celery + Redis + scheduled runs. The API contract stays the same, so the frontend won't change.
- **Concurrency:** PageSpeed Insights has per-minute and per-day quotas (check the exact values for our key in Google Cloud Console → APIs → PageSpeed Insights → Quotas). A few parallel requests with backoff and retry on 429 is a reasonable start. A single PSI call often takes 10–30 s.
- **Stuck runs:** if the worker dies, runs should not stay `running` forever. Suggest a timeout that marks remaining results `failed` with `backend_error`.
- **Progress transport:** the frontend polls `GET /test-runs/{id}/`. SSE or WebSockets can be added later. The frontend has a single swap point (`performanceService.subscribeToRun`).

---

## 8. CORS (django-cors-headers)

```python
# settings.py
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", *MIDDLEWARE]  # as high as possible

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[
    "http://localhost:5173",   # Vite dev server
])
# Production example (set via environment variable, not hard-coded):
#   CORS_ALLOWED_ORIGINS=https://seo-dashboard.vercel.app
# Vercel preview deployments (optional):
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://seo-dashboard-.*\.vercel\.app$"]
```
Methods needed: `GET, POST, PATCH, DELETE, OPTIONS`. Headers: `Content-Type`, `Accept` (+ `Authorization` later).
No cookies are sent today. If session auth is added later, we'll need `CORS_ALLOW_CREDENTIALS = True` and CSRF config.

---

## 9. Authentication (later phase)

Phase 1: no auth (internal tool). **Please still don't expose the API publicly without some protection** (IP allowlist / VPN / basic auth at the proxy).
When auth arrives (Phase 6), the frontend will send `Authorization: Bearer <token>` from one place (`frontend/src/services/api.ts`) and handle `401` globally. Preference: JWT (`djangorestframework-simplejwt`) or DRF token auth. Let's decide together.

---

## 10. Decisions needed from you

1. **Endpoint naming:** OK with `test-runs`?
2. **Delete semantics:** hard delete (current UI copy says history is deleted) vs soft delete / archive to keep history?
3. **One active run per project** (409), or allow parallel runs?
4. **Strategy:** mobile only for Phase 1, or both? (UI currently sends nothing, so the backend default `mobile` applies.)
5. **Comparison threshold:** 5 points OK? Should the backend own it (it does in `summary`)?
6. **Project name uniqueness:** enforce?
7. **IDs:** UUID OK?
8. **Background worker choice** for Phase 1.
9. **Deployment URL** for the API (for `VITE_API_BASE_URL` in Vercel).

---

## 11. Integration checklist

- [ ] `GET /api/projects/` works from `http://localhost:5173` (CORS)
- [ ] Field names and types match §6 (or differences communicated)
- [ ] Timestamps are UTC with `Z`
- [ ] `POST …/test-runs/` returns in < 1 s
- [ ] `GET /test-runs/{id}/` counters move while the run is processing
- [ ] Partial failure: one bad URL doesn't fail the run
- [ ] Retry creates a new run with only failed URLs
- [ ] History contains every result. Nothing is overwritten
- [ ] Errors never include stack traces (`DEBUG=False`)
- [ ] Google API key only in backend env vars, never in responses or logs
