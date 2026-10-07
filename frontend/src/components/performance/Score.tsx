import { RATING_STYLES } from '../../constants/ratingStyles'
import { formatScore, formatSignedDiff } from '../../utils/format'
import { compareScores, RATING_LABELS, scoreRating } from '../../utils/lighthouse'

/** Compact coloured score number for tables. Colour is never the only signal (see aria-label/title). */
export function ScorePill({ score }: { score: number | null | undefined }) {
  const rating = scoreRating(score)
  if (!rating) return <span className="text-fg-subtle">—</span>
  const s = RATING_STYLES[rating]
  return (
    <span title={RATING_LABELS[rating]} aria-label={`${formatScore(score)} (${RATING_LABELS[rating]})`} className={`inline-flex min-w-8 justify-center rounded px-1.5 py-px text-[13px] font-semibold tabular-nums ${s.bg} ${s.text}`}>
      {formatScore(score)}
    </span>
  )
}

/** Circular Lighthouse-style score gauge. */
export function ScoreGauge({ label, score, size = 84 }: { label: string; score: number | null | undefined; size?: number }) {
  const rating = scoreRating(score)
  const r = 44
  const c = 2 * Math.PI * r
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100
  const color = rating ? RATING_STYLES[rating].text : 'text-fg-subtle'
  return (
    <figure className="flex flex-col items-center gap-2 text-center">
      <div className={`relative ${color}`} style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="7" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tracking-tight tabular-nums">{formatScore(score)}</span>
      </div>
      <figcaption className="text-[13px] font-medium text-fg-secondary">
        {label}
        {rating && <span className="sr-only"> — {RATING_LABELS[rating]}</span>}
      </figcaption>
    </figure>
  )
}

/**
 * Score tile with a horizontal meter — used for averages on the dashboard, project and run summary.
 * Shows the number, the Lighthouse rating in words, and a bar filled to the score.
 */
export function ScoreMeter({ label, score, hint }: { label: string; score: number | null | undefined; hint?: string }) {
  const rating = scoreRating(score)
  const s = rating ? RATING_STYLES[rating] : null
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <dt className="text-[13px] font-medium text-fg-muted">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl leading-none font-semibold tracking-tight tabular-nums ${s ? s.text : 'text-fg-subtle'}`}>{formatScore(score)}</span>
        <span className="text-xs text-fg-muted">{rating ? RATING_LABELS[rating] : (hint ?? 'Not tested yet')}</span>
      </dd>
      <dd className="mt-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {s && <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }} />}
      </dd>
    </div>
  )
}

/** "+7 ↑" / "-15 ↓" / "±2" — renders nothing when there's no previous score. */
export function ScoreDelta({ current, previous, showUnchanged = true }: { current: number | null | undefined; previous: number | null | undefined; showUnchanged?: boolean }) {
  const cmp = compareScores(current, previous)
  if (!cmp) return null
  if (cmp.trend === 'unchanged') {
    if (!showUnchanged) return null
    return (
      <span className="text-xs text-fg-muted tabular-nums" title={`Previous: ${cmp.previous}`}>
        {cmp.diff === 0 ? '±0' : formatSignedDiff(cmp.diff)}
      </span>
    )
  }
  const up = cmp.trend === 'improved'
  return (
    <span
      className={`text-xs font-semibold whitespace-nowrap tabular-nums ${up ? 'text-good' : 'text-poor'}`}
      title={`Previous: ${cmp.previous}`}
      aria-label={`${up ? 'Improved' : 'Regressed'} by ${Math.abs(cmp.diff)} points from ${cmp.previous}`}
    >
      {up ? '↑' : '↓'} {formatSignedDiff(cmp.diff)}
    </span>
  )
}
