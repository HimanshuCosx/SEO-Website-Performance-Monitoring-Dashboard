import type { Rating } from '../utils/lighthouse'

/** Visual treatment for each Lighthouse rating band. Uses theme tokens, so it works in light and dark mode. */
export const RATING_STYLES: Record<Rating, { text: string; bg: string; bar: string; tone: 'good' | 'warn' | 'poor' }> = {
  good: { text: 'text-good', bg: 'bg-good-soft', bar: 'bg-good', tone: 'good' },
  needs_improvement: { text: 'text-warn', bg: 'bg-warn-soft', bar: 'bg-warn', tone: 'warn' },
  poor: { text: 'text-poor', bg: 'bg-poor-soft', bar: 'bg-poor', tone: 'poor' },
}
