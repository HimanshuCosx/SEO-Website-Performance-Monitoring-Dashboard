import { Link, Outlet } from 'react-router-dom'
import { Icon, type IconName } from '../components/common/Icon'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { routes } from '../constants/routes'

const HIGHLIGHTS: { icon: IconName; label: string }[] = [
  { icon: 'gauge', label: 'Lighthouse audits' },
  { icon: 'activity', label: 'Core Web Vitals' },
  { icon: 'history', label: 'Score history' },
]

/** Decorative glows + fading grid behind the card. Purely visual, hidden from assistive tech. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-[70%] rounded-full bg-primary/25 blur-3xl sm:h-[36rem] sm:w-[36rem]" />
      <div className="absolute top-1/3 left-1/2 h-[24rem] w-[24rem] translate-x-[10%] rounded-full bg-[#8b5cf6]/20 blur-3xl sm:h-[30rem] sm:w-[30rem]" />
      <div className="absolute -bottom-40 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-info/15 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] bg-[size:44px_44px] opacity-60" />
    </div>
  )
}

/** Centered-card shell for login, sign-up and password reset. */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas">
      <Backdrop />

      <header className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-8">
        <Link to={routes.login()} className="flex items-center gap-2 rounded-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#8b5cf6] text-primary-fg shadow-card">
            <Icon name="gauge" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-fg">SEO &amp; Performance</span>
        </Link>
        <ThemeToggle />
      </header>

      <main id="main" className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-[26rem] rounded-2xl border border-line bg-surface/85 p-5 shadow-pop backdrop-blur-xl sm:p-8">
          <Outlet />
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {HIGHLIGHTS.map((h) => (
            <li key={h.label} className="flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-fg-muted backdrop-blur">
              <Icon name={h.icon} className="h-3.5 w-3.5 text-link" />
              {h.label}
            </li>
          ))}
        </ul>
      </main>

      <footer className="relative z-10 px-4 pb-6 text-center text-xs text-fg-subtle">SEO &amp; Performance Monitoring Dashboard</footer>
    </div>
  )
}
