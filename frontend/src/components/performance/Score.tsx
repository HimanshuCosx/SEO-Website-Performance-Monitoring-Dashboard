import { formatScore, formatSignedDiff } from '../../utils/format'
import { compareScores, RATING_LABELS, scoreRating } from '../../utils/lighthouse'
import { RATING_STYLES } from '../../constants/ratingStyles'

/** Compact coloured score number for tables. Colour is never the only signal (see aria-label/title). */
export function ScorePill({ score }: { score: number | null | undefined }) {
  const rating = scoreRating(score)
  if (!rating) return <span className="text-slate-400">—</span>
  const s = RATING_STYLES[rating]
  return (
    <span title={RATING_LABELS[rating]} aria-label={`${formatScore(score)} (${RATING_LABELS[rating]})`} className={`inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-sm font-semibold tabular-nums ${s.bg} ${s.text}`}>
      {formatScore(score)}
    </span>
  )
}

/** Circular Lighthouse-style score gauge. */
export function ScoreGauge({ label, score, size = 88 }: { label: string; score: number | null | undefined; size?: number }) {
  const rating = scoreRating(score)
  const r = 42
  const c = 2 * Math.PI * r
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100
  const color = rating ? RATING_STYLES[rating].text : 'text-slate-300'
  return (
    <figure className="flex flex-col items-center gap-2 text-center">
      <div className={`relative ${color}`} style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">{formatScore(score)}</span>
      </div>
      <figcaption className="text-sm font-medium text-slate-700">
        {label}
        {rating && <span className="sr-only"> — {RATING_LABELS[rating]}</span>}
      </figcaption>
    </figure>
  )
}

/** "+7 ↑" / "-15 ↓" / "±2" — renders nothing when there's no previous score. */
export function ScoreDelta({ current, previous, showUnchanged = true }: { current: number | null | undefined; previous: number | null | undefined; showUnchanged?: boolean }) {
  const cmp = compareScores(current, previous)
  if (!cmp) return null
  if (cmp.trend === 'unchanged') {
    if (!showUnchanged) return null
    return (
      <span className="text-xs text-slate-500" title={`Previous: ${cmp.previous}`}>
        {cmp.diff === 0 ? '±0' : formatSignedDiff(cmp.diff)}
      </span>
    )
  }
  const up = cmp.trend === 'improved'
  return (
    <span
      className={`text-xs font-semibold whitespace-nowrap ${up ? 'text-good' : 'text-poor'}`}
      title={`Previous: ${cmp.previous}`}
      aria-label={`${up ? 'Improved' : 'Regressed'} by ${Math.abs(cmp.diff)} points from ${cmp.previous}`}
    >
      {formatSignedDiff(cmp.diff)} {up ? '↑' : '↓'}
    </span>
  )
}
