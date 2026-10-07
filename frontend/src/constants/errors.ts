import type { ResultErrorCode, UrlRejectionReason } from '../types/api'

export const RESULT_ERROR_LABELS: Record<ResultErrorCode, string> = {
  timeout: 'Timeout',
  invalid_url: 'Invalid URL',
  page_unavailable: 'Page unavailable',
  pagespeed_api_error: 'PageSpeed API error',
  rate_limited: 'Rate limit reached',
  backend_error: 'Backend error',
  unknown: 'Unknown error',
}

export const URL_REJECTION_LABELS: Record<UrlRejectionReason, string> = {
  invalid_format: 'Invalid URL format',
  duplicate: 'Already in this project',
  unsupported_scheme: 'Only http/https supported',
  other: 'Rejected by server',
}
