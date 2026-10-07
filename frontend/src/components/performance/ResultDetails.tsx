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
            <div className="flex items-center gap-1 text-xs text-slate-500">
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
        <div key={key} className="rounded-lg border border-slate-200 p-3">
          <dt className="text-sm text-slate-500" title={METRIC_LABELS[key].long}>
            {METRIC_LABELS[key].long} <span className="text-slate-400">({METRIC_LABELS[key].short})</span>
          </dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{formatMetric(key, metricValue(result.metrics, key))}</dd>
          <dd className="mt-1">
            <RatingBadge rating={metricRating(result.metric_scores?.[key])} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
