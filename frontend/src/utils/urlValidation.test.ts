import { describe, expect, it } from 'vitest'
import { parseUrlList, validateUrl } from './urlValidation'

describe('validateUrl', () => {
  it('accepts http and https URLs', () => {
    expect(validateUrl('https://example.com/about')).toEqual({ ok: true, url: 'https://example.com/about' })
    expect(validateUrl('http://sub.example.co.in/')).toMatchObject({ ok: true })
  })

  it('rejects URLs without a scheme', () => {
    expect(validateUrl('example.com/about')).toEqual({ ok: false, reason: 'invalid_format' })
  })

  it('rejects non-http schemes', () => {
    expect(validateUrl('ftp://example.com')).toEqual({ ok: false, reason: 'unsupported_scheme' })
  })

  it('rejects hosts without a domain', () => {
    expect(validateUrl('https://localhost')).toEqual({ ok: false, reason: 'missing_host' })
    expect(validateUrl('https://exa mple.com')).toEqual({ ok: false, reason: 'invalid_format' })
  })

  it('strips fragments', () => {
    expect(validateUrl('https://example.com/a#top')).toEqual({ ok: true, url: 'https://example.com/a' })
  })
})

describe('parseUrlList', () => {
  it('keeps valid URLs when some are invalid, and reports duplicates', () => {
    const r = parseUrlList(
      ['https://example.com/', '', 'example.com/about', 'https://example.com/contact', 'https://example.com/'].join('\n'),
    )
    expect(r.total).toBe(4)
    expect(r.valid).toEqual(['https://example.com/', 'https://example.com/contact'])
    expect(r.invalid).toEqual([{ input: 'example.com/about', reason: 'invalid_format' }])
    expect(r.duplicates).toEqual(['https://example.com/'])
  })

  it('handles empty input', () => {
    expect(parseUrlList('  \n \n')).toEqual({ total: 0, valid: [], invalid: [], duplicates: [] })
  })
})
