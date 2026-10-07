import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { env } from '../config/env'
import { Icon, type IconName } from '../components/common/Icon'

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/projects', label: 'Projects', icon: 'folder' },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-14 items-center gap-2 px-4 text-white">
        <img src="/favicon.svg" alt="" className="h-7 w-7" />
        <span className="leading-tight font-semibold">SEO &amp; Performance</span>
      </div>
      <ul className="flex-1 space-y-1 px-2 py-3">
        {NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <p className="px-4 py-3 text-xs text-slate-500">Internal tool · v0.1</p>
    </nav>
  )
}

export function AppLayout() {
  const location = useLocation()
  // The menu is "open for" a specific path, so navigating anywhere closes it automatically.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null)
  const mobileOpen = openOnPath === location.pathname
  const setMobileOpen = (open: boolean) => setOpenOnPath(open ? location.pathname : null)

  return (
    <div className="min-h-screen lg:pl-60">
      <a href="#main" className="sr-only z-50 rounded bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        <button type="button" className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <span className="font-semibold text-slate-900 lg:hidden">SEO &amp; Performance</span>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          {env.useMockApi ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">Mock API</span>
          ) : (
            <span className="hidden sm:inline" title="Backend API">
              API: {env.apiBaseUrl || 'not configured'}
            </span>
          )}
        </div>
      </header>

      {env.useMockApi && (
        <div role="note" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6">
          <strong>Mock API mode:</strong> all data and Lighthouse results are simulated in your browser and are <strong>not real</strong>. Set{' '}
          <code className="rounded bg-amber-100 px-1">VITE_USE_MOCK_API=false</code> to use the Django backend.
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
