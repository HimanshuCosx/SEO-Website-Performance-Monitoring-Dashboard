import { describe, expect, it } from 'vitest'
import { formatDuration, formatMetric, urlPath } from './format'

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(143)).toBe('2m 23s')
    expect(formatDuration(765)).toBe('12m 45s')
    expect(formatDuration(9)).toBe('9s')
    expect(formatDuration(3725)).toBe('1h 2m 5s')
    expect(formatDuration(null)).toBe('—')
  })
})

describe('formatMetric', () => {
  it('formats timings and CLS', () => {
    expect(formatMetric('fcp', 1200)).toBe('1.2 s')
    expect(formatMetric('lcp', 850)).toBe('850 ms')
    expect(formatMetric('tbt', 150)).toBe('150 ms')
    expect(formatMetric('cls', 0.02)).toBe('0.02')
    expect(formatMetric('cls', 0)).toBe('0')
    expect(formatMetric('speed_index', null)).toBe('—')
  })
})

describe('urlPath', () => {
  it('returns the path portion', () => {
    expect(urlPath('https://example.com/about?x=1')).toBe('/about?x=1')
    expect(urlPath('https://example.com')).toBe('/')
  })
})
