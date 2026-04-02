import type { PostCategory, PostTag } from './post'

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AdminCategoryItem extends PostCategory {
  sortOrder: number
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminTagItem extends PostTag {
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminCategoryListQuery {
  page?: number
  pageSize?: number
  keyword?: string
  sortBy?: 'sortOrder' | 'createdAt' | 'updatedAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface AdminTagListQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface AdminCategoryMutationPayload {
  name: string
  slug?: string
  description?: string
  sortOrder?: number
}

export interface AdminTagMutationPayload {
  name: string
  slug?: string
}

export interface AdminCategoryListResponse {
  list: AdminCategoryItem[]
  pagination: PaginationMeta
}

export interface AdminTagListResponse {
  list: AdminTagItem[]
  pagination: PaginationMeta
}

export interface AdminCategoryMutationResponse {
  category: AdminCategoryItem
}

export interface AdminTagMutationResponse {
  tag: AdminTagItem
}
