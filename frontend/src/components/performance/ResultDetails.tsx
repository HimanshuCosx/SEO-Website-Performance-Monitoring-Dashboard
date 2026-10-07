import { METRIC_KEYS, METRIC_LABELS, SCORE_KEYS, SCORE_LABELS } from '../../constants/lighthouse'
import type { UrlTestResult } from '../../types/api'
import { formatMetric } from '../../utils/format'
import { metricRating, metricValue } from '../../utils/lighthouse'
import { RatingBadge } from '../common/StatusBadge'
import { ScoreDelta, ScoreGauge } from './Score'

/** The four Lighthouse category gauges, with change vs the previous completed test when available. */
export function ScoresOverview({ result }: { result: UrlTestResult }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {SCORE_KEYS.map((key) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <ScoreGauge label={SCORE_LABELS[key]} score={result.scores?.[key]} />
          {result.previous_scores && (
            <div className="flex items-center gap-1 text-xs text-fg-muted">
              <span>Prev {result.previous_scores[key] ?? '—'}</span>
              <ScoreDelta current={result.scores?.[key]} previous={result.previous_scores[key]} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/** FCP, LCP, TBT, CLS, Speed Index with Lighthouse ratings (from the backend's audit scores). */
export function MetricsList({ result }: { result: UrlTestResult }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {METRIC_KEYS.map((key) => (
        <div key={key} className="rounded-lg border border-line bg-subtle/50 p-3.5">
          <dt className="flex items-baseline justify-between gap-2 text-[13px] text-fg-muted">
            <span>{METRIC_LABELS[key].long}</span>
            <span className="text-[11px] font-medium text-fg-subtle">{METRIC_LABELS[key].short}</span>
          </dt>
          <dd className="mt-2 text-xl leading-none font-semibold tracking-tight text-fg tabular-nums">{formatMetric(key, metricValue(result.metrics, key))}</dd>
          <dd className="mt-2.5">
            <RatingBadge rating={metricRating(result.metric_scores?.[key])} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
