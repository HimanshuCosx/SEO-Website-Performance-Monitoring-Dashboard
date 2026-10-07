import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export interface Crumb {
  label: string
  to?: string
}

export function PageHeader({ title, description, actions, breadcrumbs }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; breadcrumbs?: Crumb[] }) {
  return (
    <header className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-fg-muted">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((c, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <Icon name="chevronRight" className="h-3.5 w-3.5 text-fg-subtle" />}
                {c.to ? (
                  <Link to={c.to} className="truncate transition-colors hover:text-fg">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="max-w-[16rem] truncate font-medium text-fg-secondary">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight break-words text-fg sm:text-2xl">{title}</h1>
          {description && <div className="mt-1 text-sm text-fg-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
