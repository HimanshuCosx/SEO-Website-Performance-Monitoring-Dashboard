import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '../components/common/Icon'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { env } from '../config/env'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }] },
  { title: 'Monitoring', items: [{ to: '/projects', label: 'Projects', icon: 'folder' }] },
]

/** Header title for the current top-level section. */
function sectionTitle(pathname: string) {
  if (pathname.startsWith('/projects')) return 'Projects'
  if (pathname === '/') return 'Dashboard'
  return ''
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-fg">
        <Icon name="gauge" className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-semibold text-fg">SEO &amp; Performance</span>
        <span className="block text-[11px] text-fg-muted">Monitoring dashboard</span>
      </span>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center border-b border-line px-4">
        <Brand />
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-[11px] font-medium tracking-wide text-fg-subtle uppercase">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${isActive ? 'bg-primary-soft text-link' : 'text-fg-secondary hover:bg-subtle hover:text-fg'}`
                    }
                  >
                    <Icon name={item.icon} className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-fg-muted">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${env.useMockApi ? 'bg-warn' : 'bg-good'}`} />
          {env.useMockApi ? 'Mock API (simulated data)' : 'Connected to API'}
        </p>
        {!env.useMockApi && (
          <p className="mt-0.5 truncate pl-3.5 font-mono text-[11px] text-fg-subtle" title={env.apiBaseUrl}>
            {env.apiBaseUrl || 'VITE_API_BASE_URL not set'}
          </p>
        )}
      </div>
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
      <a href="#main" className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-fg shadow-pop focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 cursor-pointer bg-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-pop">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-sm sm:px-6">
        <button type="button" className="-ml-1 rounded-md p-1.5 text-fg-muted hover:bg-subtle hover:text-fg lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <span className="text-[13px] font-medium text-fg-secondary">{sectionTitle(location.pathname)}</span>
        <div className="ml-auto flex items-center gap-2">
          {env.useMockApi && (
            <span className="rounded-full border border-warn/25 bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn" title="Data is simulated in the browser">
              Mock API
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {env.useMockApi && (
        <div role="note" className="flex items-start gap-2 border-b border-warn/20 bg-warn-soft px-4 py-2 text-[13px] text-fg-secondary sm:px-6">
          <Icon name="alert" className="mt-0.5 h-4 w-4 text-warn" />
          <p>
            <strong className="font-semibold text-fg">Mock API mode.</strong> All data and Lighthouse results are simulated in your browser and are not real. Set{' '}
            <code className="rounded bg-surface/70 px-1 font-mono text-xs">VITE_USE_MOCK_API=false</code> to use the Django backend.
          </p>
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
