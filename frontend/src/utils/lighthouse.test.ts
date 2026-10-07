import { describe, expect, it } from 'vitest'
import { compareScores, metricRating, scoreRating } from './lighthouse'

describe('scoreRating (Lighthouse bands)', () => {
  it.each([
    [100, 'good'],
    [90, 'good'],
    [89, 'needs_improvement'],
    [50, 'needs_improvement'],
    [49, 'poor'],
    [0, 'poor'],
  ])('%i → %s', (score, rating) => {
    expect(scoreRating(score)).toBe(rating)
  })

  it('returns null for missing scores', () => {
    expect(scoreRating(null)).toBeNull()
  })
})

describe('metricRating', () => {
  it('uses the 0–1 audit score', () => {
    expect(metricRating(0.95)).toBe('good')
    expect(metricRating(0.5)).toBe('needs_improvement')
    expect(metricRating(0.2)).toBe('poor')
    expect(metricRating(null)).toBeNull()
  })
})

describe('compareScores', () => {
  it('detects improvements and regressions', () => {
    expect(compareScores(95, 88)).toEqual({ current: 95, previous: 88, diff: 7, trend: 'improved' })
    expect(compareScores(76, 91)).toEqual({ current: 76, previous: 91, diff: -15, trend: 'regressed' })
    expect(compareScores(90, 88)?.trend).toBe('unchanged')
  })

  it('returns null when there is no previous score', () => {
    expect(compareScores(90, null)).toBeNull()
  })
})
