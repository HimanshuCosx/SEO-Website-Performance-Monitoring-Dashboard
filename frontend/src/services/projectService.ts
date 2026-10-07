import type { ID, PageParams, Paginated, Project, ProjectInput } from '../types/api'
import { api } from './api'

export interface ProjectListParams extends PageParams {
  search?: string
}

export const projectService = {
  list: (params: ProjectListParams = {}, signal?: AbortSignal) =>
    api.get<Paginated<Project>>('/projects/', { query: { ...params }, signal }),

  get: (projectId: ID, signal?: AbortSignal) => api.get<Project>(`/projects/${projectId}/`, { signal }),

  create: (input: ProjectInput) => api.post<Project>('/projects/', input),

  update: (projectId: ID, input: Partial<ProjectInput>) => api.patch<Project>(`/projects/${projectId}/`, input),

  remove: (projectId: ID) => api.delete(`/projects/${projectId}/`),
}
