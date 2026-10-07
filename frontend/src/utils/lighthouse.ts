import { SCORE_BANDS, SIGNIFICANT_SCORE_CHANGE } from '../constants/lighthouse'
import type { MetricKey, Metrics } from '../types/api'

export type Rating = 'good' | 'needs_improvement' | 'poor'

export const RATING_LABELS: Record<Rating, string> = {
  good: 'Good',
  needs_improvement: 'Needs Improvement',
  poor: 'Poor',
}

/** Rating for a 0–100 category score, using Lighthouse's colour bands. */
export function scoreRating(score: number | null | undefined): Rating | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null
  if (score >= SCORE_BANDS.good) return 'good'
  if (score >= SCORE_BANDS.needsImprovement) return 'needs_improvement'
  return 'poor'
}

/** Rating for a metric, from its Lighthouse audit score (0–1) supplied by the backend. */
export function metricRating(auditScore: number | null | undefined): Rating | null {
  if (auditScore === null || auditScore === undefined) return null
  return scoreRating(Math.round(auditScore * 100))
}

export type Trend = 'improved' | 'regressed' | 'unchanged'

export interface ScoreComparison {
  current: number
  previous: number
  diff: number
  trend: Trend
}

/** Returns null when either score is missing — never invent a comparison. */
export function compareScores(
  current: number | null | undefined,
  previous: number | null | undefined,
  threshold = SIGNIFICANT_SCORE_CHANGE,
): ScoreComparison | null {
  if (current === null || current === undefined || previous === null || previous === undefined) return null
  const diff = current - previous
  const trend: Trend = diff >= threshold ? 'improved' : diff <= -threshold ? 'regressed' : 'unchanged'
  return { current, previous, diff, trend }
}

/** Maps a metric key to its value in the backend `metrics` object. */
export function metricValue(metrics: Metrics | null | undefined, key: MetricKey): number | null {
  if (!metrics) return null
  switch (key) {
    case 'fcp':
      return metrics.fcp_ms
    case 'lcp':
      return metrics.lcp_ms
    case 'tbt':
      return metrics.tbt_ms
    case 'cls':
      return metrics.cls
    case 'speed_index':
      return metrics.speed_index_ms
  }
}
