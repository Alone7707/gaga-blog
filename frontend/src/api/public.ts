import { request } from './http'
import type {
  PublicArchiveQuery,
  PublicArchiveResponse,
  PublicCategoryListResponse,
  PublicCategoryPostsResponse,
  PublicCommentListResponse,
  PublicCreateCommentPayload,
  PublicCreateCommentResponse,
  PublicPostDetailResponse,
  PublicPostListQuery,
  PublicPostListResponse,
  PublicSearchQuery,
  PublicSearchResponse,
  PublicTagListResponse,
  PublicTagPostsResponse,
} from '../types/public'

// 公开文章、分类、标签、搜索、归档和评论接口统一收口，避免页面重复拼接参数。
export function getPublicPosts(params: PublicPostListQuery = {}) {
  return request<PublicPostListResponse>({
    url: '/api/public/posts',
    method: 'get',
    params: buildPublicListParams(params),
  }).then(normalizePublicPostListResponse)
}

export function getPublicPostDetail(slug: string) {
  return request<{ post: PublicPostDetailResponse }>({
    url: `/api/public/posts/${slug}`,
    method: 'get',
  }).then((response) => response.post)
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
  }).then(normalizePublicCategoryPostsResponse)
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
  }).then(normalizePublicTagPostsResponse)
}

export function searchPublicPosts(params: PublicSearchQuery) {
  return request<PublicSearchResponse>({
    url: '/api/public/search',
    method: 'get',
    params: buildPublicSearchParams(params),
  }).then(normalizePublicSearchResponse)
}

export function getPublicArchives(params: PublicArchiveQuery = {}) {
  return request<PublicArchiveResponse>({
    url: '/api/public/archives',
    method: 'get',
    params: buildPublicArchiveParams(params),
  }).then(normalizePublicArchiveResponse)
}

export function getPublicComments(slug: string) {
  return request<PublicCommentListResponse>({
    url: `/api/public/posts/${slug}/comments`,
    method: 'get',
  }).then(normalizePublicCommentListResponse)
}

export function createPublicComment(slug: string, payload: PublicCreateCommentPayload) {
  return request<{ comment: PublicCreateCommentResponse }>({
    url: `/api/public/posts/${slug}/comments`,
    method: 'post',
    data: buildPublicCommentPayload(payload),
  }).then((response) => response.comment)
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

function buildPublicArchiveParams(params: PublicArchiveQuery) {
  return {
    page: params.page ?? 1,
  }
}

function buildPublicCommentPayload(payload: PublicCreateCommentPayload) {
  return {
    authorName: payload.authorName.trim(),
    ...(payload.authorEmail?.trim() ? { authorEmail: payload.authorEmail.trim() } : {}),
    ...(payload.authorWebsite?.trim() ? { authorWebsite: payload.authorWebsite.trim() } : {}),
    content: payload.content.trim(),
    ...(payload.parentId?.trim() ? { parentId: payload.parentId.trim() } : {}),
  }
}

function normalizePublicPostListResponse(response: PublicPostListResponse): PublicPostListResponse {
  return {
    list: Array.isArray(response.list) ? response.list : [],
    pagination: normalizePublicPagination(response.pagination),
  }
}

function normalizePublicCategoryPostsResponse(response: PublicCategoryPostsResponse): PublicCategoryPostsResponse {
  return {
    ...response,
    list: Array.isArray(response.list) ? response.list : [],
    pagination: normalizePublicPagination(response.pagination),
  }
}

function normalizePublicTagPostsResponse(response: PublicTagPostsResponse): PublicTagPostsResponse {
  return {
    ...response,
    list: Array.isArray(response.list) ? response.list : [],
    pagination: normalizePublicPagination(response.pagination),
  }
}

function normalizePublicSearchResponse(response: PublicSearchResponse): PublicSearchResponse {
  return {
    ...response,
    keyword: typeof response.keyword === 'string' ? response.keyword : '',
    list: Array.isArray(response.list) ? response.list : [],
    pagination: normalizePublicPagination(response.pagination),
  }
}

function normalizePublicArchiveResponse(response: PublicArchiveResponse): PublicArchiveResponse {
  const normalizedList = Array.isArray(response.list) ? response.list : []
  const normalizedPagination = normalizePublicPagination(response.pagination)
  const normalizedTotal = typeof response.total === 'number'
    ? response.total
    : normalizedList.reduce(
        (sum, year) => sum + year.months.reduce((monthSum, month) => monthSum + month.count, 0),
        0,
      )

  return {
    list: normalizedList,
    total: normalizedTotal,
    pagination: normalizedPagination.total > 0 || typeof normalizedPagination !== 'undefined'
      ? normalizedPagination
      : {
          page: 1,
          pageSize: normalizedTotal || 10,
          total: normalizedTotal,
          totalPages: normalizedTotal > 0 ? 1 : 0,
        },
  }
}

function normalizePublicCommentListResponse(response: PublicCommentListResponse): PublicCommentListResponse {
  return {
    list: Array.isArray(response.list) ? response.list : [],
  }
}

function normalizePublicPagination(pagination?: PublicPostListResponse['pagination']) {
  return {
    page: typeof pagination?.page === 'number' ? pagination.page : 1,
    pageSize: typeof pagination?.pageSize === 'number' ? pagination.pageSize : 10,
    total: typeof pagination?.total === 'number' ? pagination.total : 0,
    totalPages: typeof pagination?.totalPages === 'number' ? pagination.totalPages : 0,
  }
}
