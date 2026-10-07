import type { Rating } from '../utils/lighthouse'

export const RATING_STYLES: Record<Rating, { text: string; bg: string; dot: string }> = {
  good: { text: 'text-good', bg: 'bg-good-bg', dot: 'bg-good' },
  needs_improvement: { text: 'text-warn', bg: 'bg-warn-bg', dot: 'bg-warn' },
  poor: { text: 'text-poor', bg: 'bg-poor-bg', dot: 'bg-poor' },
}
