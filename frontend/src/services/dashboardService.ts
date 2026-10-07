import type { DashboardSummary } from '../types/api'
import { api } from './api'

export const dashboardService = {
  getSummary: (signal?: AbortSignal) => api.get<DashboardSummary>('/dashboard/summary/', { signal }),
}
