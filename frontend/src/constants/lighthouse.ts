import type { MetricKey, ScoreKey } from '../types/api'

/**
 * Lighthouse's documented colour bands for scores (same for category scores 0–100
 * and audit/metric scores 0–1 scaled to 0–100):
 *   90–100 Good · 50–89 Needs Improvement · 0–49 Poor
 * Source: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
 */
export const SCORE_BANDS = { good: 90, needsImprovement: 50 } as const

/**
 * Score change (in points) below which a difference is treated as "no significant change".
 * Lighthouse results naturally vary by a few points between runs; this is a product decision
 * and can be tuned (or moved to the backend) later.
 */
export const SIGNIFICANT_SCORE_CHANGE = 5

export const SCORE_LABELS: Record<ScoreKey, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  best_practices: 'Best Practices',
  seo: 'SEO',
}

export const SCORE_KEYS: ScoreKey[] = ['performance', 'accessibility', 'best_practices', 'seo']

export const METRIC_LABELS: Record<MetricKey, { short: string; long: string }> = {
  fcp: { short: 'FCP', long: 'First Contentful Paint' },
  lcp: { short: 'LCP', long: 'Largest Contentful Paint' },
  tbt: { short: 'TBT', long: 'Total Blocking Time' },
  cls: { short: 'CLS', long: 'Cumulative Layout Shift' },
  speed_index: { short: 'SI', long: 'Speed Index' },
}

export const METRIC_KEYS: MetricKey[] = ['fcp', 'lcp', 'tbt', 'cls', 'speed_index']
