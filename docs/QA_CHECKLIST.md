# Manual QA Checklist — Frontend

Run with the mock API (`VITE_USE_MOCK_API=true`) for UI flows, then repeat the starred (★) items against the real Django backend.

**Mock helpers:** any URL containing `fail` always fails, and other URLs fail randomly (~10%).
To reset mock data: DevTools → Console → `localStorage.removeItem('seo-dashboard-mock-db-v1')`, then refresh.

Legend: ☐ = not tested · ✅ pass · ❌ fail (note the bug)

## 1. Projects
- ☐ ★ Empty state "No projects yet." shows when there are no projects
- ☐ ★ Create project with name + description → redirects to project page, success toast
- ☐ Create with empty / whitespace name → "Project name is required.", no request sent
- ☐ Name > 120 chars → validation message
- ☐ ★ Duplicate name → server error shown under the name field
- ☐ Edit project name/description → updated in header and project list
- ☐ ★ Delete project → confirmation dialog → Cancel keeps it, Confirm deletes and returns to list
- ☐ Project list search filters by name, "No matching projects" when nothing matches
- ☐ Project card shows URL count, last tested ("Never" if untested), avg performance, avg SEO, failed count, status badge
- ☐ "Run test" disabled on a project with 0 URLs (tooltip explains why)

## 2. Adding URLs (bulk)
- ☐ ★ Paste 5 valid URLs (one per line) → "5 URLs entered · 5 valid" → all added
- ☐ ★ Mixed list (e.g. `example.com/about`) → invalid listed with reason, **valid ones still added**
- ☐ `ftp://…` → "Only http:// and https://"
- ☐ `https://localhost` / `https://foo` → "Missing or invalid domain"
- ☐ Blank lines and surrounding spaces are ignored
- ☐ Duplicate lines within the paste → added once, "N duplicate" shown
- ☐ ★ URL already in project → server rejection shown in dialog, others added
- ☐ Empty textarea → Add button disabled
- ☐ > 1000 valid URLs → blocked with "split the list" message
- ☐ Large list (100+ URLs) → UI stays responsive, table paginates (25 per page)

## 3. URL management
- ☐ ★ Empty state "No URLs added to this project." with Add URLs button
- ☐ Table shows path + host, status, Performance/A11y/Best Practices/SEO, last tested
- ☐ Search URLs, filter by status (Completed / Failed / Running / Pending / Not tested)
- ☐ Pagination: next/previous, "x–y of z"
- ☐ Edit URL → validation, duplicate rejected, saved
- ☐ ★ Delete URL → confirmation → removed. Deleting the last row on page 2 moves back to page 1
- ☐ View (history icon) opens URL details page
- ☐ External host link opens the page in a new tab

## 4. Bulk performance test ★
- ☐ "Run performance test" → returns immediately → progress page
- ☐ Progress shows `X / N`, completed / failed / remaining counts, progress bar, current URL, elapsed time
- ☐ Each URL row moves Pending → Running → Completed / Failed
- ☐ UI is never frozen (can scroll, navigate away)
- ☐ Navigate away and back → progress continues
- ☐ **Browser refresh during a test** → progress page resumes. Project page shows the live progress card
- ☐ Starting a second run while one is active → opens existing run (409 handling), no duplicate run
- ☐ Single-URL "Run" buttons disabled while a project run is active
- ☐ Finished run shows summary: total / completed / failed / duration / averages / start & end time
- ☐ Improvements / Regressions / No significant change **only appear when previous results exist** (not on the first ever run)

## 5. Failed URLs & retry ★
- ☐ Partial failure: run status "Completed with errors", completed URLs still have results
- ☐ Failed rows show reason (Timeout / Page unavailable / PageSpeed API error / Rate limit / …)
- ☐ "Retry N failed URLs" creates a new run with **only** the failed URLs (total = N)
- ☐ Retry run links back to the original run. The original run is unchanged
- ☐ No retry button when nothing failed

## 6. Individual URL test
- ☐ Run from URL row or URL details page → 1-URL run → result appears in history
- ☐ Failed URL row shows "Retry" icon

## 7. Results & metrics
- ☐ Four score gauges (Performance, Accessibility, Best Practices, SEO) with Lighthouse colours (90+ green, 50–89 orange, <50 red)
- ☐ FCP, LCP, TBT, CLS, Speed Index shown with units (s / ms, CLS unitless) and Good / Needs Improvement / Poor
- ☐ Colour is never the only signal (labels / tooltips present)
- ☐ Date, time and duration shown for every result, in local timezone, consistent format (`07 Oct 2026, 12:01 PM`)

## 8. History & comparison ★
- ☐ Run the same project twice → both runs listed in "View history". Nothing overwritten
- ☐ URL history table lists every test, newest first, with all scores and metrics
- ☐ Trend chart appears only with ≥ 2 completed tests. Hover shows exact values
- ☐ "Prev 88 +7 ↑" style comparison only when a previous completed test exists
- ☐ First-ever test shows "nothing to compare against yet" (no fake comparison)
- ☐ "No historical data available." for a never-tested URL

## 9. Dashboard
- ☐ Empty state with no projects. **No fake numbers**
- ☐ Totals (projects, URLs, test runs), averages, recent runs, projects needing attention
- ☐ Averages show "—" when nothing has been tested

## 10. Errors, network & loading ★
- ☐ Backend stopped (`VITE_USE_MOCK_API=false`, no server) → "Cannot reach the server…" + Try again
- ☐ DevTools → Network → Offline during a running test → inline error, polling continues and recovers when back online
- ☐ Slow 3G throttling → skeleton loaders shown, no layout jumps
- ☐ Open a deleted project/URL/run link → friendly "not found" message
- ☐ 400 / 404 / 409 / 429 / 500 / 503 → friendly messages, **no stack traces / HTML**
- ☐ Unknown route → 404 page with link to dashboard

## 11. Responsive & accessibility
- ☐ Widths 1440 / 1280 / 1024 / 768 / 390: no horizontal page scroll (tables scroll inside their card)
- ☐ Mobile: hamburger opens sidebar. Choosing a page closes it
- ☐ Keyboard only: Tab through every control, focus ring visible, Esc closes dialogs, "Skip to content" link works
- ☐ Dialogs trap focus and return focus after closing
- ☐ Screen reader: buttons with icons only have labels (e.g. "Delete https://…")

## 12. Security & configuration
- ☐ No Google API key anywhere in the built bundle (`grep -ri "AIza" frontend/dist` returns nothing)
- ☐ `.env` is not committed (`git status` doesn't show it)
- ☐ `VITE_API_BASE_URL` change is picked up after restarting `npm run dev`
- ☐ Production build does **not** show the "Mock API mode" banner
