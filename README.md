# SEO & Website Performance Monitoring Dashboard

Internal tool for monitoring Lighthouse / PageSpeed performance and SEO health of many pages across many websites.

```
React frontend (this repo: /frontend)  ──REST──▶  Django REST API (owned by Satyaprakash)  ──▶  PageSpeed Insights / PostgreSQL
```

| Folder / file | What |
|---|---|
| `frontend/` | React + Vite + TypeScript + Tailwind app |
| `BACKEND_API_REQUIREMENTS.md` | API contract the frontend needs from Django (share with backend) |
| `docs/QA_CHECKLIST.md` | Manual QA checklist |

The frontend never talks to Google directly and never holds the PageSpeed API key. The Django backend does.

## Quick start

```bash
cd frontend
cp .env.example .env        # then set VITE_USE_MOCK_API=true to work without the backend
npm install
npm run dev                 # http://localhost:5173
```

### Environment variables (`frontend/.env`)

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Django API base URL (no trailing slash) |
| `VITE_USE_MOCK_API` | `true` / `false` | `true` = simulated in-browser backend for UI work. **Results are fake.** Must be `false` in production |
| `VITE_POLL_INTERVAL_MS` | `3000` | How often running tests are polled |

> `VITE_*` variables are embedded in the public JavaScript bundle. **Never put secrets in them.**

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest): URL validation, Lighthouse rating rules, formatting |
| `npm run lint` | Lint (oxlint) |
| `npm run typecheck` | TypeScript only |

## Frontend architecture

```
frontend/src/
├── config/env.ts            # the ONLY place that reads import.meta.env
├── types/api.ts             # TypeScript mirror of the backend contract
├── services/                # ALL backend communication
│   ├── api.ts               #   fetch wrapper: base URL, timeouts, error normalisation
│   ├── projectService.ts    #   /projects
│   ├── urlService.ts        #   /urls, bulk add, history
│   ├── performanceService.ts#   test runs, results, retry, progress subscription (polling)
│   ├── dashboardService.ts
│   └── mock/mockBackend.ts  #   dev-only simulated backend (isolated, lazy-loaded)
├── hooks/                   # useApiQuery, useRunProgress, useStartRun, useToast, …
├── utils/                   # pure functions (+ *.test.ts): validation, formatting, Lighthouse rules
├── constants/               # Lighthouse bands & labels, routes, error labels
├── components/
│   ├── common/              # Button, Modal, ConfirmDialog, badges, states, pagination…
│   ├── projects/ urls/ performance/ history/
├── layouts/AppLayout.tsx    # sidebar + header
└── pages/                   # one folder per screen
```

Data flow: **page → hook → service → `api.ts` → Django**. Components never call `fetch` directly.

Long-running tests: `POST …/test-runs/` returns immediately. `useRunProgress` → `performanceService.subscribeToRun` polls `GET /test-runs/{id}/` until done. To move to SSE/WebSockets later, only `subscribeToRun` changes.

## Deploying to Vercel

1. Import the repo in Vercel and set **Root Directory = `frontend`** (framework preset: Vite).
2. Environment variables (Production + Preview):
   - `VITE_API_BASE_URL` = `https://<django-host>/api`
   - `VITE_USE_MOCK_API` = `false`
3. Deploy. `frontend/vercel.json` rewrites all routes to `index.html` so deep links like `/projects/123` work on refresh.
4. Ask the backend to add the Vercel domain to `CORS_ALLOWED_ORIGINS` (see `BACKEND_API_REQUIREMENTS.md` §8).

Changing an env var in Vercel requires a **redeploy**, because Vite bakes the values in at build time.

## Roadmap

- **Phase 1 (current):** projects, bulk URLs, bulk & single tests, progress, results, retry, history, comparison
- Phase 2: trend charts per project, regression detection, better filtering
- Phase 3: Celery/Redis, scheduled monitoring
- Phase 4: Google Analytics Data API
- Phase 5: alerts, email, reports, CSV/PDF export
- Phase 6: authentication, roles, teams
