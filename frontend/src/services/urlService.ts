import type {
  BulkAddUrlsResponse,
  ID,
  PageParams,
  Paginated,
  ProjectUrl,
  UrlListParams,
  UrlTestResult,
} from '../types/api'
import { api } from './api'

export const urlService = {
  list: (projectId: ID, params: UrlListParams = {}, signal?: AbortSignal) =>
    api.get<Paginated<ProjectUrl>>(`/projects/${projectId}/urls/`, { query: { ...params }, signal }),

  get: (urlId: ID, signal?: AbortSignal) => api.get<ProjectUrl>(`/urls/${urlId}/`, { signal }),

  /** Adds many URLs at once. Valid URLs are created even if some are rejected. */
  addBulk: (projectId: ID, urls: string[]) =>
    api.post<BulkAddUrlsResponse>(`/projects/${projectId}/urls/`, { urls }),

  update: (urlId: ID, url: string) => api.patch<ProjectUrl>(`/urls/${urlId}/`, { url }),

  remove: (urlId: ID) => api.delete(`/urls/${urlId}/`),

  /** Every result for this URL, newest first. */
  history: (urlId: ID, params: PageParams = {}, signal?: AbortSignal) =>
    api.get<Paginated<UrlTestResult>>(`/urls/${urlId}/history/`, { query: { ...params }, signal }),
}
