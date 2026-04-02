import { request } from './http'
import type {
  AdminCategoryListQuery,
  AdminCategoryListResponse,
  AdminCategoryMutationPayload,
  AdminCategoryMutationResponse,
  AdminTagListQuery,
  AdminTagListResponse,
  AdminTagMutationPayload,
  AdminTagMutationResponse,
} from '../types/taxonomy'

// 分类与标签相关接口统一收口，避免页面直接拼接请求结构。
export function getAdminCategories(params: AdminCategoryListQuery = {}) {
  return request<AdminCategoryListResponse>({
    url: '/api/admin/categories',
    method: 'get',
    params: buildCategoryListParams(params),
  })
}

export function createAdminCategory(payload: AdminCategoryMutationPayload) {
  return request<AdminCategoryMutationResponse>({
    url: '/api/admin/categories',
    method: 'post',
    data: buildCategoryPayload(payload),
  })
}

export function updateAdminCategory(id: string, payload: AdminCategoryMutationPayload) {
  return request<AdminCategoryMutationResponse>({
    url: `/api/admin/categories/${id}`,
    method: 'patch',
    data: buildCategoryPayload(payload),
  })
}

export function getAdminTags(params: AdminTagListQuery = {}) {
  return request<AdminTagListResponse>({
    url: '/api/admin/tags',
    method: 'get',
    params: buildTagListParams(params),
  })
}

export function createAdminTag(payload: AdminTagMutationPayload) {
  return request<AdminTagMutationResponse>({
    url: '/api/admin/tags',
    method: 'post',
    data: buildTagPayload(payload),
  })
}

export function updateAdminTag(id: string, payload: AdminTagMutationPayload) {
  return request<AdminTagMutationResponse>({
    url: `/api/admin/tags/${id}`,
    method: 'patch',
    data: buildTagPayload(payload),
  })
}

function buildCategoryListParams(params: AdminCategoryListQuery) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
  }
}

function buildTagListParams(params: AdminTagListQuery) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
  }
}

function buildCategoryPayload(payload: AdminCategoryMutationPayload) {
  const name = payload.name.trim()
  const slug = payload.slug?.trim()
  const description = payload.description?.trim()

  return {
    name,
    ...(slug ? { slug } : {}),
    ...(description ? { description } : {}),
    ...(typeof payload.sortOrder === 'number' ? { sortOrder: payload.sortOrder } : {}),
  }
}

function buildTagPayload(payload: AdminTagMutationPayload) {
  const name = payload.name.trim()
  const slug = payload.slug?.trim()

  return {
    name,
    ...(slug ? { slug } : {}),
  }
}
