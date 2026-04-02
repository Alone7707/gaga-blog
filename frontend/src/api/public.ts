import { request } from './http'
import type {
  PublicCategoryListResponse,
  PublicCategoryPostsResponse,
  PublicPostDetailResponse,
  PublicPostListQuery,
  PublicPostListResponse,
  PublicSearchQuery,
  PublicSearchResponse,
  PublicTagListResponse,
  PublicTagPostsResponse,
} from '../types/public'

// 公开文章、分类、标签、搜索接口统一收口，避免页面重复拼接参数。
export function getPublicPosts(params: PublicPostListQuery = {}) {
  return request<PublicPostListResponse>({
    url: '/api/public/posts',
    method: 'get',
    params: buildPublicListParams(params),
  })
}

export function getPublicPostDetail(slug: string) {
  return request<PublicPostDetailResponse>({
    url: `/api/public/posts/${slug}`,
    method: 'get',
  })
}

export function getPublicCategories() {
  return request<PublicCategoryListResponse>({
    url: '/api/public/categories',
    method: 'get',
  })
}

export function getPublicCategoryPosts(slug: string, params: PublicPostListQuery = {}) {
  return request<PublicCategoryPostsResponse>({
    url: `/api/public/categories/${slug}/posts`,
    method: 'get',
    params: buildPublicListParams(params),
  })
}

export function getPublicTags() {
  return request<PublicTagListResponse>({
    url: '/api/public/tags',
    method: 'get',
  })
}

export function getPublicTagPosts(slug: string, params: PublicPostListQuery = {}) {
  return request<PublicTagPostsResponse>({
    url: `/api/public/tags/${slug}/posts`,
    method: 'get',
    params: buildPublicListParams(params),
  })
}

export function searchPublicPosts(params: PublicSearchQuery) {
  return request<PublicSearchResponse>({
    url: '/api/public/search',
    method: 'get',
    params: buildPublicSearchParams(params),
  })
}

function buildPublicListParams(params: PublicPostListQuery) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
  }
}

function buildPublicSearchParams(params: PublicSearchQuery) {
  return {
    q: params.q.trim(),
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  }
}
