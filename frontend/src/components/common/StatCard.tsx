import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/** Compact metric tile. Keep values plain — colour only when it carries meaning (e.g. failures). */
export function StatCard({ label, value, hint, icon, tone = 'default' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: IconName; tone?: 'default' | 'good' | 'poor' | 'warn' }) {
  const toneClass = { default: 'text-fg', good: 'text-good', poor: 'text-poor', warn: 'text-warn' }[tone]
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <dt className="flex items-center justify-between gap-2 text-[13px] font-medium text-fg-muted">
        <span className="truncate">{label}</span>
        {icon && <Icon name={icon} className="h-4 w-4 text-fg-subtle" />}
      </dt>
      <dd className={`mt-2 text-2xl leading-none font-semibold tracking-tight tabular-nums ${toneClass}`}>{value}</dd>
      {hint && <dd className="mt-1.5 text-xs text-fg-muted">{hint}</dd>}
    </div>
  )
}
